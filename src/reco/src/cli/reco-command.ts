import {
  Command,
  CommandRunner,
  InquirerService,
  Option,
} from 'nest-commander';
import { RecoRegistry } from '../application/services/reco-registry.service';
import { CliReportGenerator } from './cli-report-generator.service';

@Command({
  name: 'reco',
  description:
    'Run reconciliation checks and fixes and export results to Excel.',
  aliases: ['create-reco'],
})
export class RecoCommand extends CommandRunner {
  constructor(
    private readonly inquirer: InquirerService,
    private readonly recoRegistry: RecoRegistry,
    private readonly reportGenerator: CliReportGenerator,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options?: {
      action?: 'check' | 'fix';
      name?: string;
      ids?: string[];
      filter?: Record<string, any>;
      fields?: string[];
    },
  ): Promise<void> {
    let { action, name, ids, filter, fields } = options;

    // --- Interactive questions ---
    if (!name) {
      // Assuming you have a question set named 'name-question'
      name = (
        await this.inquirer.ask<{ name: string }>('name-question', undefined)
      ).name;
    }
    if (!action) {
      // Assuming you have a question set named 'action-question'
      action = (
        await this.inquirer.ask<{ action: 'check' | 'fix' }>(
          'action-question',
          undefined,
        )
      ).action as 'check' | 'fix';
    }

    // --- Get the correct service instance ---
    const recoService = this.recoRegistry.getService(name);
    if (!recoService) {
      console.error(
        `❌ Error: No reconciliation module found with the name "${name}".`,
      );
      return;
    }

    // --- Execute the report generator ---
    try {
      await this.reportGenerator.generateReport({
        recoService,
        action,
        name,
        ids,
        filter,
        fields,
      });
    } catch (error) {
      console.error(
        '❌ An unexpected error occurred during command execution:',
        error.message,
      );
    }
  }

  // --- Command-line Options ---
  @Option({
    flags: '-a, --action [string]',
    description: 'The action: "check" or "fix"',
  })
  parseAction(val: string): 'check' | 'fix' {
    if (val !== 'check' && val !== 'fix')
      throw new Error('Action must be either "check" or "fix"');
    return val;
  }

  @Option({
    flags: '-n, --name [string]',
    description: 'The name of the reco module to run',
  })
  parseName(val: string): string {
    return val;
  }

  @Option({
    flags: '-i, --ids [ids...]',
    description: 'A list of specific entity IDs',
  })
  parseIds(id: string, previous: string[] = []): string[] {
    return [...previous, id];
  }

  @Option({
    flags: '-f, --filter [json]',
    description: 'A JSON string to filter entities',
  })
  parseFilter(val: string): Record<string, any> {
    try {
      return JSON.parse(val);
    } catch (e) {
      throw new Error('Invalid JSON for --filter');
    }
  }

  @Option({
    flags: '-p, --fields [fields...]',
    description: 'A list of specific fields',
  })
  parseFields(field: string, previous: string[] = []): string[] {
    return [...previous, field];
  }
}
