import {
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
  @IsString({ message: 'O SKU deve ser uma cadeia de caracteres.' })
  @MaxLength(50, { message: 'O SKU deve conter no máximo 50 caracteres.' })
  @MinLength(3, { message: 'O SKU deve conter no mínimo 3 caracteres.' })
  @IsNotEmpty({ message: 'O campo SKU é obrigatório.' })
  sku!: string;

  @IsString({ message: 'O nome deve ser uma cadeia de caracteres.' })
  @MaxLength(255, { message: 'O nome deve conter no máximo 255 caracteres.' })
  @MinLength(3, { message: 'O nome deve conter no mínimo 3 caracteres.' })
  @IsNotEmpty({ message: 'O campo nome é obrigatório.' })
  name!: string;

  @IsString({ message: 'A descrição deve ser uma cadeia de caracteres.' })
  @IsOptional()
  description?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'O preço deve ser um número válido com até duas casas decimais.',
    },
  )
  @IsPositive({ message: 'O preço deve ser um valor maior que zero.' })
  @IsNotEmpty({ message: 'O campo preço é obrigatório.' })
  price!: number;

  @ValidateNested()
  @Type(() => CreateStockDto)
  stock!: CreateStockDto;
}
