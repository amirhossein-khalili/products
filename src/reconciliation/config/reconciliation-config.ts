import { RateLimit } from '../dtos';
import { ReconciliationMode, ResultMode } from '../enums';

export class ReconciliationConfig {
  constructor(
    public readonly aggregateName: string,
    public readonly mode: ReconciliationMode,
    public readonly rate: RateLimit,
    public readonly startTime: Date,
    public readonly resultMode: ResultMode,
    public readonly batchSize: number,
    public readonly filters: Record<string, any>,
  ) {}
}
