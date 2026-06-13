import { IsEnum, IsNotEmpty } from 'class-validator';
import { OsStatus } from '../../../generated/prisma/enums';

export class UpdateOsStatusDto {
  @IsEnum(OsStatus, {
    message:
      'Status inválido. Escolha entre: BUDGET, APPROVED, IN_PROGRESS, COMPLETED, DELIVERED ou CANCELED.',
  })
  @IsNotEmpty({ message: 'O novo status da OS é obrigatório.' })
  status!: OsStatus;
}
