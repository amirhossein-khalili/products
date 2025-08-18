import { ICommand } from '@nestjs/cqrs';

export class CreateProductCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly priceCurrency: string,
    public readonly priceAmount: number,
    public readonly stock: number,
  ) {}
}
