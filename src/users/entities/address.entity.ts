export class AddressEntity {
  address_id!: number;
  userId!: number;
  street!: string;
  number!: string;
  complement?: string | null;
  city!: string;
  state!: string;
  postalCode!: string;

  constructor(partial: Partial<AddressEntity>) {
    Object.assign(this, partial);
  }
}
