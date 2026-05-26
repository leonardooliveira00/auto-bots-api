import { Exclude, Expose } from 'class-transformer';

export class Stock {
  @Expose() stock_id!: string;
  @Expose() quantity!: number;
  @Expose() minStock!: number;
  @Expose() maxStock!: number;

  @Exclude() productId!: string;

  constructor(partial: Partial<Stock>) {
    Object.assign(this, partial);
  }
}
