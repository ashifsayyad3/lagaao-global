import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, Index } from 'sequelize-typescript';

@Table({ tableName: 'seo_meta', timestamps: true, paranoid: false })
export class SeoMeta extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  /** 'page' | 'product' | 'category' | 'blog' */
  @Index
  @Column({ type: DataType.STRING(30), allowNull: false })
  declare entityType: string;

  @Index
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare entityId: number | null;

  /** For static pages, e.g. '/' '/about' '/contact' */
  @Index
  @Column({ type: DataType.STRING(500), allowNull: true })
  declare path: string | null;

  @Column({ type: DataType.STRING(70), allowNull: true })
  declare metaTitle: string | null;

  @Column({ type: DataType.STRING(160), allowNull: true })
  declare metaDescription: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare keywords: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare canonicalUrl: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare ogImage: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare noIndex: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare schemaMarkup: string | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}
