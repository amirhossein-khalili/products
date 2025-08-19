import { Discrepancy } from './discrepancy';

export class ReconciliationResult {
  constructor(
    public readonly id: string,
    public readonly timestamp: Date,
    public readonly isMatch: boolean,
    public readonly discrepancies: Discrepancy[],
    public readonly executionTime: number,
    public readonly aggregateType: string,
  ) {}
}
