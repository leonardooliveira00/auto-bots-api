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
import { AddWorkOrderProductDto } from './dto/add-work-order-product.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UseAuth } from '../auth/auth.decorator';
import { WorkOrderList } from './entities/work-order-list.entity';
import { WorkOrderDetail } from './entities/work-order-detail.entity';

@SerializeOptions({ strategy: 'excludeAll' })
@UseAuth()
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrderService: WorkOrdersService) {}

  @Post()
  async create(@Body() dto: CreateWorkOrderDto) {
    const workOrder = await this.workOrderService.create(dto);
    return new WorkOrderDetail(workOrder);
  }

  @Post(':id/labors')
  async addLabor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddWorkOrderLaborDto,
  ) {
    const updatedWorkOrder = await this.workOrderService.addLabor(id, dto);
    return new WorkOrderDetail(updatedWorkOrder);
  }

  @Post(':id/products')
  async addProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddWorkOrderProductDto,
  ) {
    const updatedWorkOrder = await this.workOrderService.addProduct(id, dto);
    return new WorkOrderDetail(updatedWorkOrder);
  }

  @Get()
  async findAll(@Query('status') status?: string) {
    const workOrders = await this.workOrderService.findAll(status);
    return workOrders.map((workOrder) => new WorkOrderList(workOrder));
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const workOrder = await this.workOrderService.findOne(id);
    return new WorkOrderDetail(workOrder);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    const updatedWorkOrder = await this.workOrderService.updateStatus(id, dto);
    return new WorkOrderDetail(updatedWorkOrder);
  }

  @Delete(':id/labors/:laborId')
  async removeLabor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('laborId', ParseUUIDPipe) laborId: string,
  ) {
    const updatedWorkOrder = await this.workOrderService.removeLabor(
      id,
      laborId,
    );
    return new WorkOrderDetail(updatedWorkOrder);
  }

  @Delete(':id/products/:productId')
  async removeProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const updatedWorkOrder = await this.workOrderService.removeProduct(
      id,
      productId,
    );
    return new WorkOrderDetail(updatedWorkOrder);
  }
}
