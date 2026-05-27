import path      from 'path';
import fs        from 'fs';
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadsService } from './uploads.service';
import { authenticate }   from '../../middleware/auth.middleware';
import { authorize }      from '../../middleware/rbac.middleware';
import { Role }           from '../../shared/types/roles';
import { ok, created, paginated, fail } from '../../shared/utils/response.util';
import { getPagination }  from '../../shared/utils/paginate.util';
import { env }            from '../../config/env';

const router = Router();

// ─── Multer config ────────────────────────────────────────────
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (env.UPLOAD_MAX_MB) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif','application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type "${file.mimetype}" is not allowed`));
  },
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/uploads — single file
// ─────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  upload.single('file') as unknown as import('express').RequestHandler,
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return fail(res, 'No file provided', 400);
    try {
      const result = await uploadsService.upload(
        req.file,
        req.user!.id,
        req.body['entityType'],
        req.body['entityId'] ? Number(req.body['entityId']) : undefined,
        req.body['altText'],
      );
      created(res, result, 'File uploaded');
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// POST /api/v1/uploads/bulk — up to 10 files
// ─────────────────────────────────────────────────────────────
router.post(
  '/bulk',
  authenticate,
  upload.array('files', 10) as unknown as import('express').RequestHandler,
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) return fail(res, 'No files provided', 400);
    try {
      const results = await uploadsService.uploadMany(
        files,
        req.user!.id,
        req.body['entityType'],
        req.body['entityId'] ? Number(req.body['entityId']) : undefined,
      );
      created(res, results, `${results.length} file(s) uploaded`);
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// GET /api/v1/uploads — list my files
// ─────────────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPagination(req, 24);
      const { rows, count } = await uploadsService.list(req, req.user!.id);
      paginated(res, rows, page, limit, count);
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/v1/uploads/:id — delete own file
// ─────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(req.user!.role as Role);
      await uploadsService.delete(Number(req.params['id']), req.user!.id, isAdmin);
      ok(res, null, 'File deleted');
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// ADMIN: GET /api/v1/admin/uploads — list all files
// ─────────────────────────────────────────────────────────────
router.get(
  '/admin',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPagination(req, 24);
      const { rows, count } = await uploadsService.list(req);
      paginated(res, rows, page, limit, count);
    } catch (err) { next(err); }
  },
);

export default router;
