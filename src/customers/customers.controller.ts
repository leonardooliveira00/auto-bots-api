import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UseAuth } from '../auth/auth.decorator';
import { Customer } from './entities/customer.entity';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo cliente',
    description:
      'Registra um novo cliente na oficina vinculando dados de contato e CPF/CNPJ.',
  })
  @ApiCreatedResponse({
    description: 'Cliente criado com sucesso.',
    type: Customer,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação nos campos informados.',
  })
  async create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    const customer = await this.customersService.create(dto);
    return new Customer(customer);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os clientes cadastrados',
    description:
      'Recupera o catálogo completo de clientes, permitindo filtragem por status.',
  })
  @ApiOkResponse({
    description: 'Lista de clientes retornada com sucesso.',
    type: [Customer],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
    description: 'Filtro por status situacional do cliente',
  })
  async findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<Customer[]> {
    const customers = await this.customersService.findAll(status);
    return customers.map((customer) => new Customer(customer));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um cliente por ID específico',
    description:
      'Retorna os detalhes de um único cliente usando seu identificador de tipo UUID.',
  })
  @ApiOkResponse({
    description: 'Cliente localizado com sucesso.',
    type: Customer,
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador único do cliente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado no banco de dados.',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<Customer> {
    const customer = await this.customersService.findOne(id, status);
    return new Customer(customer);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza dados de um cliente',
    description:
      'Permite alteração parcial das informações cadastrais do cliente de forma reativa.',
  })
  @ApiOkResponse({
    description: 'Cliente atualizado com sucesso.',
    type: Customer,
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador único do cliente',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não localizado para atualização.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const updatedCustomer = await this.customersService.update(id, dto);
    return new Customer(updatedCustomer);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove ou inativa um cliente',
    description:
      'Realiza a exclusão lógica ou remoção física do cadastro do cliente baseado no ID.',
  })
  @ApiOkResponse({
    description: 'Cliente excluído ou desativado com sucesso do ecossistema.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador único do cliente',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.customersService.remove(id);
  }
}
