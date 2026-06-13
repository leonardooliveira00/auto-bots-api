import { Module } from '@nestjs/common';
import { OrderServicesService } from './order-services.service';
import { OrderServicesController } from './order-services.controller';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [StockModule],
  controllers: [OrderServicesController],
  providers: [OrderServicesService],
})
export class OrderServicesModule {}
