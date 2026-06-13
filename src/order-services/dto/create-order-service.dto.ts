import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { convertToBrDate } from '../../utils/converters/date.converter';

export class CreateOrderServiceDto {
  @IsUUID('4', { message: 'O ID do veículo deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do veículo é obrigatório.' })
  vehicleId!: string;

  @IsUUID('4', { message: 'O ID do funcionário deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do funcionário é obrigatório.' })
  employeeId!: string;

  @IsString()
  @IsOptional({ message: 'A descrição deve ser um texto válido.' })
  description?: string;

  @IsDate({
    message:
      'A data estimada de entrega deve ser uma data válida no formato DD/MM/AAAA.',
  })
  @IsOptional()
  @Transform(({ value }) => convertToBrDate(value))
  estimatedDelivery?: Date | null;
}
