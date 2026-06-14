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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UseAuth } from '../auth/auth.decorator';
import { Vehicle } from './entities/vehicle.entity';

import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Veículos')
@ApiBearerAuth()
@UseAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({
    summary: 'Vincula um veículo a um cliente',
    description:
      'Registra um novo carro ou moto atrelando de forma estrita ao UUID de um cliente pré-existente e forçando caixas altas em placas/chassis (VIN).',
  })
  @ApiCreatedResponse({
    description: 'Veículo integrado e linkado com sucesso ao cliente.',
    type: Vehicle,
  })
  async create(@Body() dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.vehiclesService.create(dto);
    return new Vehicle(vehicle);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os veículos ativos na oficina',
    description:
      'Retorna a frota de veículos registrados permitindo filtros de status para acompanhamento de pátio.',
  })
  @ApiOkResponse({
    description: 'Lista de veículos gerida com sucesso.',
    type: [Vehicle],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
    description: 'Filtro de atividade da frota',
  })
  async findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<Vehicle[]> {
    const vehicles = await this.vehiclesService.findAll(status);
    return vehicles.map((vehicle) => new Vehicle(vehicle));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca dados de um veículo por ID',
    description:
      'Recupera o registro veicular contendo número de chassi tratado de acordo com os padrões regulamentares.',
  })
  @ApiOkResponse({ description: 'Veículo localizado no banco.', type: Vehicle })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'ID identificador do veículo',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ) {
    const vehicle = await this.vehiclesService.findOne(id, status);
    return new Vehicle(vehicle);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza o registro do veículo',
    description:
      'Modifica dados parciais do veículo como quilometragem, cor ou reajustes gerais de cadastro.',
  })
  @ApiOkResponse({
    description: 'Cadastro veicular atualizado de forma reativa no banco.',
    type: Vehicle,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    const updatedVehicle = await this.vehiclesService.update(id, dto);
    return new Vehicle(updatedVehicle);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove um veículo da base',
    description:
      'Apaga ou arquiva a entidade do veículo respeitando os vínculos históricos.',
  })
  @ApiOkResponse({ description: 'Vínculo do veículo desfeito com sucesso.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.vehiclesService.remove(id);
  }
}
