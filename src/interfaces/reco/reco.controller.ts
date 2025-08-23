import { Body, Controller, Post } from '@nestjs/common';
import { RecoService } from './reco.service';

@Controller('reco')
export class RecoController {
  constructor(private readonly recoService: RecoService) {}

  /**
   * Checks a single entity for discrepancies.
   */
  @Post()
  public async reco(@Body() body: { id: string }) {
    const { id } = body;
    return await this.recoService.checkSingleId(id);
  }

  /**
   * Fixes discrepancies for a single entity.
   */
  @Post('fix')
  public async recoFix(@Body() body: { id: string }) {
    const { id } = body;
    return await this.recoService.reconcileById(id);
  }

  /**
   * Checks a batch of entities for discrepancies.
   * @param body - The request body containing an array of IDs.
   * @example POST /reco/batch { "ids": ["id1", "id2", "id3"] }
   */
  @Post('batch')
  public async recoBatch(@Body() body: { ids: string[] }) {
    const { ids } = body;
    return await this.recoService.checkBatchIds(ids);
  }

  /**
   * Fixes discrepancies for a batch of entities.
   * @param body - The request body containing an array of IDs.
   * @example POST /reco/batch/fix { "ids": ["id1", "id2", "id3"] }
   */
  @Post('batch/fix')
  public async recoFixBatch(@Body() body: { ids: string[] }) {
    const { ids } = body;
    return await this.recoService.reconcileBatchByIds(ids);
  }
}
