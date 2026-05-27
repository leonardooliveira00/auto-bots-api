import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsMobilePhone,
  IsStrongPassword,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateAddressDto } from './create-address.dto';

export class CreateUserDto {
  @IsString()
  @MaxLength(50)
  @MinLength(2)
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MaxLength(50)
  @MinLength(2)
  @IsNotEmpty()
  lastname!: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @IsMobilePhone('pt-BR')
  @MaxLength(11)
  @IsNotEmpty()
  phone!: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsNotEmpty()
  password!: string;

  @IsString()
  @MaxLength(11)
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  cpf!: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsNotEmpty()
  address!: CreateAddressDto;
}
