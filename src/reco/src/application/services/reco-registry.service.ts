import { Injectable } from '@nestjs/common';
import { RecoModuleOptions } from '../dtos/reco-module-options.dto';
import { RecoServicePort } from '../ports/reco-service.port';

@Injectable()
export class RecoRegistry {
  private readonly modules = new Map<
    string,
    { options: RecoModuleOptions; service: RecoServicePort }
  >();

  register(options: RecoModuleOptions, service: RecoServicePort) {
    if (this.modules.has(options.name)) {
      throw new Error(`Module with name ${options.name} already registered`);
    }
    this.modules.set(options.name, { options, service });
  }

  getAll(): RecoModuleOptions[] {
    return Array.from(this.modules.values()).map(({ options }) => options);
  }

  getService(name: string): RecoServicePort | undefined {
    return this.modules.get(name)?.service;
  }
}
