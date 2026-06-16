import { Expose, Transform } from 'class-transformer';

export class WorkOrderProductDetailResponseDto {
  @Expose() workOrderProductId!: string;
  @Expose() quantity!: number;
  @Expose() unitPrice!: number;
  @Expose() totalPrice!: number;

  @Expose()
  @Transform(({ obj }) => obj.product?.sku)
  sku!: string;

  @Expose()
  @Transform(({ obj }) => obj.product?.name)
  name!: string;

  @Expose()
  @Transform(({ obj }) => obj.product?.description)
  description?: string;
}
