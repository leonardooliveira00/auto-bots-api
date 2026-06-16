import { Expose, Transform, Type } from 'class-transformer';
import { VehicleDetailResponseDto } from '../dto/vehicle-detail-response.dto';
import { WorkOrderProductDetailResponseDto } from '../dto/work-order-product-detail-response.dto';
import { EmployeeDetailResponseDto } from '../dto/employee-detail-response-dto';
import { WorkOrderLaborResponseDetailDto } from '../dto/work-order-labor-detail-response.dto';

export class WorkOrderDetail {
  @Expose() workOrderId!: string;
  @Expose() protocol!: string;
  @Expose() status!: string;
  @Expose() totalProducts!: number;
  @Expose() totalLabors!: number;
  @Expose() totalAmount!: number;

  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  })
  @Expose()
  estimatedDelivery?: string | null;

  @Expose()
  @Type(() => EmployeeDetailResponseDto)
  employee!: EmployeeDetailResponseDto;

  @Expose()
  @Type(() => VehicleDetailResponseDto)
  vehicle!: VehicleDetailResponseDto;

  @Expose()
  @Type(() => WorkOrderProductDetailResponseDto)
  products!: WorkOrderProductDetailResponseDto[];

  @Expose()
  @Type(() => WorkOrderLaborResponseDetailDto)
  labors!: WorkOrderLaborResponseDetailDto[];

  constructor(partial: Partial<any>) {
    Object.assign(this, partial);
  }
}
