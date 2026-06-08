import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsMobilePhone,
  IsStrongPassword,
  MinLength,
  MaxLength,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsPositive,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateAddressDto } from './create-address.dto';
import { Role } from '../../../generated/prisma/enums';
import { convertToBrDate } from '../../utils/converters/date.converter';

export class CreateEmployeeDto {
  @IsString({ message: 'O nome deve ser uma cadeia de caracteres.' })
  @MaxLength(50, { message: 'O nome deve conter no máximo 50 caracteres.' })
  @MinLength(2, { message: 'O nome deve conter no mínimo 2 caracteres.' })
  @IsNotEmpty({ message: 'O campo nome é obrigatório.' })
  firstName!: string;

  @IsString({ message: 'O sobrenome deve ser uma cadeia de caracteres.' })
  @MaxLength(50, {
    message: 'O sobrenome deve conter no máximo 50 caracteres.',
  })
  @MinLength(2, { message: 'O sobrenome deve conter no mínimo 2 caracteres.' })
  @IsNotEmpty({ message: 'O campo sobrenome é obrigatório.' })
  lastName!: string;

  @IsEnum(Role, {
    message:
      'O cargo informado deve ser um dos valores permitidos: Mechanic, Attendant, Admin ou Manager.',
  })
  @IsNotEmpty()
  role!: Role;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O salário deve ser um valor decimal válido (ex: 2500.00).' },
  )
  @IsPositive({ message: 'O salário deve ser um valor positivo.' })
  @IsNotEmpty({ message: 'O campo salário é obrigatório' })
  salary!: number;

  @IsDate({
    message: 'A data de admissão deve ser uma data válida.',
  })
  @IsNotEmpty({ message: 'A data de admissão é obrigatória.' })
  @Transform(({ value }) => convertToBrDate(value))
  admissionDate!: Date;

  @IsEmail({}, { message: 'Por favor, insira um formato de e-mail válido.' })
  @IsNotEmpty({ message: 'O campo e-mail é obrigatório.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @IsMobilePhone(
    'pt-BR',
    {},
    {
      message:
        'O número de telefone informado deve ser um celular válido no padrão brasileiro.',
    },
  )
  @MaxLength(11, { message: 'O telefone deve conter no máximo 11 dígitos.' })
  @IsNotEmpty({ message: 'O campo telefone é obrigatório.' })
  phone!: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'A senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.',
    },
  )
  @IsNotEmpty({ message: 'O campo senha é obrigatório.' })
  password!: string;

  @IsString({ message: 'O CPF deve ser uma cadeia de caracteres.' })
  @MaxLength(11, { message: 'O CPF deve conter no máximo 11 dígitos.' })
  @IsNotEmpty({ message: 'O campo CPF é obrigatório.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  cpf!: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsNotEmpty({ message: 'Os dados do endereço são obrigatórios.' })
  address!: CreateAddressDto;
}
