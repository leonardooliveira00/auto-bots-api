import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { Request } from 'express';
import { UseAuth } from '../auth/auth.decorator';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

interface AuthenticadedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@UseAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movement')
  async createMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @Req() req: AuthenticadedRequest,
  ) {
    const userId = req.user.sub;

    return await this.stockService.createMovement({
      ...createStockMovementDto,
      userId,
    });
  }

  @Get()
  async getInventary() {
    const inventory = await this.stockService.findAllInventory();

    const formattedData = inventory.data.map((item) => {
      return {
        ...item,
        product: item.product
          ? {
              ...item.product,
              price: Number(item.product.price),
            }
          : null,
      };
    });

    return {
      meta: inventory.meta,
      data: formattedData,
    };
  }

  @Get(':id')
  async getStockById(@Param('id', ParseUUIDPipe) id: string) {
    const stockItem = await this.stockService.findOneInventory(id);

    return {
      ...stockItem,
      product: stockItem.product
        ? {
            ...stockItem.product,
            price: Number(stockItem.product.price),
          }
        : null,
    };
  }
}
