import { IsString, IsArray, IsOptional } from 'class-validator';

export class BatchIdsBodyDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
