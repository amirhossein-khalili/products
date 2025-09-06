import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ReconciliationRegistry } from './reconciliation-registry.service';
import { ReconciliationModuleOptions } from '../dtos/reconciliation-module-options.dto';
import { RECONCILIATION_SERVICE_PORT } from '../constants/tokens';
import { ReconciliationServicePort } from '../ports/reconciliation-service.port';

/**
 * Registers the reconciliation service in the RecoRegistry when the module is initialized.
 */
@Injectable()
export class ReconciliationRegistrator implements OnModuleInit {
  constructor(
    private readonly registry: ReconciliationRegistry,
    @Inject(RECONCILIATION_SERVICE_PORT)
    private readonly service: ReconciliationServicePort,
    @Inject('RECONCILIATION_OPTIONS')
    private readonly options: ReconciliationModuleOptions,
  ) {}

  onModuleInit() {
    this.registry.register(this.options, this.service);
  }
}
