import { Exclude, Expose, Type } from 'class-transformer';
import { AddressEntity } from './address.entity';
import { dataDecryption } from '../../../utils/encryption/data.encryption';
import { maskCpf } from '../../../utils/masks/mask.cpf';
import { ValidateNested } from 'class-validator';

export class User {
  @Expose() user_id!: string;
  @Expose() name!: string;
  @Expose() lastname!: string;
  @Expose() email!: string;
  @Expose() phone!: string;
  @Expose()
  get cpf(): string {
    return this.cpfEncrypted ? maskCpf(dataDecryption(this.cpfEncrypted)) : '';
  }

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
