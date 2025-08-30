import {
  Command,
  CommandRunner,
  InquirerService,
  Option,
} from 'nest-commander';

@Command({
  name: 'create-reco',
  description: 'A command to create a new reco',
})
export class RecoCommand extends CommandRunner {
  constructor(private readonly inquirer: InquirerService) {
    super();
  }

  // Update the options interface to include the new properties
  async run(
    passedParams: string[],
    options?: {
      action?: string;
      name?: string;
      filter?: Record<string, any>; // Will be a parsed object from the JSON string
      fields?: string[]; // Will be an array of strings
    },
  ): Promise<void> {
    let action = options?.action;
    let name = options?.name;

    // --- Interactive questions for action and name remain the same ---
    if (!action) {
      action = (
        await this.inquirer.ask<{ action: string }>(
          'action-question',
          undefined,
        )
      ).action;
    }
    if (!name) {
      name = (
        await this.inquirer.ask<{ name: string }>('name-question', undefined)
      ).name;
    }

    // --- Directly use the new optional flags ---
    const filter = options?.filter;
    const fields = options?.fields;

    try {
      // Use the variables in your service logic
      console.log('✅ Reco command executed with the following parameters:');
      console.log(`- Action: ${action}`);
      console.log(`- Name: ${name}`);

      if (filter) {
        console.log(`- Filter Object: ${JSON.stringify(filter, null, 2)}`);
      } else {
        console.log('- Filter: Not provided');
      }

      if (fields && fields.length > 0) {
        console.log(`- Fields: [${fields.join(', ')}]`);
      } else {
        console.log('- Fields: Not provided');
      }

      // Example of your service call would go here
      // await this.recoService.process({ action, name, filter, fields });
    } catch (error) {
      console.error('❌ Error creating reco:', error.message);
    }
  }

  // --- Existing Options ---
  @Option({
    flags: '-a, --action [string]',
    description: 'The action to perform on the reco entity',
  })
  parseAction(val: string): string {
    return val;
  }

  @Option({
    flags: '-n, --name [string]',
    description: 'The name for the reco entity',
  })
  parseName(val: string): string {
    return val;
  }

  // --- NEW: Option for JSON filter ---
  @Option({
    flags: '-f, --filter [json]',
    description: 'A JSON string to filter entities',
  })
  parseFilter(val: string): Record<string, any> {
    try {
      // This will parse the JSON string from the CLI into a JavaScript object
      return JSON.parse(val);
    } catch (error) {
      // nest-commander will catch this and display a user-friendly error
      throw new Error('Invalid JSON provided for --filter option.');
    }
  }

  // --- NEW: Option for a list of fields ---
  @Option({
    flags: '-p, --fields [fields...]', // The '...' makes this a variadic option
    description: 'A list of specific fields to check or reconcile',
  })
  parseFields(field: string, previous: string[] = []): string[] {
    // This function is called for each field provided.
    // It accumulates them into a single array.
    return [...previous, field];
  }
}
