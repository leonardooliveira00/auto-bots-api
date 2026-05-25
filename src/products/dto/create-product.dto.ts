import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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

  @IsInt({ message: 'A quantidade inicial deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade inicial física não pode ser menor que 1.' })
  @IsNotEmpty()
  quantity!: number;

  @IsInt({
    message:
      'A quantidade mímina do estoque de um produto deve ser um número inteiro.',
  })
  @Min(1)
  @IsNotEmpty()
  minStock!: number;

  @IsInt({
    message:
      'A quantidade máxima do estoque de um produto deve ser um número inteiro.',
  })
  @Max(999)
  @IsOptional()
  maxStock?: number | undefined;
}
