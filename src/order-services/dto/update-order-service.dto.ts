import { PartialType } from '@nestjs/swagger';
import { CreateOrderServiceDto } from './create-order-service.dto';

export class UpdateOrderServiceDto extends PartialType(CreateOrderServiceDto) {}
