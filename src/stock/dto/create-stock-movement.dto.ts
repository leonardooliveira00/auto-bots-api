import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MovementType } from '../../../generated/prisma/enums';

export class CreateStockMovementDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1, {
    message: 'A quantidade movimentada deve ser de pelo menos 1 item.',
  })
  quantity!: number;

  @IsEnum(MovementType, {
    message:
      'O tipo de movimentação deve ser IN (para entrada) ou OUT (para saída).',
  })
  type!: MovementType;

  @MaxLength(255)
  @IsString()
  @IsOptional()
  reason?: string;
}
