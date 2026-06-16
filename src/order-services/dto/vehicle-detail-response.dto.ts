import { Expose, Type } from 'class-transformer';
import { CustomerDetailResponseDto } from './customer-detail-response.dto';

export class VehicleDetailResponseDto {
  @Expose() vehicleId!: string;
  @Expose() brand!: string;
  @Expose() model!: string;
  @Expose() year!: number;
  @Expose() plate!: string;
  @Expose() vin!: string;

  @Expose()
  @Type(() => CustomerDetailResponseDto)
  customer!: CustomerDetailResponseDto;
}
