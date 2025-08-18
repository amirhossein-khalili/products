import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class PriceDto {
  @IsNumber()
  @IsNotEmpty()
  public readonly amount: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  public readonly currency: string;
}
