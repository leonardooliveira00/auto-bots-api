import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  brand!: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  model!: string;

  @IsInt()
  @Max(new Date().getFullYear() + 1)
  @Min(1900)
  @IsNotEmpty()
  year!: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(7)
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i)
  @IsNotEmpty()
  plate!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @Length(17)
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i)
  @IsNotEmpty()
  vin!: string;

  @IsUUID()
  @IsNotEmpty()
  customerId!: string;
}
