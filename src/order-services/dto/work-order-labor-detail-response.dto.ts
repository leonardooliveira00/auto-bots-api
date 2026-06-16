import { Expose } from 'class-transformer';

export class WorkOrderLaborResponseDetailDto {
  @Expose() workOrderLaborId!: string;
  @Expose() description!: string;
  @Expose() hours!: number;
  @Expose() hourlyRate!: number;
}
