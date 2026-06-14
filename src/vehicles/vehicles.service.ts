import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PrismaService } from '../../prisma.service';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const { customerId, plate, vin, ...vehicleData } = dto;

    const customer = await this.prisma.customer.findUnique({
      where: { customerId },
    });

    if (!customer || !customer.isActive)
      throw new NotFoundException(
        'Cliente não encontrado ou não corresponde ao status solicitado.',
      );

    const vehicleExists = await this.prisma.vehicle.findFirst({
      where: {
        OR: [{ plate }, { vin }],
      },
    });

    if (vehicleExists)
      throw new ConflictException(
        'Já existe um veículo cadastrado com esta placa ou chassi.',
      );

    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...vehicleData,
        plate,
        vin,
        customerId,
      },
    });

    return vehicle;
  }

  async findAll(status?: 'active' | 'inactive' | 'all'): Promise<any> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        isActive:
          status === 'all' ? undefined : status === 'inactive' ? false : true,
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles;
  }

  async findOne(
    vehicleId: string,
    status?: 'active' | 'inactive' | 'all',
  ): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        vehicleId,
        isActive:
          status === 'all' ? undefined : status === 'inactive' ? false : true,
      },
      include: { customer: true },
    });

    if (!vehicle)
      throw new NotFoundException(
        'Veículo não encontrado ou não corresponde ao status solicitado.',
      );

    return vehicle;
  }

  async update(vehicleId: string, dto: UpdateVehicleDto) {
    const vehicle = await this.findOne(vehicleId);

    if (!vehicle || !vehicle.isActive)
      throw new NotFoundException(
        'Veículo não encontrado ou inativo no sistema.',
      );

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { vehicleId },
      data: dto,
    });

    return updatedVehicle;
  }

  async remove(vehicleId: string) {
    const vehicle = await this.findOne(vehicleId);

    const suffix = `del-${vehicleId.substring(0, 8)}`;

    await this.prisma.vehicle.update({
      where: { vehicleId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        plate: `${vehicle.plate}${suffix}`,
        vin: `${vehicle.vin}${suffix}`,
      },
    });

    return {
      message: `Veículo ${vehicle.model} de placa ${vehicle.plate} foi removido com sucesso.`,
    };
  }
}
