import { Exclude, Expose, Transform } from 'class-transformer';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { maskPhone } from '../../utils/masks/mask.phone';
import { maskCpfOrCnpj } from '../../utils/masks/mask.cpf.cnpj';
import { dataDecryption } from '../../utils/encryption/data.encryption';
import { TransformPhone } from '../../common/transformers/phone-transformer';

export class Customer {
  @Expose() customerId!: string;
  @Expose() name!: string;
  @Expose() lastName!: string;
  @Expose() email!: string;

  @Expose()
  @TransformPhone()
  phone!: string;

  @Expose() isActive!: boolean;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  @Exclude() cpfOrCnpjHash!: string;

  @Expose()
  @Transform(({ value }) => (value ? maskCpfOrCnpj(dataDecryption(value)) : ''))
  cpfOrCnpjEncrypted!: string;

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
