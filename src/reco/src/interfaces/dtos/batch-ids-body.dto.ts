import { IsString, IsArray, IsOptional } from 'class-validator';

/**
 * The DTO for a batch of IDs.
 */
export class BatchIdsBodyDto {
  /**
   * The IDs of the entities.
   */
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  /**
   * The fields to reconcile.
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
