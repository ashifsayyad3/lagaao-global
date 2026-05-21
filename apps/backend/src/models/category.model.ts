import {
  Table, Column, Model, DataType, HasMany, BelongsTo, ForeignKey
} from 'sequelize-typescript';

@Table({ tableName: 'categories', paranoid: true })
export class Category extends Model {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(120), allowNull: false, unique: true })
  slug!: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  image!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, allowNull: true })
  parentId!: number | null;

  @BelongsTo(() => Category, 'parentId')
  parent!: Category | null;

  @HasMany(() => Category, 'parentId')
  children!: Category[];

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  sortOrder!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;
}
