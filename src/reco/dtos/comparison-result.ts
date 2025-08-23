import { Discrepancy } from './discrepancy';

/**
 * Result of a state comparison, including detailed discrepancies.
 */
export class ComparisonResult {
  constructor(
    public readonly id: string,
    public readonly isMatch: boolean,
    public readonly discrepancies: Discrepancy[] = [],
    public readonly details: string = '',
  ) {}
}
