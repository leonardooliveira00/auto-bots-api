import { CreateAddressDto } from "./CreateAddresDto";

export interface CreateUserDto {
  name: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  password: string;
  cpf: string;
  address: CreateAddressDto;
}
