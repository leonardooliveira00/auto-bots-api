import { Expose, Type } from 'class-transformer';
import { VehicleListResponseDto } from '../dto/vehicle-list-response.dto';

export class WorkOrderList {
  @Expose() workOrderId!: string;
  @Expose() protocol!: string;
  @Expose() totalAmount!: number;
  @Expose() status!: string;

  @Expose()
  @Type(() => VehicleListResponseDto)
  vehicle!: VehicleListResponseDto;

  constructor(partial: Partial<any>) {
    Object.assign(this, partial);
  }
}
