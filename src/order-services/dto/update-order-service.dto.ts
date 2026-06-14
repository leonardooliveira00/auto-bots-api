import { PartialType } from '@nestjs/swagger';
import { CreateWorkOrderDto } from './create-work-order.dto';

export class UpdateOrderServiceDto extends PartialType(CreateWorkOrderDto) {}
