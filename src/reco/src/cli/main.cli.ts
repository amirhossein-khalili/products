import { CommandFactory } from 'nest-commander';
import { CliModule } from './cli.module';

/**
 * The main entry point for the CLI application.
 * It uses the `CommandFactory` from `nest-commander` to run the CLI application.
 */
async function bootstrap() {
  await CommandFactory.run(CliModule, ['warn', 'error']);
}

bootstrap();
