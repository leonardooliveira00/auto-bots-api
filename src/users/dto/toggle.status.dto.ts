import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleStatusDto {
  @ApiProperty({
    description: 'Novo estado da conta do usuário',
    example: false,
  })
  @IsBoolean()
  isActive!: boolean;
}
