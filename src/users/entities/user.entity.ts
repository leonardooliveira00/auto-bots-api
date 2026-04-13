import { Exclude, Expose, Type } from 'class-transformer';
import { AddressEntity } from './address.entity';
import { cpfDecryption } from '../../../utils/encryption/cpf.encryption';
import { maskCpf } from '../../../utils/mask.cpf';

export class UserEntity {
  user_id!: number;
  name!: string;
  lastname!: string;
  email!: string;
  phoneNumber!: string;

  @Exclude()
  cpfHash!: string;

  @Exclude()
  cpfEncrypted!: string;

  @Exclude()
  passwordHash!: string;

  @Expose()
  get cpf(): string {
    return this.cpfEncrypted ? maskCpf(cpfDecryption(this.cpfEncrypted)) : '';
  }

  @Type(() => AddressEntity)
  address!: AddressEntity | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
