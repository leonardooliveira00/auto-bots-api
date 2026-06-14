import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateStockDto } from '../../stock/dto/update-stock.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['stock'] as const),
) {
  @ValidateNested()
  @Type(() => UpdateStockDto)
  @IsOptional()
  stock?: UpdateStockDto;
}
