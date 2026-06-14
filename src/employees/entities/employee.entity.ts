import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Address } from './address.entity';
import { dataDecryption } from '../../utils/encryption/data.encryption';
import { maskCpf } from '../../utils/masks/mask.cpf';
import { ValidateNested } from 'class-validator';
import { maskPhone } from '../../utils/masks/mask.phone';
import { Role } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { User } from '../../users/entities/user.entity';

export class Employee {
  // Campos públicos
  @Expose() employeeId!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() email!: string;
  @Expose() role!: Role;

  @Expose()
  @Transform(({ obj }) => {
    if (
      obj.deletedAt ||
      (obj.cpfEncrypted && obj.cpfEncrypted.startsWith('deleted-'))
    ) {
      return '000.000.000-00';
    }

    const decryptedCpf = dataDecryption(obj.cpfEncrypted);

    if (!decryptedCpf || typeof decryptedCpf !== 'string') return null;

    return maskCpf(decryptedCpf);
  })
  cpf!: string;

  @Expose()
  @Transform(({ value }) => (value ? maskPhone(value) : ''))
  phone!: string;

  @Expose()
  salary!: Prisma.Decimal | number;

  @Expose()
  @Transform(({ obj }) => obj.user?.isActive ?? true)
  isActive!: boolean;

  @Expose()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  })
  admissionDate!: Date | null;

  @Expose()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  })
  resignationDate!: Date | null;

  @Expose()
  @ValidateNested()
  @Type(() => Address)
  address!: Address | null;

  // Campos ocultos
  @Exclude() cpfHash!: string;
  @Exclude() cpfEncrypted!: string;
  @Exclude() passwordHash!: string;
  @Exclude() userId!: string | null;
  @Exclude() user!: any;
  @Exclude() createdAt!: Date;
  @Exclude() updatedAt!: Date;
  @Exclude() deletedAt!: Date | null;

  constructor(partial: Partial<Employee>) {
    Object.assign(this, partial);
  }
}
