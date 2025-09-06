import {
  Command,
  CommandRunner,
  InquirerService,
  Option,
} from 'nest-commander';
import { Logger } from '@nestjs/common';
import { ReconciliationRegistry } from '../services/reconciliation-registry.service';
import { CliReportGenerator } from '../services/cli-report-generator.service';

@Command({
  name: 'Reconciliation',
  description:
    'Run reconciliation checks and fixes and export results to Excel.',
  aliases: ['reconciliation'],
})
export class ReconciliationCommand extends CommandRunner {
  readonly logger = new Logger(ReconciliationCommand.name);

  constructor(
    private readonly inquirer: InquirerService,
    private readonly reconciliationRegistry: ReconciliationRegistry,
    private readonly reportGenerator: CliReportGenerator,
  ) {
    super();
  }

  /**
   * Runs the reconciliation command.
   * It prompts the user for any missing options and then generates a report.
   * @param passedParams The parameters passed to the command.
   * @param options The options passed to the command.
   */
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

    if (!name) {
      name = (
        await this.inquirer.ask<{ name: string }>('name-question', undefined)
      ).name;
    }
    if (!action) {
      action = (
        await this.inquirer.ask<{ action: 'check' | 'fix' }>(
          'action-question',
          undefined,
        )
      ).action as 'check' | 'fix';
    }

    const reconciliationService = this.reconciliationRegistry.getService(name);
    if (!reconciliationService) {
      this.logger.error(
        `❌ Error: No reconciliation module found with the name "${name}".`,
      );
      return;
    }

    try {
      await this.reportGenerator.generateReport({
        recoService: reconciliationService,
        action,
        name,
        ids,
        filter,
        fields,
      });
    } catch (error) {
      this.logger.error(
        '❌ An unexpected error occurred during command execution:',
        error.message,
      );
    }
  }

  /**
   * Parses the action option.
   * @param val The value of the option.
   * @returns The parsed action.
   */
  @Option({
    flags: '-a, --action [string]',
    description: 'The action: "check" or "fix"',
  })
  parseAction(val: string): 'check' | 'fix' {
    if (val !== 'check' && val !== 'fix')
      throw new Error('Action must be either "check" or "fix"');
    return val;
  }

  /**
   * Parses the name option.
   * @param val The value of the option.
   * @returns The parsed name.
   */
  @Option({
    flags: '-n, --name [string]',
    description: 'The name of the reconciliation module to run',
  })
  parseName(val: string): string {
    return val;
  }

  /**
   * Parses the ids option.
   * @param id The value of the option.
   * @param previous The previous values of the option.
   * @returns The parsed ids.
   */
  @Option({
    flags: '-i, --ids [ids...]',
    description: 'A list of specific entity IDs',
  })
  parseIds(id: string, previous: string[] = []): string[] {
    return [...previous, id];
  }

  /**
   * Parses the filter option.
   * @param val The value of the option.
   * @returns The parsed filter.
   */
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

  /**
   * Parses the fields option.
   * @param field The value of the option.
   * @param previous The previous values of the option.
   * @returns The parsed fields.
   */
  @Option({
    flags: '-p, --fields [fields...]',
    description: 'A list of specific fields',
  })
  parseFields(field: string, previous: string[] = []): string[] {
    return [...previous, field];
  }
}
