import { Exclude, Expose, Transform } from 'class-transformer';
import { maskPostalCode } from '../../utils/masks/mask.cep';

export class Address {
  @Expose() address_id!: string;
  @Expose() street!: string;
  @Expose() number!: string;
  @Expose() district!: string;
  @Expose() complement?: string | null;
  @Expose() city!: string;
  @Expose() state!: string;

  @Transform(({ value }) => (value ? maskPostalCode(value) : ''))
  @Expose()
  postalCode!: string;

  @Exclude() employeeId!: string;
  @Exclude() createdAt!: Date;
  @Exclude() updatedAt!: Date;

  constructor(partial: Partial<Address>) {
    Object.assign(this, partial);
  }
}
