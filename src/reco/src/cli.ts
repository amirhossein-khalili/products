#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .version('1.0.0')
  .description('CLI for data reconciliation')
  //
  // module that used this module : like Product module
  //
  .option('-n, --name <string>', 'aggregate name (required)', '')
  //
  // action like get-fields or others like batch , batch-fix the parts that is in the controller
  //
  // NOTE : some actions need id part like if user add should add id too
  .option('-a, --action <string>', 'module action (required)', '')
  .option('-i, --id <string>', 'single ID for check or reconcile actions')
  .option('-s, --ids <string>', 'comma-separated IDs for batch actions')
  //
  // filters are the same
  //
  .option('-f, --filter <JSON>', 'filter criteria as JSON string')
  //
  // fields are the same
  //
  .option('-fi, --fields <string>', 'comma-separated list of fields')
  .parse(process.argv);

const options = program.opts();

// Validate required options
if (!options.name || !options.action) {
  console.error('Error: --name and --action are required options');
  program.help();
  process.exit(1);
}

// Parse filter if provided
let filterObj = {};
if (options.filter) {
  try {
    filterObj = JSON.parse(options.filter);
  } catch (e) {
    console.error('Error: Invalid JSON format for --filter option');
    process.exit(1);
  }
}

// Parse fields if provided
let fieldsArray: string[] = [];
if (options.fields) {
  fieldsArray = options.fields.split(',');
}

// Your reconciliation logic here
console.log('Starting reconciliation with options:');
console.log({
  name: options.name,
  action: options.action,
  filter: Object.keys(filterObj).length ? filterObj : 'No filter',
  fields: fieldsArray.length ? fieldsArray : 'All fields',
});
