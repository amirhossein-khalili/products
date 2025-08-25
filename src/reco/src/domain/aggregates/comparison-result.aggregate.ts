import { Discrepancy } from '../value-objects/discrepancy.value-object';

export class ComparisonResult {
  constructor(
    public readonly id: string,
    public readonly isMatch: boolean,
    public readonly discrepancies: Discrepancy[] = [],
    public readonly details: string = '',
  ) {}

  static createMatch(id: string): ComparisonResult {
    return new ComparisonResult(id, true, [], 'States match');
  }

  static createMismatch(id: string, discrepancies: Discrepancy[]): ComparisonResult {
    return new ComparisonResult(
      id,
      false,
      discrepancies,
      `Mismatch detected in ${discrepancies.length} fields`
    );
  }
}
