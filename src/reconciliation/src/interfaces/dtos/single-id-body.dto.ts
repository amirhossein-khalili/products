import { IsString, IsArray, IsOptional } from 'class-validator';

/**
 * The DTO for a single ID.
 */
export class SingleIdBodyDto {
  /**
   * The ID of the entity.
   */
  @IsString()
  id: string;

  /**
   * The fields to reconcile.
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
