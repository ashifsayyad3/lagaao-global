import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

// ─── Banner ───────────────────────────────────────────────────
export type BannerPosition = 'hero' | 'mid' | 'category' | 'popup';

@Table({ tableName: 'banners', paranoid: true })
export class Banner extends Model {
  @Column({ type: DataType.STRING(200), allowNull: false })
  title!: string;

  @Column({ type: DataType.STRING(300), allowNull: true })
  subtitle!: string | null;

  @Column({ type: DataType.STRING(600), allowNull: false })
  image!: string;

  @Column({ type: DataType.STRING(400), allowNull: true })
  mobilImage!: string | null;

  @Column({ type: DataType.STRING(400), allowNull: true })
  link!: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  ctaLabel!: string | null;

  @Column({
    type: DataType.ENUM('hero', 'mid', 'category', 'popup'),
    defaultValue: 'hero',
  })
  position!: BannerPosition;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  sortOrder!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  startDate!: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  endDate!: Date | null;

  @Column({ type: DataType.STRING(60), allowNull: true })
  bgColor!: string | null;
}

// ─── Announcement bar ─────────────────────────────────────────
export type AnnouncementType = 'info' | 'warning' | 'success' | 'promo';

@Table({ tableName: 'announcements', paranoid: false, timestamps: true })
export class Announcement extends Model {
  @Column({ type: DataType.STRING(500), allowNull: false })
  message!: string;

  @Column({ type: DataType.STRING(300), allowNull: true })
  link!: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  linkLabel!: string | null;

  @Column({
    type: DataType.ENUM('info', 'warning', 'success', 'promo'),
    defaultValue: 'info',
  })
  type!: AnnouncementType;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  expiresAt!: Date | null;
}

// ─── Newsletter subscriber ────────────────────────────────────
@Table({ tableName: 'newsletter_subscribers', paranoid: false, timestamps: true })
export class NewsletterSubscriber extends Model {
  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(120), allowNull: true })
  name!: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @Column({ type: DataType.STRING(60), allowNull: true })
  source!: string | null;

  @Column({ type: DataType.STRING(64), allowNull: true })
  unsubscribeToken!: string | null;
}

// ─── Blog post ────────────────────────────────────────────────
export type PostStatus = 'draft' | 'published' | 'archived';

@Table({ tableName: 'blog_posts', paranoid: true })
export class BlogPost extends Model {
  @Column({ type: DataType.STRING(300), allowNull: false })
  title!: string;

  @Column({ type: DataType.STRING(320), allowNull: false, unique: true })
  slug!: string;

  @Column({ type: DataType.TEXT('long'), allowNull: false })
  content!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  excerpt!: string | null;

  @Column({ type: DataType.STRING(600), allowNull: true })
  coverImage!: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  authorId!: number | null;

  @BelongsTo(() => User)
  author!: User | null;

  @Column({ type: DataType.JSON, allowNull: true })
  tags!: string[] | null;

  @Column({
    type: DataType.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
  })
  status!: PostStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  publishedAt!: Date | null;

  @Column({ type: DataType.STRING(320), allowNull: true })
  metaTitle!: string | null;

  @Column({ type: DataType.STRING(600), allowNull: true })
  metaDescription!: string | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  viewCount!: number;
}

// ─── CMS static page ─────────────────────────────────────────
@Table({ tableName: 'cms_pages', paranoid: true })
export class CmsPage extends Model {
  @Column({ type: DataType.STRING(200), allowNull: false })
  title!: string;

  @Column({ type: DataType.STRING(220), allowNull: false, unique: true })
  slug!: string;

  @Column({ type: DataType.TEXT('long'), allowNull: false })
  content!: string;

  @Column({ type: DataType.STRING(320), allowNull: true })
  metaTitle!: string | null;

  @Column({ type: DataType.STRING(600), allowNull: true })
  metaDescription!: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isPublished!: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  updatedBy!: number | null;
}
