import path from 'path';
import fs   from 'fs';
import crypto from 'crypto';
import type { Express } from 'express';
import { env }       from '../../config/env';
import { logger }    from '../../config/logger';
import { AppError }  from '../../middleware/errorHandler.middleware';
import { MediaFile } from '../../models';
import { getPagination } from '../../shared/utils/paginate.util';
import type { Request } from 'express';

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'image/avif', 'application/pdf',
]);

// ─── S3 client (lazy import — @aws-sdk/client-s3 is optional) ─
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getS3(): Promise<any> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_S3_BUCKET) {
    throw new AppError('S3 not configured', 503);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sdk = require('@aws-sdk/client-s3') as {
      S3Client: new (opts: unknown) => { send(cmd: unknown): Promise<void> };
      PutObjectCommand:    new (opts: unknown) => unknown;
      DeleteObjectCommand: new (opts: unknown) => unknown;
    };
    const client = new sdk.S3Client({
      region:      env.AWS_REGION ?? 'ap-south-1',
      credentials: {
        accessKeyId:     env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
    return { client, PutObjectCommand: sdk.PutObjectCommand, DeleteObjectCommand: sdk.DeleteObjectCommand, bucket: env.AWS_S3_BUCKET };
  } catch {
    throw new AppError('@aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3', 503);
  }
}

export interface UploadResult {
  id:           number;
  url:          string;
  originalName: string;
  fileName:     string;
  mimeType:     string;
  size:         number;
  storage:      string;
  width:        number | null;
  height:       number | null;
}

export class UploadsService {

  /** Ensure local upload directory exists */
  private ensureDir(): string {
    const dir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  /** Generate a unique file name preserving the extension */
  private uniqueFileName(originalName: string): string {
    const ext  = path.extname(originalName).toLowerCase();
    const hash = crypto.randomBytes(16).toString('hex');
    return `${Date.now()}-${hash}${ext}`;
  }

  /**
   * Upload a single file.
   * Multer has already written the file to disk (diskStorage mode for local).
   */
  async upload(
    file:       Express.Multer.File,
    userId:     number,
    entityType?: string,
    entityId?:   number,
    altText?:    string,
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      // Clean up temp file
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError(`File type "${file.mimetype}" is not allowed`, 400);
    }

    const maxBytes = env.UPLOAD_MAX_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError(`File exceeds maximum size of ${env.UPLOAD_MAX_MB}MB`, 400);
    }

    let url:     string;
    let filePath: string | null  = null;
    let bucket:  string | null   = null;
    let s3Key:   string | null   = null;
    let storage: 'local' | 's3' = env.UPLOAD_STORAGE;

    const fileName = this.uniqueFileName(file.originalname);

    if (env.UPLOAD_STORAGE === 's3') {
      // ── S3 upload ─────────────────────────────────
      try {
        const s3 = await getS3();
        s3Key  = `uploads/${fileName}`;
        bucket = s3.bucket;

        const fileBuffer = fs.existsSync(file.path)
          ? fs.readFileSync(file.path)
          : file.buffer;

        await s3.client.send(new s3.PutObjectCommand({
          Bucket:      s3.bucket,
          Key:         s3Key,
          Body:        fileBuffer,
          ContentType: file.mimetype,
          ACL:         'public-read' as never,
          Metadata:    { originalName: file.originalname, uploadedBy: String(userId) },
        }));

        // Cleanup temp disk file if multer wrote it
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

        const cdnBase = env.AWS_S3_CDN_URL ?? `https://${s3.bucket}.s3.${env.AWS_REGION ?? 'ap-south-1'}.amazonaws.com`;
        url = `${cdnBase}/${s3Key}`;
      } catch (err) {
        logger.error('S3 upload failed — falling back to local', { err });
        storage = 'local';
        // Fall through to local logic below
        const dir = this.ensureDir();
        const dest = path.join(dir, fileName);
        if (file.path && fs.existsSync(file.path)) {
          fs.renameSync(file.path, dest);
        } else if (file.buffer) {
          fs.writeFileSync(dest, file.buffer);
        }
        filePath = dest;
        url      = `/uploads/${fileName}`;
      }
    }

    if (storage === 'local') {
      // ── Local disk ────────────────────────────────
      const dir  = this.ensureDir();
      const dest = path.join(dir, fileName);

      if (file.path && file.path !== dest && fs.existsSync(file.path)) {
        fs.renameSync(file.path, dest);
      } else if (!file.path && file.buffer) {
        fs.writeFileSync(dest, file.buffer);
      } else if (file.path === dest) {
        // Multer diskStorage already wrote to the right place
      }

      filePath = dest;
      url      = `/uploads/${fileName}`;
    }

    const record = await MediaFile.create({
      userId,
      originalName: file.originalname,
      fileName,
      mimeType:    file.mimetype,
      size:        file.size,
      storage,
      url:         url!,
      path:        filePath,
      bucket,
      key:         s3Key,
      entityType:  entityType ?? null,
      entityId:    entityId   ?? null,
      altText:     altText    ?? null,
      width:       null,
      height:      null,
    });

    return {
      id:           record.id,
      url:          record.url,
      originalName: record.originalName,
      fileName:     record.fileName,
      mimeType:     record.mimeType,
      size:         record.size,
      storage:      record.storage,
      width:        record.width,
      height:       record.height,
    };
  }

  /** Upload multiple files */
  async uploadMany(
    files:       Express.Multer.File[],
    userId:      number,
    entityType?: string,
    entityId?:   number,
  ): Promise<UploadResult[]> {
    return Promise.all(files.map(f => this.upload(f, userId, entityType, entityId)));
  }

  /** Delete a file record and the underlying asset */
  async delete(fileId: number, userId: number, isAdmin = false): Promise<void> {
    const record = await MediaFile.findByPk(fileId);
    if (!record) throw new AppError('File not found', 404);
    if (!isAdmin && record.userId !== userId) throw new AppError('Forbidden', 403);

    if (record.storage === 's3' && record.key) {
      try {
        const s3 = await getS3();
        await s3.client.send(new s3.DeleteObjectCommand({ Bucket: record.bucket!, Key: record.key }));
      } catch (err) {
        logger.warn('S3 delete failed', { err, fileId });
      }
    } else if (record.path && fs.existsSync(record.path)) {
      fs.unlinkSync(record.path);
    }

    await record.destroy();
  }

  /** List files — vendor sees own files, admin sees all */
  async list(req: Request, userId?: number): Promise<{ rows: MediaFile[]; count: number }> {
    const { limit, offset, page } = getPagination(req, 24);
    const entityType = req.query['entityType'] as string | undefined;
    const where: Record<string, unknown> = {};
    if (userId) where['userId'] = userId;
    if (entityType) where['entityType'] = entityType;
    const result = await MediaFile.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
    return { ...result, page } as typeof result;
  }
}

export const uploadsService = new UploadsService();
