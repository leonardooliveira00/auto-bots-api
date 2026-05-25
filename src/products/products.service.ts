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

  async create(createProductDto: CreateProductDto): Promise<any> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct)
      throw new ConflictException(
        `Produto com o SKU ${createProductDto.sku} já existe.`,
      );

    const {
      sku,
      name,
      description,
      price,
      quantity,
      minStock,
      maxStock = 999,
    } = createProductDto;

    if (minStock > maxStock)
      throw new BadRequestException(
        `O estoque mínimo (${minStock}) não pode ser maior que o estoque máximo (${maxStock}).`,
      );

    return await this.prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          sku,
          name,
          description,
          price,
          stock: {
            create: { quantity, minStock, maxStock },
          },
        },
        include: {
          stock: true,
        },
      });
    });
  }

  async findAll(): Promise<any[]> {
    return await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: id },
    });

    if (!product || !product.isActive)
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { product_id: id },
    });

    if (!product || !product.isActive)
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);

    return await this.prisma.product.update({
      where: { product_id: id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: id },
    });

    if (!product || !product.isActive)
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);

    await this.prisma.product.delete({ where: { product_id: id } });

    return { message: `Produto ${product.name} removido com sucesso` };
  }
}
