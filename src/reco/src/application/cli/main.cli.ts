import { RecoModule } from 'com.chargoon.cloud.svc.common';
import { CommandFactory } from 'nest-commander';

/**
 * The main entry point for the CLI application.
 * It uses the `CommandFactory` from `nest-commander` to run the CLI application.
 */
async function bootstrap() {
  await CommandFactory.run(RecoModule, ['warn', 'error']);
}

bootstrap();
