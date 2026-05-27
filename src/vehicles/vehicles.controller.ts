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

@UseAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.vehiclesService.create(createVehicleDto);
    return new Vehicle(vehicle);
  }

  @Get()
  async findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ): Promise<Vehicle[]> {
    const vehicles = await this.vehiclesService.findAll(status);
    return vehicles.map((vehicle) => new Vehicle(vehicle));
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
  ) {
    const vehicle = await this.vehiclesService.findOne(id, status);
    return new Vehicle(vehicle);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    const updatedVehicle = await this.vehiclesService.update(
      id,
      updateVehicleDto,
    );
    return new Vehicle(updatedVehicle);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.vehiclesService.remove(id);
  }
}
