import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ReconciliationRegistry,
  ReconciliationServicePort,
} from '../application';
import { BatchIdsBodyDto, FilterBodyDto, SingleIdBodyDto } from './dtos';

/**
 * The main controller for the reconciliation service.
 * This controller exposes the reconciliation service as a REST API.
 */
@Controller()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ReconciliationController {
  constructor(
    private readonly recoService: ReconciliationServicePort,
    private readonly recoRegistry: ReconciliationRegistry,
  ) {}

  /**
   * Gets all registered reconciliation modules.
   * @returns An array of module options.
   */
  @Get('all-modules')
  public getModules() {
    return this.recoRegistry.getAll();
  }

  /**
   * Gets the comparable fields of the reconciliation module.
   * @returns An array of comparable fields.
   */
  @Get('fields')
  public getFields() {
    return this.recoService.getComparableFields();
  }

  /**
   * Checks a single entity.
   * @param body The request body.
   * @returns The result of the check.
   */
  @Post()
  public reconciliation(@Body() body: SingleIdBodyDto) {
    const { id, fields } = body;
    return this.recoService.checkSingleId(id, fields);
  }

  /**
   * Fixes a single entity.
   * @param body The request body.
   * @returns The result of the fix.
   */
  @Post('fix')
  public recoFix(@Body() body: SingleIdBodyDto) {
    const { id, fields } = body;
    return this.recoService.reconcileById(id, fields);
  }

  /**
   * Checks a batch of entities.
   * @param body The request body.
   * @returns The result of the check.
   */
  @Post('batch')
  public recoBatch(@Body() body: BatchIdsBodyDto) {
    const { ids, fields } = body;
    return this.recoService.checkBatchIds(ids, fields);
  }

  /**
   * Fixes a batch of entities.
   * @param body The request body.
   * @returns The result of the fix.
   */
  @Post('batch/fix')
  public recoFixBatch(@Body() body: BatchIdsBodyDto) {
    const { ids, fields } = body;
    return this.recoService.reconcileBatchByIds(ids, fields);
  }

  /**
   * Checks all entities.
   * @param body The request body.
   * @returns The result of the check.
   */
  @Post('all')
  public recoAll(@Body() body: FilterBodyDto) {
    return this.recoService.checkAll(body?.filters, body?.fields);
  }

  /**
   * Fixes all entities.
   * @param body The request body.
   * @returns The result of the fix.
   */
  @Post('all/fix')
  public recoFixAll(@Body() body: FilterBodyDto) {
    return this.recoService.reconcileAll(body?.filters, body?.fields);
  }
}
