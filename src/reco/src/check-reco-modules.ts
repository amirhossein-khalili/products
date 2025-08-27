import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { RecoRegistry } from './application';

interface Options {
  filter?: Record<string, any>;
  fields?: string[];
  id?: string;
}

async function executeRecoAction(
  moduleName: string,
  action: string,
  options: Options,
  service: any, // RecoServicePort
) {
  console.log(`Executing action '${action}' on module '${moduleName}'`);
  console.log(
    `Filters: ${options.filter ? JSON.stringify(options.filter) : 'None'}`,
  );
  console.log(
    `Fields: ${options.fields ? options.fields.join(', ') : 'All fields'}`,
  );

  let result;
  if (action === 'check') {
    if (options.id) {
      result = await service.checkSingleId(options.id, options.fields);
    } else {
      result = await service.checkAll(options.filter, options.fields);
    }
  } else if (action === 'fix') {
    if (options.id) {
      result = await service.reconcileById(options.id, options.fields);
    } else {
      result = await service.reconcileAll(options.filter, options.fields);
    }
  } else if (action === 'all') {
    result = await service.checkAll(options.filter, options.fields);
  } else if (action === 'all/fix') {
    result = await service.reconcileAll(options.filter, options.fields);
  } else {
    console.error(`Unknown action: ${action}`);
    process.exit(1);
  }

  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
}

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'Module name to check',
  })
  .option('action', {
    alias: 'a',
    type: 'string',
    description: 'Action to perform: check, fix, all, all/fix',
  })
  .option('id', {
    type: 'string',
    description: 'ID for single check/fix',
  })
  .option('filter', {
    alias: 'f',
    type: 'string',
    description: 'Filter as JSON string',
  })
  .option('fields', {
    type: 'string',
    description: 'Comma-separated list of fields',
  })
  .option('app-module', {
    type: 'string',
    default: 'src/app.module.ts',
    description: 'Path to the AppModule file',
  })
  .parseSync();

// Main execution
async function main() {
  try {
    const appModulePath = path.resolve(process.cwd(), argv.appModule);
    const appModuleModule = await import(appModulePath);
    const AppModule = appModuleModule.AppModule || appModuleModule.default;
    if (!AppModule) {
      throw new Error(`No AppModule found in ${appModulePath}`);
    }

    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    const registry = app.get(RecoRegistry);

    if (!argv.name) {
      // List modules
      const modules = registry.getAll();
      console.log('Modules using RecoModule.forFeature:');
      modules.forEach((module) => {
        console.log(`  Module Name: '${module.name}'`);
        console.log(`  Path: '${module.path}'`);
        console.log();
      });
      await app.close();
      return;
    }

    // Execute action on specific module
    const service = registry.getService(argv.name);
    if (!service) {
      console.error(`Module '${argv.name}' not found. Available modules:`);
      registry.getAll().forEach((m) => console.log(`  - ${m.name}`));
      await app.close();
      process.exit(1);
    }

    const options: Options = {
      filter: argv.filter ? JSON.parse(argv.filter) : undefined,
      fields: argv.fields ? argv.fields.split(',') : undefined,
      id: argv.id,
    };

    await executeRecoAction(
      argv.name,
      argv.action || 'check',
      options,
      service,
    );
    await app.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
