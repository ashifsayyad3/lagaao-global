import {
  Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo,
} from 'sequelize-typescript';

@Table({ tableName: 'attributes', paranoid: false })
export class Attribute extends Model {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(120), allowNull: false, unique: true })
  slug!: string;

  @Column({
    type: DataType.ENUM('select', 'multi', 'text', 'boolean', 'number'),
    defaultValue: 'select',
  })
  type!: 'select' | 'multi' | 'text' | 'boolean' | 'number';

  @HasMany(() => AttributeValue)
  values!: AttributeValue[];
}

@Table({ tableName: 'attribute_values', paranoid: false })
export class AttributeValue extends Model {
  @ForeignKey(() => Attribute)
  @Column({ type: DataType.INTEGER, allowNull: false })
  attributeId!: number;

  @BelongsTo(() => Attribute)
  attribute!: Attribute;

  @Column({ type: DataType.STRING(200), allowNull: false })
  value!: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  label!: string | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  sortOrder!: number;
}
