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
  SerializeOptions,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { AddWorkOrderLaborDto } from './dto/add-work-order-labor.dto';
import { AddWorkOrderProductDto } from './dto/add-work-order-product';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UseAuth } from '../auth/auth.decorator';

@UseAuth()
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrderService: WorkOrdersService) {}

  @Post()
  async create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrderService.create(dto);
  }

  @Post(':id/labors')
  async addLabor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddWorkOrderLaborDto,
  ) {
    return this.workOrderService.addLabor(id, dto);
  }

  @Post(':id/products')
  async addProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddWorkOrderProductDto,
  ) {
    return this.workOrderService.addProduct(id, dto);
  }

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.workOrderService.findAll(status);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrderService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrderService.updateStatus(id, dto);
  }

  @Delete(':id/labors/:laborId')
  removeLabor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('laborId', ParseUUIDPipe) laborId: string,
  ) {
    return this.workOrderService.removeLabor(id, laborId);
  }

  @Delete(':id/products/:productId')
  removeProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.workOrderService.removeProduct(id, productId);
  }
}
