import { IsString, IsArray, IsOptional, IsObject } from 'class-validator';

/**
 * The DTO for a filter.
 */
export class FilterBodyDto {
  /**
   * The filters to apply.
   */
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  /**
   * The fields to reconcile.
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
