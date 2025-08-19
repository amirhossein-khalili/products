import { Injectable } from '@nestjs/common';
import { AggregateConfig } from './aggregate-config';

/**
 * Registry for holding configurations of aggregates that can be reconciled.
 * Other modules register their aggregate configurations here.
 */
@Injectable()
export class ConfigRegistry {
  private readonly configs = new Map<string, AggregateConfig>();

  /**
   * Register a configuration for an aggregate.
   * @param aggregateName Unique name for the aggregate.
   * @param config The AggregateConfig instance.
   */
  registerConfig(aggregateName: string, config: AggregateConfig): void {
    if (this.configs.has(aggregateName)) {
      throw new Error(`Configuration for ${aggregateName} already registered`);
    }
    this.configs.set(aggregateName, config);
  }

  /**
   * Retrieve the configuration for an aggregate.
   * @param aggregateName The name of the aggregate.
   * @returns The AggregateConfig or undefined if not found.
   */
  getConfig(aggregateName: string): AggregateConfig | undefined {
    return this.configs.get(aggregateName);
  }
}
