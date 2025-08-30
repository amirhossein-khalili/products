import { Controller, Get, Post, Body } from '@nestjs/common';
import { RecoRegistry, RecoServicePort } from '../application';
import { BatchIdsBodyDto, FilterBodyDto, SingleIdBodyDto } from './dtos';

@Controller()
export class RecoController {
  constructor(
    private readonly recoService: RecoServicePort,
    private readonly recoRegistry: RecoRegistry,
  ) {}

  @Get('all-modules')
  public getModules() {
    return this.recoRegistry.getAll();
  }

  @Get('fields')
  public getFields() {
    return this.recoService.getComparableFields();
  }

  @Post()
  public reco(@Body() body: SingleIdBodyDto) {
    const { id, fields } = body;
    return this.recoService.checkSingleId(id, fields);
  }

  @Post('fix')
  public recoFix(@Body() body: SingleIdBodyDto) {
    const { id, fields } = body;
    return this.recoService.reconcileById(id, fields);
  }

  @Post('batch')
  public recoBatch(@Body() body: BatchIdsBodyDto) {
    const { ids, fields } = body;
    return this.recoService.checkBatchIds(ids, fields);
  }

  @Post('batch/fix')
  public recoFixBatch(@Body() body: BatchIdsBodyDto) {
    const { ids, fields } = body;
    return this.recoService.reconcileBatchByIds(ids, fields);
  }

  @Post('all')
  public recoAll(@Body() body: FilterBodyDto) {
    return this.recoService.checkAll(body?.filters, body?.fields);
  }

  @Post('all/fix')
  public recoFixAll(@Body() body: FilterBodyDto) {
    return this.recoService.reconcileAll(body?.filters, body?.fields);
  }
}
