import { IsString, IsArray, IsOptional } from 'class-validator';

export class SingleIdBodyDto {
  @IsString()
  id: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
