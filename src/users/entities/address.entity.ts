import { Exclude, Expose } from 'class-transformer';

export class AddressEntity {
  @Expose() address_id!: string;
  @Expose() street!: string;
  @Expose() number!: string;
  @Expose() complement?: string | null;
  @Expose() city!: string;
  @Expose() state!: string;
  @Expose() postalCode!: string;

  @Exclude() userId!: string;

  constructor(partial: Partial<AddressEntity>) {
    Object.assign(this, partial);
  }
}
