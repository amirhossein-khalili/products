import { Controller, Get, Post, Body } from '@nestjs/common';
import { RecoServicePort } from '../application';

@Controller()
export class RecoController {
  constructor(private readonly recoService: RecoServicePort) {}

  @Get('fields')
  public async getFields() {
    return this.recoService.getComparableFields();
  }

  @Post()
  public async reco(@Body() body: { id: string; fields?: string[] }) {
    const { id, fields } = body;
    return await this.recoService.checkSingleId(id, fields);
  }

  @Post('fix')
  public async recoFix(@Body() body: { id: string; fields?: string[] }) {
    const { id, fields } = body;
    return await this.recoService.reconcileById(id, fields);
  }

  @Post('batch')
  public async recoBatch(@Body() body: { ids: string[]; fields?: string[] }) {
    const { ids, fields } = body;
    return await this.recoService.checkBatchIds(ids, fields);
  }

  @Post('batch/fix')
  public async recoFixBatch(
    @Body() body: { ids: string[]; fields?: string[] },
  ) {
    const { ids, fields } = body;
    return await this.recoService.reconcileBatchByIds(ids, fields);
  }

  @Post('all')
  public async recoAll(
    @Body() body: { filters?: Record<string, any>; fields?: string[] },
  ) {
    return await this.recoService.checkAll(body?.filters, body?.fields);
  }

  @Post('all/fix')
  public async recoFixAll(
    @Body() body: { filters?: Record<string, any>; fields?: string[] },
  ) {
    return await this.recoService.reconcileAll(body?.filters, body?.fields);
  }
}
