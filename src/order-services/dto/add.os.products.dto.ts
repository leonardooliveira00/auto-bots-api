import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  Min,
} from 'class-validator';

export class AddOsProductsDto {
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do produto é obrigatório.' })
  productId!: string;

  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'A quantidade deve ser um valor positivo.' })
  @Min(1, { message: 'A quantidade mínima de produtos deve ser 1.' })
  @IsNotEmpty({ message: 'A quantidade é obrigatória.' })
  quantity!: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço deve ser um número válido com até 2 casas decimais.' },
  )
  @IsPositive({ message: 'O preço unitário deve ser um valor positivo.' })
  @IsNotEmpty({ message: 'O preço unitário é obrigatório.' })
  unitPrice!: number;
}
