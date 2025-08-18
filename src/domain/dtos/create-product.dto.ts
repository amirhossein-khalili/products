import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  MinLength,
  IsUUID,
} from 'class-validator';
import { PriceDto } from './price.dto';
import { ApiProperty } from 'com.chargoon.cloud.contracts.correspondence';

export class CreateProductControllerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  public readonly name: string;

  public readonly price: PriceDto;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  public readonly stock: number;
}

export class CreateProductDto extends CreateProductControllerDto {
  @IsUUID()
  @ApiProperty({
    description: 'access id',
    example: '6ffaf78d-a6f6-4b45-a378-71c4d732a36f',
  })
  public id: string;
}
