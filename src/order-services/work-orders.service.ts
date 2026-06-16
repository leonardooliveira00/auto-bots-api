import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { PrismaService } from '../../prisma.service';
import { AddWorkOrderLaborDto } from './dto/add-work-order-labor.dto';
import {
  MovementType,
  WorkOrderStatus,
  Prisma,
} from '../../generated/prisma/client';
import { AddWorkOrderProductDto } from './dto/add-work-order-product.dto';
import { osDetailSelect, osListSelect } from './work-orders.queries';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { StockService } from '../stock/stock.service';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  async create(dto: CreateWorkOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({
        where: { vehicleId: dto.vehicleId, deletedAt: null },
        include: { customer: true },
      });

      if (!vehicle)
        throw new NotFoundException(
          'Veículo não encontrado ou inativo no sistema.',
        );

      if (vehicle.customer.deletedAt !== null || !vehicle.customer.isActive)
        throw new BadRequestException(
          'O cliente vinculado a este veículo está inativo no sistema.',
        );

      const employee = await tx.employee.findFirst({
        where: {
          employeeId: dto.employeeId,
          deletedAt: null,
        },
      });

      if (!employee)
        throw new NotFoundException(
          'Funcionário responsável não encontrado ou inativo.',
        );

      const { ...workOrder } = dto;

      const protocol = await this.generateProtocol(tx);

      return tx.workOrder.create({
        data: {
          ...workOrder,
          protocol,
        },
        include: {
          vehicle: { include: { customer: true } },
          employee: true,
        },
      });
    });
  }

  private async generateProtocol(
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const currentYear = new Date().getFullYear();

    const client = tx || this.prisma;

    const workOrderCountThisYear = await client.workOrder.count({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        },
      },
    });

    const nextSequence = workOrderCountThisYear + 1;

    const formattedSequence = String(nextSequence).padStart(4, '0');

    return `OS-${currentYear}-${formattedSequence}`;
  }

  async addLabor(workOrderId: string, dto: AddWorkOrderLaborDto) {
    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { workOrderId },
      });

      if (!workOrder)
        throw new NotFoundException('Ordem de serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(workOrder.status))
        throw new BadRequestException(
          `Não é possível adicionar ou alterar serviços em uma Ordem de Serviço com status ${workOrder.status}`,
        );

      const hoursDecimal = new Prisma.Decimal(dto.hours);
      const hourlyRateDecimal = new Prisma.Decimal(dto.hourlyRate);
      const totalPrice = hoursDecimal.mul(hourlyRateDecimal);

      await tx.workOrderLabor.create({
        data: {
          workOrderId,
          description: dto.description,
          hours: hoursDecimal,
          hourlyRate: hourlyRateDecimal,
          totalPrice,
        },
      });

      const allLabors = await tx.workOrderLabor.findMany({
        where: { workOrderId },
      });

      const totalLabors = allLabors.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(workOrder.totalProducts).add(
        totalLabors,
      );

      return tx.workOrder.update({
        where: { workOrderId },
        data: {
          totalLabors,
          totalAmount,
        },
        include: {
          labors: true,
          products: true,
        },
      });
    });
  }

  async addProduct(workOrderId: string, dto: AddWorkOrderProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { workOrderId },
      });

      if (!workOrder)
        throw new NotFoundException('Ordem de serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(workOrder.status))
        throw new BadRequestException(
          `Não é possível adicionar produtos a uma OS com o status ${workOrder.status}`,
        );

      const product = await tx.product.findUnique({
        where: { productId: dto.productId },
      });

      if (!product || !product.isActive)
        throw new NotFoundException(
          'Produto não encontrado ou inativo no catálogo.',
        );

      const qtyDecimal = new Prisma.Decimal(dto.quantity);
      const unitPriceDecimal = new Prisma.Decimal(dto.unitPrice);
      const totalPrice = qtyDecimal.mul(unitPriceDecimal);

      await tx.workOrderProduct.create({
        data: {
          workOrderId,
          productId: dto.productId,
          quantity: dto.quantity,
          unitPrice: unitPriceDecimal,
          totalPrice,
        },
      });

      const allProducts = await tx.workOrderProduct.findMany({
        where: { workOrderId },
      });

      const totalProducts = allProducts.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(workOrder.totalLabors).add(
        totalProducts,
      );

      return tx.workOrder.update({
        where: { workOrderId },
        data: {
          totalProducts,
          totalAmount,
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
          labors: true,
        },
      });
    });
  }

  async removeLabor(workOrderId: string, workOrderLaborId: string) {
    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { workOrderId },
      });

      if (!workOrder)
        throw new NotFoundException('Ordem de Serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(workOrder.status))
        throw new BadRequestException(
          `Não é possível remover ou alterar serviços em uma Ordem de Serviço com status ${workOrder.status}`,
        );

      const workOrderLabors = await tx.workOrderLabor.findUnique({
        where: { workOrderLaborId },
      });

      if (!workOrderLabors)
        throw new NotFoundException(
          'Serviço não encontrado nesta Ordem de Serviço',
        );

      await tx.workOrderLabor.delete({
        where: { workOrderLaborId },
      });

      const remainigLabors = await tx.workOrderLabor.findMany({
        where: { workOrderId },
      });

      const totalLabors = remainigLabors.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(workOrder.totalProducts).add(
        totalLabors,
      );

      return tx.workOrder.update({
        where: { workOrderId },
        data: {
          totalLabors,
          totalAmount,
        },
        include: { products: { include: { product: true } }, labors: true },
      });
    });
  }

  async removeProduct(workOrderId: string, workOrderProductId: string) {
    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { workOrderId },
      });

      if (!workOrder)
        throw new NotFoundException('Ordem de Serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(workOrder.status))
        throw new BadRequestException(
          `Não é possível remover ou alterar produtos em uma Ordem de Serviço com status ${workOrder.status}`,
        );

      const workOrderProducts = await tx.workOrderProduct.findFirst({
        where: { workOrderProductId },
      });

      if (!workOrderProducts)
        throw new NotFoundException(
          'Produto não encontrado para esta Ordem de Serviço',
        );

      await tx.workOrderProduct.delete({
        where: { workOrderProductId },
      });

      const remainingProducts = await tx.workOrderProduct.findMany({
        where: { workOrderId },
      });

      const totalProducts = remainingProducts.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(workOrder.totalLabors).add(
        totalProducts,
      );

      return tx.workOrder.update({
        where: { workOrderId },
        data: { totalProducts, totalAmount },
        include: { products: { include: { product: true } }, labors: true },
      });
    });
  }

  async findAll(status?: string) {
    return await this.prisma.workOrder.findMany({
      where: { status: status ? (status as any) : undefined },
      select: osListSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(workOrderId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;

    const workOrder = await client.workOrder.findUnique({
      where: { workOrderId },
      select: osDetailSelect,
    });

    if (!workOrder) {
      throw new NotFoundException(
        `Ordem de Serviço com ID ${workOrderId} não foi encontrada.`,
      );
    }

    return workOrder;
  }

  async updateStatus(workOrderId: string, dto: UpdateWorkOrderStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
        where: { workOrderId },
      });

      if (!workOrder)
        throw new NotFoundException('Ordem de Serviço não encontrada.');

      const currentStatus = workOrder.status as WorkOrderStatus;
      const newStatus = dto.status;

      if (currentStatus === newStatus) {
        return this.findOne(workOrderId);
      }

      if (
        currentStatus === WorkOrderStatus.DELIVERED ||
        currentStatus === WorkOrderStatus.CANCELED
      )
        throw new BadRequestException(
          `Operação inválida: Não é possível alterar o status de uma Ordem de Serviço que já está como ${currentStatus}`,
        );

      if (
        newStatus === WorkOrderStatus.APPROVED &&
        currentStatus !== WorkOrderStatus.BUDGET
      )
        throw new BadRequestException(
          'Uma Ordem de Serviço só pode ser APROVADA (APPROVED) se tiver o status ORÇACMENTO (BUDGET).',
        );

      if (
        newStatus === WorkOrderStatus.COMPLETED &&
        currentStatus !== WorkOrderStatus.IN_PROGRESS
      )
        throw new BadRequestException(
          'Uma Ordem de Serviço só pode ser COMPLETADA (COMPLETED) se estiver com o status EM ANDAMENTO (IN_PROGRESS)',
        );

      if (
        newStatus === WorkOrderStatus.DELIVERED &&
        currentStatus !== WorkOrderStatus.COMPLETED
      )
        throw new BadRequestException(
          `Uma Ordem de Serviço só pode ser ENTREGUE (DELIVERED) se o serviço já estiver CONCLUÍDO (COMPLETED).`,
        );

      if (newStatus === WorkOrderStatus.APPROVED) {
        const workOrderProducts = await tx.workOrderProduct.findMany({
          where: { workOrderId },
        });
        console.log(
          `[ESTOQUE] Reservando/Baixando peças para a OS ${workOrder.protocol}`,
        );

        for (const workOrderProduct of workOrderProducts) {
          await this.stockService.createMovement(
            {
              productId: workOrderProduct.productId,
              quantity: workOrderProduct.quantity,
              type: MovementType.OUT,
              reason: `Saída automática referente à aprovação da Ordem de Serviço. Protocolo: ${workOrder.protocol}`,
              employeeId: workOrder.employeeId,
            },
            tx,
          );
        }
      }

      if (newStatus === WorkOrderStatus.CANCELED) {
        console.log(
          `[AUDITORIA] Ordem de Serviço ${workOrder.protocol} foi cancelada.`,
        );

        if (
          currentStatus === WorkOrderStatus.APPROVED ||
          currentStatus === WorkOrderStatus.IN_PROGRESS
        ) {
          const workOrderProducts = await tx.workOrderProduct.findMany({
            where: { workOrderId },
          });

          for (const workOrderProduct of workOrderProducts) {
            await this.stockService.createMovement(
              {
                productId: workOrderProduct.productId,
                quantity: workOrderProduct.quantity,
                type: MovementType.IN,
                reason: `Entrada automática referente ao cancelamento da Ordem de Serviço. Protocolo: ${workOrder.protocol}`,
                employeeId: workOrder.employeeId,
              },
              tx,
            );
          }
        }
      }

      await tx.workOrder.update({
        where: { workOrderId },
        data: { status: newStatus },
      });
      return this.findOne(workOrderId, tx);
    });
  }
}
