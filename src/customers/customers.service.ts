import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../../prisma.service';
import { generateHash } from '../../utils/encryption/hash';
import { dataEncryption } from '../../utils/encryption/data.encryption';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { cpfOrCnpj, ...customerData } = createCustomerDto;

    const cpfOrCnpjHash = generateHash(cpfOrCnpj);

    const customerExists = await this.prisma.customer.findUnique({
      where: { cpfOrCnpjHash },
    });

    if (customerExists)
      throw new ConflictException('Cliente com CPF ou CNPJ já cadastrado.');

    const cpfOrCnpjEncrypted = dataEncryption(cpfOrCnpj);

    return await this.prisma.customer.create({
      data: {
        ...customerData,
        cpfOrCnpjHash,
        cpfOrCnpjEncrypted,
      },
    });
  }

  async findAll(status?: 'active' | 'inactive' | 'all') {
    return await this.prisma.customer.findMany({
      where: {
        isActive:
          status === 'all' ? undefined : status === 'inactive' ? false : true,
      },
      include: { vehicles: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(customer_id: string, status?: 'active' | 'inactive' | 'all') {
    const customer = await this.prisma.customer.findFirst({
      where: {
        customer_id,
        isActive:
          status === 'all' ? undefined : status === 'inactive' ? false : true,
      },
      include: { vehicles: true },
    });

    if (!customer)
      throw new NotFoundException(
        'Cliente não encontrado ou não corresponde ao status solicitado.',
      );

    return customer;
  }

  async update(customer_id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(customer_id);

    return await this.prisma.customer.update({
      where: { customer_id },
      data: updateCustomerDto,
    });
  }

  async remove(customer_id: string) {
    const costumer = await this.findOne(customer_id);

    const anonSuffix = `anon-${customer_id.substring(0, 8)}`;

    await this.prisma.customer.update({
      where: { customer_id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        name: 'Cliente',
        lastName: 'Anonimizado',
        email: `${anonSuffix}@auto-bots.internal`,
        phone: '00000000000',
        cpfOrCnpjHash: `HASH_${anonSuffix}`,
        cpfOrCnpjEncrypted: `ENCRYPTED_${anonSuffix}`,
      },
    });

    return {
      message: `Cliente ${costumer.name} foi removido e seus dados pessoais foram anonimizados com sucesso.`,
    };
  }
}
