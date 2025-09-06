import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { RecoRegistry } from './reconciliation-registry.service';
import { RecoModuleOptions } from '../dtos/reconciliation-module-options.dto';
import { RECO_SERVICE_PORT } from '../constants/tokens';
import { RecoServicePort } from '../ports/reconciliation-service.port';

/**
 * Registers the reconciliation service in the RecoRegistry when the module is initialized.
 */
@Injectable()
export class RecoRegistrator implements OnModuleInit {
  constructor(
    private readonly registry: RecoRegistry,
    @Inject(RECO_SERVICE_PORT)
    private readonly service: RecoServicePort,
    @Inject('RECO_OPTIONS')
    private readonly options: RecoModuleOptions,
  ) {}

  onModuleInit() {
    this.registry.register(this.options, this.service);
  }
}
