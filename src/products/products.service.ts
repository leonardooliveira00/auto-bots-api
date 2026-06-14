import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto): Promise<any> {
    const existingProduct = await this.prisma.product.findFirst({
      where: { sku: dto.sku },
      include: { stock: true },
    });

    const { stock, ...productData } = dto;

    if (stock.minStock > stock.maxStock)
      throw new BadRequestException(
        `O estoque mínimo (${stock.minStock}) não pode ser maior que o estoque máximo (${stock.maxStock}).`,
      );

    if (stock.quantity < stock.minStock)
      throw new BadRequestException(
        `A quantidade inicial (${stock.quantity}) não pode ser menor que o estoque mínimo (${stock.minStock}).`,
      );

    if (existingProduct) {
      if (existingProduct.isActive) {
        throw new ConflictException(`Produto com o SKU ${dto.sku} já existe.`);
      }

      return await this.prisma.$transaction(async (tx) => {
        return tx.product.update({
          where: { productId: existingProduct.productId },
          data: {
            ...productData,
            isActive: true,
            stock: {
              update: stock,
            },
          },
          include: { stock: true },
        });
      });
    }

    return await this.prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          ...productData,
          stock: {
            create: stock,
          },
        },
        include: {
          stock: true,
        },
      });
    });
  }

  async findAll(status?: 'active' | 'inactive' | 'all'): Promise<any[]> {
    let isActiveFilter: boolean | undefined;

    if (status === 'active') isActiveFilter = true;
    if (status === 'inactive') isActiveFilter = false;
    if (status === 'all') isActiveFilter = undefined;

    return await this.prisma.product.findMany({
      where: { isActive: isActiveFilter ?? true },
      include: { stock: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(productId: string, includeActive = false) {
    const product = await this.prisma.product.findFirst({
      where: { productId, isActive: includeActive ? undefined : true },
      include: { stock: true },
    });

    if (!product)
      throw new NotFoundException(
        `Produto ativo com ID ${productId} não encontrado.`,
      );

    return product;
  }

  async update(productId: string, dto: UpdateProductDto): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { productId },
      include: { stock: true },
    });

    if (!product || !product.isActive)
      throw new NotFoundException(
        `Produto com ID ${productId} não encontrado.`,
      );

    const { stock, ...productData } = dto;

    if (stock) {
      const finalMinStock =
        stock.minStock !== undefined
          ? Number(stock.minStock)
          : Number(product.stock?.minStock ?? 0);
      const finalMaxStock =
        stock.maxStock !== undefined
          ? Number(stock.maxStock)
          : Number(product.stock?.maxStock ?? 0);

      const finalQuantity =
        stock.quantity !== undefined
          ? Number(stock.quantity)
          : Number(product.stock?.quantity ?? 0);

      if (finalMinStock > finalMaxStock)
        throw new BadRequestException(
          `O estoque mínimo (${finalMinStock}) não pode ser maior que o estoque máximo (${finalMaxStock}).`,
        );

      if (finalQuantity < finalMinStock)
        throw new BadRequestException(
          `A quantidade inicial (${finalQuantity}) não pode ser menor que o estoque mínimo (${finalMinStock}).`,
        );
    }

    return await this.prisma.product.update({
      where: { productId },
      data: {
        ...productData,
        ...(stock && {
          stock: {
            update: stock,
          },
        }),
      },
      include: { stock: true },
    });
  }

  async remove(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { productId },
    });

    if (!product || !product.isActive)
      throw new NotFoundException(
        `Produto com ID ${productId} não encontrado.`,
      );

    await this.prisma.product.update({
      where: { productId: productId },
      data: { isActive: false },
    });

    return { message: `Produto ${product.name} removido com sucesso` };
  }
}
