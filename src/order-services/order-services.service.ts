import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { PrismaService } from '../../prisma.service';
import { AddOsLaborDto } from './dto/add.os.labor.dto';
import { MovementType, OsStatus, Prisma } from '../../generated/prisma/client';
import { AddOsProductsDto } from './dto/add.os.products.dto';
import { osDetailSelect, osListSelect } from './order-service.queries';
import { UpdateOsStatusDto } from './dto/update.os.status.dto';
import { StockService } from '../stock/stock.service';

@Injectable()
export class OrderServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) {}

  async create(createOrderServiceDto: CreateOrderServiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({
        where: { vehicle_id: createOrderServiceDto.vehicleId, deletedAt: null },
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
          employee_id: createOrderServiceDto.employeeId,
          deletedAt: null,
        },
      });

      if (!employee)
        throw new NotFoundException(
          'Funcionário responsável não encontrado ou inativo.',
        );

      const { ...osData } = createOrderServiceDto;

      const protocol = await this.generateProtocol(tx);

      return tx.orderOfService.create({
        data: {
          ...osData,
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

    const osCountThisYear = await client.orderOfService.count({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        },
      },
    });

    const nextSequence = osCountThisYear + 1;

    const formattedSequence = String(nextSequence).padStart(4, '0');

    return `OS-${currentYear}-${formattedSequence}`;
  }

  async addLabor(osId: string, addOsLaborDto: AddOsLaborDto) {
    return this.prisma.$transaction(async (tx) => {
      const os = await tx.orderOfService.findUnique({
        where: { os_id: osId },
      });

      if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(os.status))
        throw new BadRequestException(
          `Não é possível adicionar ou alterar serviços em uma Ordem de Serviço com status ${os.status}`,
        );

      const hoursDecimal = new Prisma.Decimal(addOsLaborDto.hours);
      const hourlyRateDecimal = new Prisma.Decimal(addOsLaborDto.hourlyRate);
      const totalPrice = hoursDecimal.mul(hourlyRateDecimal);

      await tx.osLabor.create({
        data: {
          osId,
          description: addOsLaborDto.description,
          hours: hoursDecimal,
          hourlyRate: hourlyRateDecimal,
          totalPrice,
        },
      });

      const allLabors = await tx.osLabor.findMany({
        where: { osId },
      });

      const totalLabors = allLabors.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(os.totalProducts).add(totalLabors);

      return tx.orderOfService.update({
        where: { os_id: osId },
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

  async addProduct(osId: string, addOsProductDto: AddOsProductsDto) {
    return this.prisma.$transaction(async (tx) => {
      const os = await tx.orderOfService.findUnique({
        where: { os_id: osId },
      });

      if (!os) throw new NotFoundException('Ordem de serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(os.status))
        throw new BadRequestException(
          `Não é possível adicionar produtos a uma OS com o status ${os.status}`,
        );

      const product = await tx.product.findUnique({
        where: { product_id: addOsProductDto.productId },
      });

      if (!product || !product.isActive)
        throw new NotFoundException(
          'Produto não encontrado ou inativo no catálogo.',
        );

      const qtyDecimal = new Prisma.Decimal(addOsProductDto.quantity);
      const unitPriceDecimal = new Prisma.Decimal(addOsProductDto.unitPrice);
      const totalPrice = qtyDecimal.mul(unitPriceDecimal);

      await tx.osProduct.create({
        data: {
          osId,
          productId: addOsProductDto.productId,
          quantity: addOsProductDto.quantity,
          unitPrice: unitPriceDecimal,
          totalPrice,
        },
      });

      const allProducts = await tx.osProduct.findMany({
        where: { osId },
      });

      const totalProducts = allProducts.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(os.totalLabors).add(totalProducts);

      return tx.orderOfService.update({
        where: { os_id: osId },
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

  async removeLabor(osId: string, osLaborId: string) {
    return this.prisma.$transaction(async (tx) => {
      const os = await tx.orderOfService.findUnique({
        where: { os_id: osId },
      });

      if (!os) throw new NotFoundException('Ordem de Serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(os.status))
        throw new BadRequestException(
          `Não é possível remover ou alterar serviços em uma Ordem de Serviço com status ${os.status}`,
        );

      const osLabor = await tx.osLabor.findUnique({
        where: { os_labor_id: osLaborId },
      });

      if (!osLabor)
        throw new NotFoundException(
          'Serviço não encontrado nesta Ordem de Serviço',
        );

      await tx.osLabor.delete({
        where: { os_labor_id: osLaborId },
      });

      const remainigLabors = await tx.osLabor.findMany({
        where: { osId },
      });

      const totalLabors = remainigLabors.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(os.totalProducts).add(totalLabors);

      return tx.orderOfService.update({
        where: { os_id: osId },
        data: {
          totalLabors,
          totalAmount,
        },
        include: { products: { include: { product: true } }, labors: true },
      });
    });
  }

  async removeProduct(osId: string, osProductId: string) {
    return this.prisma.$transaction(async (tx) => {
      const os = await tx.orderOfService.findUnique({
        where: { os_id: osId },
      });

      if (!os) throw new NotFoundException('Ordem de Serviço não encontrada.');

      if (['COMPLETED', 'DELIVERED', 'CANCELED'].includes(os.status))
        throw new BadRequestException(
          `Não é possível remover ou alterar produtos em uma Ordem de Serviço com status ${os.status}`,
        );

      const osProduct = await tx.osProduct.findFirst({
        where: { os_product_id: osProductId },
      });

      if (!osProduct)
        throw new NotFoundException(
          'Produto não encontrado para esta Ordem de Serviço',
        );

      await tx.osProduct.delete({
        where: { os_product_id: osProductId },
      });

      const remainingProducts = await tx.osProduct.findMany({
        where: { osId },
      });

      const totalProducts = remainingProducts.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0),
      );

      const totalAmount = new Prisma.Decimal(os.totalLabors).add(totalProducts);

      return tx.orderOfService.update({
        where: { os_id: osId },
        data: { totalProducts, totalAmount },
        include: { products: { include: { product: true } }, labors: true },
      });
    });
  }

  async findAll(status?: string) {
    return await this.prisma.orderOfService.findMany({
      where: { status: status ? (status as any) : undefined },
      select: osListSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(osId: string) {
    const os = await this.prisma.orderOfService.findUnique({
      where: { os_id: osId },
      select: osDetailSelect,
    });

    if (!os) {
      throw new NotFoundException(
        `Ordem de Serviço com ID ${osId} não foi encontrada.`,
      );
    }

    return os;
  }

  async updateStatus(osId: string, updateOsStatusDto: UpdateOsStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const os = await tx.orderOfService.findUnique({
        where: { os_id: osId },
      });

      if (!os) throw new NotFoundException('Ordem de Serviço não encontrada.');

      const currentStatus = os.status as OsStatus;
      const newStatus = updateOsStatusDto.status;

      if (currentStatus === newStatus) {
        return this.findOne(osId);
      }

      if (
        currentStatus === OsStatus.DELIVERED ||
        currentStatus === OsStatus.CANCELED
      )
        throw new BadRequestException(
          `Operação inválida: Não é possível alterar o status de uma Ordem de Serviço que já está como ${currentStatus}`,
        );

      if (newStatus === OsStatus.APPROVED && currentStatus !== OsStatus.BUDGET)
        throw new BadRequestException(
          'Uma Ordem de Serviço só pode ser APROVADA (APPROVED) se tiver o status ORÇACMENTO (BUDGET).',
        );

      if (
        newStatus === OsStatus.COMPLETED &&
        currentStatus !== OsStatus.IN_PROGRESS
      )
        throw new BadRequestException(
          'Uma Ordem de Serviço só pode ser COMPLETADA (COMPLETED) se estiver com o status EM ANDAMENTO (IN_PROGRESS)',
        );

      if (
        newStatus === OsStatus.DELIVERED &&
        currentStatus !== OsStatus.COMPLETED
      )
        throw new BadRequestException(
          `Uma Ordem de Serviço só pode ser ENTREGUE (DELIVERED) se o serviço já estiver CONCLUÍDO (COMPLETED).`,
        );

      if (newStatus === OsStatus.APPROVED) {
        const osProducts = await tx.osProduct.findMany({ where: { osId } });
        console.log(
          `[ESTOQUE] Reservando/Baixando peças para a OS ${os.protocol}`,
        );

        for (const osProduct of osProducts) {
          await this.stockService.createMovement(
            {
              productId: osProduct.productId,
              quantity: osProduct.quantity,
              type: MovementType.OUT,
              reason: `Saída automática referente à aprovação da Ordem de Serviço. Protocolo: ${os.protocol}`,
              employeeId: os.employeeId,
            },
            tx,
          );
        }
      }

      if (newStatus === OsStatus.CANCELED) {
        console.log(
          `[AUDITORIA] Ordem de Serviço ${os.protocol} foi cancelada.`,
        );

        if (
          currentStatus === OsStatus.APPROVED ||
          currentStatus === OsStatus.IN_PROGRESS
        ) {
          const osProducts = await tx.osProduct.findMany({
            where: { osId },
          });

          for (const osProduct of osProducts) {
            await this.stockService.createMovement(
              {
                productId: osProduct.productId,
                quantity: osProduct.quantity,
                type: MovementType.IN,
                reason: `Entrada automática referente ao cancelamento da Ordem de Serviço. Protocolo: ${os.protocol}`,
                employeeId: os.employeeId,
              },
              tx,
            );
          }
        }
      }

      await tx.orderOfService.update({
        where: { os_id: osId },
        data: { status: newStatus },
      });
      return this.findOne(osId);
    });
  }
}
