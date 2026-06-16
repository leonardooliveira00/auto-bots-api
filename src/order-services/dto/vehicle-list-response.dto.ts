import { Expose } from 'class-transformer';

export class VehicleListResponseDto {
  @Expose() brand!: string;
  @Expose() model!: string;
  @Expose() plate!: string;
}
