import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { OrderServicesService } from './order-services.service';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { AddOsLaborDto } from './dto/add.os.labor.dto';
import { AddOsProductsDto } from './dto/add.os.products.dto';
import { UpdateOsStatusDto } from './dto/update.os.status.dto';

@Controller('order-services')
export class OrderServicesController {
  constructor(private readonly orderServicesService: OrderServicesService) {}

  @Post()
  async create(@Body() createOrderServiceDto: CreateOrderServiceDto) {
    return this.orderServicesService.create(createOrderServiceDto);
  }

  @Post(':id/labors')
  async addLabor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addOsLaborDto: AddOsLaborDto,
  ) {
    return this.orderServicesService.addLabor(id, addOsLaborDto);
  }

  @Post(':id/products')
  async addProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addOsProductsDto: AddOsProductsDto,
  ) {
    return this.orderServicesService.addProduct(id, addOsProductsDto);
  }

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.orderServicesService.findAll(status);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderServicesService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateStatusDto: UpdateOsStatusDto,
  ) {
    return this.orderServicesService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id/labors/:laborId')
  removeLabor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('laborId', ParseUUIDPipe) laborId: string,
  ) {
    return this.orderServicesService.removeLabor(id, laborId);
  }

  @Delete(':id/products/:productId')
  removeProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.orderServicesService.removeProduct(id, productId);
  }
}
