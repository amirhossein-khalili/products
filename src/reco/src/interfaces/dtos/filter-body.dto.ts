import { IsString, IsArray, IsOptional, IsObject } from 'class-validator';

export class FilterBodyDto {
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
