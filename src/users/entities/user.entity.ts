import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { AddressEntity } from './address.entity';
import { dataDecryption } from '../../../utils/encryption/data.encryption';
import { maskCpf } from '../../../utils/masks/mask.cpf';
import { ValidateNested } from 'class-validator';
import { maskPhone } from '../../../utils/masks/mask.phone';

export class User {
  @Expose() user_id!: string;
  @Expose() name!: string;
  @Expose() lastname!: string;

  @Expose()
  get cpf(): string {
    return this.cpfEncrypted ? maskCpf(dataDecryption(this.cpfEncrypted)) : '';
  }

  @Expose()
  email!: string;

  @Expose()
  @Transform(({ value }) => (value ? maskPhone(value) : ''))
  phone!: string;

  @Exclude()
  cpfHash!: string;

  @Exclude()
  cpfEncrypted!: string;

  @Exclude()
  passwordHash!: string;

  @ValidateNested()
  @Type(() => AddressEntity)
  address!: AddressEntity | null;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
