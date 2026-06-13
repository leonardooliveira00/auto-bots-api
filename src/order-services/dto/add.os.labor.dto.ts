import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AddOsLaborDto {
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(255, {
    message: 'A descrição do serviço pode ter no máximo 255 caracteres.',
  })
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  description!: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'As horas devem ser um número válido.' },
  )
  @Min(0.1, {
    message: 'O tempo mínimo de serviço deve ser de 0.1 horas (6 minutos).',
  })
  @IsNotEmpty({ message: 'A quantidade de horas é obrigatória.' })
  hours!: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O valor da hora deve ser um número válido.' },
  )
  @IsPositive({ message: 'O valor por hora deve ser positivo.' })
  @IsNotEmpty({ message: 'O valor por hora é obrigatório.' })
  hourlyRate!: number;
}
