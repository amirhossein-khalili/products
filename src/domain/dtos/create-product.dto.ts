import { IsString, IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  public id: string;

  @IsNumber()
  @Min(0)
  public stock: number;

  @IsNumber()
  @Min(0)
  public price: number;

  @IsString()
  @IsNotEmpty()
  public name: string;
}
