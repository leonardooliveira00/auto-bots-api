import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsISO8601, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAddressDto } from './update-address.dto';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['cpf', 'password', 'address'] as const),
) {
  @IsISO8601(
    {},
    {
      message:
        'A data de demissão deve estar no formato ISO8601 válido (AAAA-MM-DD).',
    },
  )
  @IsOptional()
  resignationDate?: string;

  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsOptional()
  address?: UpdateAddressDto;
}
