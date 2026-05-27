import { Exclude, Expose, Transform } from 'class-transformer';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

export class Customer {
  @Expose() customer_id!: string;
  @Expose() name!: string;
  @Expose() lastName!: string;
  @Expose() email!: string;
  @Expose() phone!: string;
  @Expose() isActive!: boolean;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  @Exclude() cpfOrCnpjHash!: string;
  @Exclude() cpfOrCnpjEncrypted!: string;

  @Expose()
  @Transform(({ value }) => value ?? undefined)
  deletedAt?: Date | null;

  @Expose()
  @Transform(({ value }) => value?.map((vehicle) => new Vehicle(vehicle)))
  vehicles?: Vehicle[];

  constructor(partial: Partial<Customer>) {
    Object.assign(this, partial);
  }
}
