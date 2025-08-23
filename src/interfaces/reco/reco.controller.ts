import { Body, Controller, Get, Post } from '@nestjs/common';
import { RecoService } from './reco.service';

@Controller('reco')
export class RecoController {
  constructor(private readonly recoService: RecoService) {}

  /**
   * Returns the list of fields that can be used for reconciliation checks and fixes.
   * @example GET /reco/fields
   */
  @Get('fields')
  public async getFields() {
    return this.recoService.getComparableFields();
  }

  /**
   * Checks a single entity for discrepancies, optionally for specific fields.
   */
  @Post()
  public async reco(@Body() body: { id: string; fields?: string[] }) {
    const { id, fields } = body;
    return await this.recoService.checkSingleId(id, fields);
  }

  /**
   * Fixes discrepancies for a single entity, optionally for specific fields.
   */
  @Post('fix')
  public async recoFix(@Body() body: { id: string; fields?: string[] }) {
    const { id, fields } = body;
    return await this.recoService.reconcileById(id, fields);
  }

  /**
   * Checks a batch of entities for discrepancies, optionally for specific fields.
   * @example POST /reco/batch { "ids": ["id1", "id2"], "fields": ["price", "stock"] }
   */
  @Post('batch')
  public async recoBatch(@Body() body: { ids: string[]; fields?: string[] }) {
    const { ids, fields } = body;
    return await this.recoService.checkBatchIds(ids, fields);
  }

  /**
   * Fixes discrepancies for a batch of entities, optionally for specific fields.
   * @example POST /reco/batch/fix { "ids": ["id1", "id2"], "fields": ["status"] }
   */
  @Post('batch/fix')
  public async recoFixBatch(@Body() body: { ids: string[]; fields?: string[] }) {
    const { ids, fields } = body;
    return await this.recoService.reconcileBatchByIds(ids, fields);
  }

  /**
   * Checks entities for discrepancies, with optional filters and field selection.
   * @example POST /reco/all { "filters": { "status": "active" }, "fields": ["name"] }
   */
  @Post('all')
  public async recoAll(
    @Body() body: { filters?: Record<string, any>; fields?: string[] },
  ) {
    return await this.recoService.checkAll(body?.filters, body?.fields);
  }

  /**
   * Fixes discrepancies for entities, with optional filters and field selection.
   * @example POST /reco/all/fix { "filters": { "price": { "$gt": 100 } }, "fields": ["price"] }
   */
  @Post('all/fix')
  public async recoFixAll(
    @Body() body: { filters?: Record<string, any>; fields?: string[] },
  ) {
    return await this.recoService.reconcileAll(body?.filters, body?.fields);
  }
}
