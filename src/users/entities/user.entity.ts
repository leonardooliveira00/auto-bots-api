import { Exclude, Expose, Type } from 'class-transformer';
import { AddressEntity } from './address.entity';
import { cpfDecryption } from '../../../utils/encryption/cpf.encryption';
import { maskCpf } from '../../../utils/mask.cpf';
import { ValidateNested } from 'class-validator';

export class UserEntity {
  @Expose() user_id!: number;
  @Expose() name!: string;
  @Expose() lastname!: string;
  @Expose() email!: string;
  @Expose() phoneNumber!: string;

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

  @ValidateNested()
  @Type(() => AddressEntity)
  address!: AddressEntity | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
