import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { Request } from 'express';
import { UseAuth } from '../auth/auth.decorator';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface AuthenticadedRequest extends Request {
  user: {
    sub: string;
    email: string;
    employeeId: string;
    role: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

@ApiTags('Movimentação e Inventário de Estoque')
@ApiBearerAuth()
@UseAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movement')
  @ApiOperation({
    summary: 'Registra entrada ou saída do estoque',
    description:
      'Cria uma movimentação de estoque (entrada para reabastecimento ou saída para Ordem de Serviço) atrelando automaticamente o ID do funcionário que realizou a ação a partir da sessão.',
  })
  @ApiCreatedResponse({
    description: 'Movimentação operada e registrada no histórico da auditoria.',
  })
  async createMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @Req() req: AuthenticadedRequest,
  ) {
    const employeeId = req.user.employeeId;

    return await this.stockService.createMovement({
      ...createStockMovementDto,
      employeeId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Busca o estado atual do inventário completo',
    description:
      'Consolida a visão geral do estoque, retornando metadados de estoque mínimo/máximo e a formatação adequada dos preços.',
  })
  @ApiOkResponse({
    description:
      'Dados de inventário detalhados com metadados retornados com sucesso.',
  })
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
  @ApiOperation({
    summary: 'Busca saldo de estoque de um item por ID',
    description:
      'Retorna a quantidade volumétrica e os limites de segurança de um produto específico.',
  })
  @ApiOkResponse({ description: 'Item do estoque retornado de forma íntegra.' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID do registro de estoque',
  })
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
