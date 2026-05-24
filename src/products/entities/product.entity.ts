import { Expose, Transform } from 'class-transformer';

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

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}
