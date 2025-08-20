import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';

const aggregateToModuleMap: Record<string, string> = {
  products: '../products.module',
};

function parseAggregateName(argv: string[]): string {
  const reconcileIndex = argv.findIndex((arg) => arg === 'reconcile');
  if (reconcileIndex !== -1 && argv[reconcileIndex + 1]) {
    return argv[reconcileIndex + 1];
  }
  throw new Error(
    'No aggregate name provided. Usage: reconcile <aggregate> [options]',
  );
}

async function bootstrap() {
  const aggregateName = parseAggregateName(process.argv);
  const modulePath = aggregateToModuleMap[aggregateName];
  if (!modulePath) {
    throw new Error(
      `No module mapped for aggregate: ${aggregateName}. Update the map.`,
    );
  }

  const { ProductsModule: DomainModule } = await import(modulePath);

  const app = await NestFactory.createApplicationContext(DomainModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    await app.select(CommandModule).get(CommandService).exec();
    await app.close();
  } catch (error) {
    console.error('CLI execution failed:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
