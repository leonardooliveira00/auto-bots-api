import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsPostalCode,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @IsString({ message: 'A rua deve ser uma cadeia de caracteres.' })
  @IsNotEmpty({ message: 'O campo rua é obrigatório.' })
  street!: string;

  @IsString({ message: 'O número deve ser uma cadeia de caracteres.' })
  @IsNotEmpty({ message: 'O campo número é obrigatório.' })
  number!: string;

  @IsString({ message: 'O complemento deve ser uma cadeia de caracteres.' })
  @IsOptional()
  complement?: string;

  @IsPostalCode('BR', {
    message: 'O código postal informado deve ser um CEP brasileiro válido.',
  })
  @Matches(/^(\d{5}-\d{3}|\d{8})$/, {
    message: 'O formato do CEP deve conter exatamente 8 dígitos numéricos.',
  })
  @IsNotEmpty({ message: 'O campo CEP é obrigatório.' })
  postalCode!: string;

  @IsString({ message: 'A cidade deve ser uma cadeia de caracteres.' })
  @IsNotEmpty({ message: 'O campo cidade é obrigatório.' })
  city!: string;

  @IsString({ message: 'O estado deve ser uma cadeia de caracteres.' })
  @IsNotEmpty({ message: 'O campo estado é obrigatório.' })
  state!: string;
}
