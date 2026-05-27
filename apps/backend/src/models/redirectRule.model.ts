import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, Index } from 'sequelize-typescript';

@Table({ tableName: 'redirect_rules', timestamps: true, paranoid: false })
export class RedirectRule extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @Index({ unique: true })
  @Column({ type: DataType.STRING(1000), allowNull: false })
  declare fromPath: string;

  @Column({ type: DataType.STRING(1000), allowNull: false })
  declare toPath: string;

  /** 301 | 302 */
  @Column({ type: DataType.INTEGER, defaultValue: 301 })
  declare statusCode: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isActive: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare hitCount: number;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}
