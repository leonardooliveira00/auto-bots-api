export interface CreateAddressDto {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  postalCode: string;
}
