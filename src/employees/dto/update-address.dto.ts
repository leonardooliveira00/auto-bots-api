import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from '../../employees/dto/create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
