import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementType } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../generated/prisma/client';

interface CreateMovementInput {
  productId: string;
  quantity: number;
  type: MovementType;
  reason?: string;
  employeeId: string;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async createMovement(
    input: CreateMovementInput,
    externalTx?: Prisma.TransactionClient,
  ): Promise<any> {
    const { productId, quantity, type, reason, employeeId } = input;

    if (quantity <= 0)
      throw new BadRequestException(
        'A quantidade de movimentação de produtos deve ser maior do que 0.',
      );

    const employee = await (externalTx || this.prisma).employee.findUnique({
      where: { employeeId },
      select: { employeeId: true },
    });

    if (!employee) {
      throw new NotFoundException(
        'Não foi possível registrar a movimentação pois o funcionário operador não foi encontrado.',
      );
    }

    const executeTransaction = async (tx: Prisma.TransactionClient) => {
      const stock = await tx.stock.findUnique({ where: { productId } });

      if (!stock)
        throw new NotFoundException(
          'Registro de estoque não encontrado para este produto.',
        );

      if (type === MovementType.OUT) {
        if (stock.quantity < quantity) {
          throw new BadRequestException(
            `Saldo insuficiente. Estoque atual: ${stock.quantity}, solicitado ${quantity}`,
          );
        }
      }

      if (type === MovementType.IN && stock.maxStock > 0) {
        if (stock.quantity + quantity > stock.maxStock)
          throw new BadRequestException(
            `Operação excede a capacidade máxima de estoque: ${stock.maxStock}`,
          );
      }

      const updatedStock = await tx.stock.update({
        where: { productId: productId },
        data: {
          quantity:
            type === MovementType.IN
              ? { increment: quantity }
              : { decrement: quantity },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          type,
          reason,
          employeeId: employee.employeeId,
        },
      });

      return {
        message: `Movimentação de ${type === MovementType.IN ? 'entrada' : 'saída'} registrada com sucesso.`,
        movementId: movement.movementId,
        productId: movement.productId,
        employeeId: movement.employeeId,
        type: movement.type,
        reason: movement.reason,
        quantityMoved: movement.quantity,
        newStockQuantity: updatedStock.quantity,
      };
    };

    if (externalTx) {
      return executeTransaction(externalTx);
    }

    return this.prisma.$transaction(async (tx) => executeTransaction(tx));
  }

  async findAllInventory() {
    const totalProducts = await this.prisma.product.count();

    const stockAggregation = await this.prisma.stock.aggregate({
      _sum: { quantity: true },
    });

    const inventaryList = await this.prisma.stock.findMany({
      where: { product: { isActive: true } },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalUnits = stockAggregation._sum.quantity ?? 0;

    return {
      meta: {
        totalProducts,
        totalUnits,
        summary: `Você tem um total de ${totalProducts} produtos catalogados e um total de ${totalUnits} unidades em estoque.`,
      },
      data: inventaryList,
    };
  }

  async findOneInventory(stockId: string) {
    const stockItem = await this.prisma.stock.findUnique({
      where: { stockId },
      include: { product: true },
    });

    if (!stockItem) throw new NotFoundException(`Produto não encontrado.`);

    return stockItem;
  }
}
