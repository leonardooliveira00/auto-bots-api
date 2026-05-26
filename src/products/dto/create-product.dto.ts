import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStockDto } from '../../stock/dto/create-stock.dto';

export class CreateProductDto {
  @MaxLength(50)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @MaxLength(255)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  price!: number;

  @ValidateNested()
  @Type(() => CreateStockDto)
  stock!: CreateStockDto;
}
