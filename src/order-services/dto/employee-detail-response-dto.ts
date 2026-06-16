import { Expose } from 'class-transformer';

export class EmployeeDetailResponseDto {
  @Expose() employeeId!: string;
  @Expose() firstName!: string;
  @Expose() lastName!: string;
  @Expose() role!: string;
}
