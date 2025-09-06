import { Injectable } from '@nestjs/common';
import { ReconciliationModuleOptions } from '../dtos/reconciliation-module-options.dto';
import { ReconciliationServicePort } from '../ports/reconciliation-service.port';

/**
 * A registry for all reconciliation modules.
 * This service is used to keep track of all registered reconciliation modules and their services.
 */
@Injectable()
export class ReconciliationRegistry {
  private readonly modules = new Map<
    string,
    { options: ReconciliationModuleOptions; service: ReconciliationServicePort }
  >();

  /**
   * Registers a new reconciliation module.
   * @param options The options of the module to register.
   * @param service The service of the module to register.
   * @throws {Error} If a module with the same name is already registered.
   */
  register(
    options: ReconciliationModuleOptions,
    service: ReconciliationServicePort,
  ) {
    if (this.modules.has(options.name)) {
      throw new Error(`Module with name ${options.name} already registered`);
    }
    this.modules.set(options.name, { options, service });
  }

  /**
   * Gets the options of all registered modules.
   * @returns An array of module options.
   */
  getAll(): ReconciliationModuleOptions[] {
    return Array.from(this.modules.values()).map(({ options }) => options);
  }

  /**
   * Gets the service of a registered module by its name.
   * @param name The name of the module.
   * @returns The service of the module, or undefined if the module is not found.
   */
  getService(name: string): ReconciliationServicePort | undefined {
    return this.modules.get(name)?.service;
  }
}
