import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MaxLength(50)
  @MinLength(3)
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MaxLength(50)
  @MinLength(3)
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsMobilePhone('pt-BR')
  @Matches(/^[0-9]+$/)
  @MaxLength(11)
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @Matches(/^[0-9]{11}$|^[0-9]{14}$/)
  @MaxLength(14)
  @IsNotEmpty()
  cpfOrCnpj!: string;
}
