import { ReconciliationModuleOptions } from './reconciliation-module-options.dto';

export interface ReconciliationCliConfig {
  mongo: {
    uri: string;
  };
  eventStore: {
    connectionString?: string;
    endpoint?: { address: string; port: number | string };
    channelCredentials?: { insecure?: boolean };
    defaultUserCredentials?: { username: string; password: string };
    subscriptions: any;
    transformers: any;
  };
  features: ReconciliationModuleOptions[];
}
