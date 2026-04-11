import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsNotEmpty()
  password!: string;
}
