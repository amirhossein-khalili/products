#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .version('1.0.0')
  .description('CLI for data reconciliation')
  .option('-n, --name <string>', 'aggregate name (required)', '')
  .option('-p, --path <string>', 'module path (required)', '')
  .option('-f, --filter <JSON>', 'filter criteria as JSON string')
  .option('--fields <string>', 'comma-separated list of fields')
  .parse(process.argv);

const options = program.opts();

// Validate required options
if (!options.name || !options.path) {
  console.error('Error: --name and --path are required options');
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
  path: options.path,
  filter: Object.keys(filterObj).length ? filterObj : 'No filter',
  fields: fieldsArray.length ? fieldsArray : 'All fields',
});

