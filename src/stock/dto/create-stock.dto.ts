import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateStockDto {
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  @Type(() => Number)
  quantity!: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @Type(() => Number)
  minStock!: number;

  @IsInt()
  @Max(999)
  @IsNotEmpty()
  @Type(() => Number)
  maxStock!: number;
}
