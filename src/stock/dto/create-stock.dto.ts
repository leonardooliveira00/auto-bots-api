import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateStockDto {
  @IsInt({ message: 'A quantidade de estoque deve ser um número inteiro.' })
  @Min(0, { message: 'A quantidade mínima de estoque não pode ser negativa.' })
  @IsNotEmpty({ message: 'O campo quantidade é obrigatório.' })
  @Type(() => Number)
  quantity!: number;

  @IsInt({ message: 'O estoque mínimo deve ser um número inteiro.' })
  @Min(1, {
    message:
      'O limite mínimo de estoque permitido deve ser de pelo menos 1 unidade.',
  })
  @IsNotEmpty({ message: 'O campo estoque mínimo é obrigatório.' })
  @Type(() => Number)
  minStock!: number;

  @IsInt({ message: 'O estoque máximo deve ser um número inteiro.' })
  @Max(999, {
    message: 'O limite máximo de estoque permitido é de 999 unidades.',
  })
  @IsNotEmpty({ message: 'O campo estoque máximo é obrigatório.' })
  @Type(() => Number)
  maxStock!: number;
}
