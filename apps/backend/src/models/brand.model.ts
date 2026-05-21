import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

@Table({ tableName: 'brands', paranoid: true })
export class Brand extends Model {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(120), allowNull: false, unique: true })
  slug!: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  logo!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;
}
