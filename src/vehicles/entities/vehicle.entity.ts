import { Exclude, Expose, Transform } from 'class-transformer';
import { Customer } from '../../customers/entities/customer.entity';

export class Vehicle {
  @Expose() vehicle_id!: string;
  @Expose() brand!: string;
  @Expose() model!: string;
  @Expose() year!: number;
  @Expose() plate!: string;
  @Expose() vin!: string;
  @Expose() isActive!: boolean;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  @Exclude() customerId!: string;

  @Expose()
  @Transform(({ value }) => value ?? undefined)
  deletedAt!: Date | null;

  @Expose()
  @Transform(({ value }) => (value ? new Customer(value) : undefined))
  customer?: Customer;

  constructor(partial: Partial<Vehicle>) {
    Object.assign(this, partial);
  }
}
