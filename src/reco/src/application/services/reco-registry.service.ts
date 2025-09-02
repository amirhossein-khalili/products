import { Injectable } from '@nestjs/common';
import { RecoModuleOptions } from '../dtos/reco-module-options.dto';
import { RecoServicePort } from '../ports/reco-service.port';

/**
 * A registry for all reconciliation modules.
 * This service is used to keep track of all registered reconciliation modules and their services.
 */
@Injectable()
export class RecoRegistry {
  private readonly modules = new Map<
    string,
    { options: RecoModuleOptions; service: RecoServicePort }
  >();

  /**
   * Registers a new reconciliation module.
   * @param options The options of the module to register.
   * @param service The service of the module to register.
   * @throws {Error} If a module with the same name is already registered.
   */
  register(options: RecoModuleOptions, service: RecoServicePort) {
    if (this.modules.has(options.name)) {
      throw new Error(`Module with name ${options.name} already registered`);
    }
    this.modules.set(options.name, { options, service });
  }

  /**
   * Gets the options of all registered modules.
   * @returns An array of module options.
   */
  getAll(): RecoModuleOptions[] {
    return Array.from(this.modules.values()).map(({ options }) => options);
  }

  /**
   * Gets the service of a registered module by its name.
   * @param name The name of the module.
   * @returns The service of the module, or undefined if the module is not found.
   */
  getService(name: string): RecoServicePort | undefined {
    return this.modules.get(name)?.service;
  }
}
