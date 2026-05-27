import { Exclude, Expose, Transform } from 'class-transformer';
import { maskPostalCode } from '../../../utils/masks/mask.cep';

export class AddressEntity {
  @Expose() address_id!: string;
  @Expose() street!: string;
  @Expose() number!: string;
  @Expose() complement?: string | null;
  @Expose() city!: string;
  @Expose() state!: string;

  @Transform(({ value }) => (value ? maskPostalCode(value) : ''))
  @Expose()
  postalCode!: string;

  @Exclude() userId!: string;

  constructor(partial: Partial<AddressEntity>) {
    Object.assign(this, partial);
  }
}
