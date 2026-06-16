import { Expose } from 'class-transformer';
import { TransformPhone } from '../../common/transformers/phone-transformer';

export class CustomerDetailResponseDto {
  @Expose() customerId!: string;
  @Expose() name!: string;
  @Expose() lastName!: string;

  @TransformPhone()
  @Expose()
  phone!: string;
}
