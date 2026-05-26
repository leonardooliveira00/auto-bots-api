import { Expose, Transform, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { Stock } from '../../stock/entities/stock.entity';

export class Product {
  @Expose() product_id!: string;
  @Expose() sku!: string;
  @Expose() name!: string;
  @Expose() description?: string | null;

  @Expose()
  @Transform(({ value }) => {
    return value ? Number(value) : 0;
  })
  price!: number;

  @Expose() isActive!: boolean;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  @ValidateNested()
  @Type(() => Stock)
  stock!: Stock | null;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}
