import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkOrderStatus } from '../../../generated/prisma/enums';

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus, {
    message:
      'Status inválido. Escolha entre: BUDGET, APPROVED, IN_PROGRESS, COMPLETED, DELIVERED ou CANCELED.',
  })
  @IsNotEmpty({ message: 'O novo status da OS é obrigatório.' })
  status!: WorkOrderStatus;
}
