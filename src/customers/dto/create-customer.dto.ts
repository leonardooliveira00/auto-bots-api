import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString({ message: 'O nome deve ser uma cadeia de caracteres.' })
  @MaxLength(50, { message: 'O nome deve conter no máximo 50 caracteres.' })
  @MinLength(3, { message: 'O nome deve conter no mínimo 3 caracteres.' })
  @IsNotEmpty({ message: 'O campo nome é obrigatório.' })
  name!: string;

  @IsString({ message: 'O sobrenome deve ser uma cadeia de caracteres.' })
  @MaxLength(50, {
    message: 'O sobrenome deve conter no máximo 50 caracteres.',
  })
  @MinLength(3, { message: 'O sobrenome deve conter no mínimo 3 caracteres.' })
  @IsNotEmpty({ message: 'O campo sobrenome é obrigatório.' })
  lastName!: string;

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
  @Matches(/^[0-9]+$/, { message: 'O telefone deve conter apenas números.' })
  @MaxLength(11, { message: 'O telefone deve conter no máximo 11 dígitos.' })
  @IsNotEmpty({ message: 'O campo telefone é obrigatório.' })
  phone!: string;

  @IsString({ message: 'O CPF/CNPJ deve ser uma cadeia de caracteres.' })
  @Matches(/^[0-9]{11}$|^[0-9]{14}$/, {
    message:
      'O documento deve ser um CPF válido de 11 dígitos ou um CNPJ válido de 14 dígitos, contendo apenas números.',
  })
  @MaxLength(14, {
    message: 'O campo CPF/CNPJ deve conter no máximo 14 caracteres.',
  })
  @IsNotEmpty({ message: 'O campo CPF/CNPJ é obrigatório.' })
  cpfOrCnpj!: string;
}
