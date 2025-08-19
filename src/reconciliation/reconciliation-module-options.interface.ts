import { AggregateConfig } from './config';

/**
 * @interface ReconciliationAggregateDefinition
 * @description Defines the structure for registering a single aggregate for reconciliation.
 * @property {string} name - The unique name of the aggregate (e.g., 'user', 'order').
 * @property {AggregateConfig} config - The detailed configuration for the aggregate.
 */
export interface ReconciliationAggregateDefinition {
  name: string;
  config: AggregateConfig;
}

/**
 * @interface ReconciliationModuleOptions
 * @description Defines the options that can be passed to the ReconciliationModule's forRoot method.
 * @property {ReconciliationAggregateDefinition[]} aggregates - An array of aggregate definitions to be registered.
 */
export interface ReconciliationModuleOptions {
  aggregates: ReconciliationAggregateDefinition[];
}
