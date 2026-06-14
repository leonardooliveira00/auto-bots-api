import { Exclude, Expose } from 'class-transformer';

export class User {
  @Expose() userId!: string;
  @Expose() email!: string;
  @Expose() isActive!: boolean;
  @Expose() createdAt!: Date;

  @Exclude() passwordHash!: string; // Totalmente blindado
  @Exclude() updatedAt!: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
