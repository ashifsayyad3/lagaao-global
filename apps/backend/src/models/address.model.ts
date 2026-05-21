import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'addresses', paranoid: true })
export class Address extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.ENUM('home', 'work', 'other'),
    defaultValue: 'home',
  })
  type!: 'home' | 'work' | 'other';

  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  phone!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  line1!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  line2!: string | null;

  @Column({ type: DataType.STRING(100), allowNull: false })
  city!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  state!: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  pincode!: string;

  @Column({ type: DataType.STRING(50), defaultValue: 'India' })
  country!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isDefault!: boolean;
}
