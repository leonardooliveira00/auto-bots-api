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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UseAuth } from '../auth/auth.decorator';
import { Product } from './entities/product.entity';

import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Produtos do Estoque')
@ApiBearerAuth()
@UseAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo produto',
    description:
      'Registra peças ou insumos vinculando dados estruturados de preço e gerando o SKU identificador.',
  })
  @ApiCreatedResponse({
    description: 'Produto registrado e pronto para movimentação.',
    type: Product,
  })
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto);
    return new Product({
      ...product,
      price: Number(product.price),
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todos os produtos',
    description:
      'Retorna as peças catalogadas na aplicação com tratamento dos tipos monetários decimais.',
  })
  @ApiOkResponse({
    description: 'Lista de produtos retornada com sucesso.',
    type: [Product],
  })
  async findAll() {
    const products = await this.productsService.findAll();
    return products.map(
      (product) =>
        new Product({
          ...product,
          price: Number(product.price),
        }),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um produto por ID',
    description:
      'Localiza um insumo mapeando os preços decimais brutos salvos no banco de dados relacional.',
  })
  @ApiOkResponse({
    description: 'Produto localizado com sucesso.',
    type: Product,
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'ID do produto' })
  @ApiQuery({
    name: 'includeStatus',
    required: false,
    type: String,
    description: "Se setado para 'true', acopla status adicionais do item.",
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeStatus') includeStatus?: string,
  ) {
    const shouldIncludeStatus = includeStatus === 'true';
    const product = await this.productsService.findOne(id, shouldIncludeStatus);

    return new Product({
      ...product,
      price: Number(product.price),
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza dados de uma peça/produto',
    description:
      'Ajusta informações parciais como SKU, nome ou preços vigentes.',
  })
  @ApiOkResponse({
    description: 'Informações do produto atualizadas com sucesso.',
    type: Product,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(id, updateProductDto);
    return new Product({
      ...product,
      price: Number(product.price),
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deleta um produto do catálogo',
    description:
      'Remove o item de forma estrita respeitando as amarrações do banco de dados.',
  })
  @ApiOkResponse({ description: 'Produto removido do sistema operacional.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
