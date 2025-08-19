import { Injectable } from '@nestjs/common';
import { Command, Positional, Option } from 'nestjs-command';
import { ReconciliationMode, ResultMode } from '../enums';
import { RateLimit } from '../dtos';
import { ReconciliationConfig } from '../config';
// import { Queue } from 'bullmq';

@Injectable()
export class ReconciliationCommand {
  constructor() {}

  @Command({
    command: 'reconcile <aggregateName>',
    describe: 'Schedule reconciliation for a specific aggregate',
  })
  async execute(
    @Positional({
      name: 'aggregateName',
      describe: 'The name of the aggregate to reconcile',
      type: 'string',
    })
    aggregateName: string,

    @Option({
      name: 'mode',
      describe: `Reconciliation mode (${Object.values(ReconciliationMode).join(', ')})`,
      type: 'string',
      default: ReconciliationMode.FULL_CHECK,
    })
    reconMode: ReconciliationMode,

    @Option({
      name: 'result-mode',
      describe: `How to handle results (${Object.values(ResultMode).join(', ')})`,
      type: 'string',
      default: ResultMode.DATABASE_ONLY,
    })
    resultMode: ResultMode,

    @Option({
      name: 'batch-size',
      describe: 'Number of IDs to process in each batch',
      type: 'number',
      default: 100,
    })
    batchSize: number,
  ): Promise<void> {
    console.log(`--- Starting reconciliation for ${aggregateName} ---`);
    console.log(
      `Mode: ${reconMode}, Result Mode: ${resultMode}, Batch Size: ${batchSize}`,
    );

    const config = new ReconciliationConfig(
      aggregateName,
      reconMode,
      new RateLimit(10, 60, 20),
      new Date(),
      resultMode,
      batchSize,
      {},
    );

    this.validateConfig(config);

    console.log('inja ');
    console.log(config);
    // const job = await this.reconciliationQueue.add(
    //   'reconcile-aggregate',
    //   config,
    //   {
    //     attempts: 3,
    //     backoff: {
    //       type: 'exponential',
    //       delay: 1000,
    //     },
    //   },
    // );
    // console.log(`Reconciliation task scheduled with ID: ${job.id}`);
  }

  private validateConfig(config: ReconciliationConfig): void {
    if (!config.aggregateName) {
      throw new Error('Aggregate name is required');
    }
  }
}
