import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString({ message: 'A marca deve ser uma cadeia de caracteres.' })
  @MaxLength(50, { message: 'A marca deve conter no máximo 50 caracteres.' })
  @IsNotEmpty({ message: 'O campo marca é obrigatório.' })
  brand!: string;

  @IsString({ message: 'O modelo deve ser uma cadeia de caracteres.' })
  @MaxLength(50, { message: 'O modelo deve conter no máximo 50 caracteres.' })
  @IsNotEmpty({ message: 'O campo modelo é obrigatório.' })
  model!: string;

  @IsInt({ message: 'O ano do veículo deve ser um número inteiro.' })
  @Max(new Date().getFullYear() + 1, {
    message:
      'O ano do veículo não pode ser superior ao ano modelo subsequente.',
  })
  @Min(1900, { message: 'O ano do veículo não pode ser inferior a 1900.' })
  @IsNotEmpty({ message: 'O campo ano é obrigatório.' })
  year!: number;

  @IsString({ message: 'A placa deve ser uma cadeia de caracteres.' })
  @MaxLength(7, { message: 'A placa deve conter exatamente 7 caracteres.' })
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i, {
    message:
      'A placa deve estar no padrão mercosul (AAA1A23) ou tradicional (AAA1234).',
  })
  @IsNotEmpty({ message: 'O campo placa é obrigatório.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  plate!: string;

  @IsString({
    message: 'O número do chassi deve ser uma cadeia de caracteres.',
  })
  @MaxLength(17, { message: 'O chassi deve conter exatamente 17 caracteres.' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, {
    message:
      'O número do chassi informado é inválido (não deve conter as letras I, O ou Q).',
  })
  @IsNotEmpty({ message: 'O campo chassi é obrigatório.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  vin!: string;

  @IsUUID('all', { message: 'O ID do cliente deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O campo ID do cliente é obrigatório.' })
  customerId!: string;
}
