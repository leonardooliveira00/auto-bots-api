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

@UseAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.customersService.create(createCustomerDto);
    return new Customer(customer);
  }

  @Get()
  async findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<Customer[]> {
    const customers = await this.customersService.findAll(status);
    return customers.map((customer) => new Customer(customer));
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<Customer> {
    const customer = await this.customersService.findOne(id, status);
    return new Customer(customer);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    const updatedCustomer = await this.customersService.update(
      id,
      updateCustomerDto,
    );
    return new Customer(updatedCustomer);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.customersService.remove(id);
  }
}
