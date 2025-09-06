import { Discrepancy } from '../value-objects/discrepancy.value-object';

/**
 * An aggregate that represents the result of a comparison between two states.
 */
export class ComparisonResult {
  /**
   * @param id The ID of the entity that was compared.
   * @param isMatch Whether the states match.
   * @param discrepancies An array of discrepancies found between the states.
   * @param details A summary of the comparison result.
   */
  constructor(
    public readonly id: string,
    public readonly isMatch: boolean,
    public readonly discrepancies: Discrepancy[] = [],
    public readonly details: string = '',
  ) {}

  /**
   * Creates a new `ComparisonResult` for a match.
   * @param id The ID of the entity that was compared.
   * @returns A new `ComparisonResult` object.
   */
  static createMatch(id: string): ComparisonResult {
    return new ComparisonResult(id, true, [], 'States match');
  }

  /**
   * Creates a new `ComparisonResult` for a mismatch.
   * @param id The ID of the entity that was compared.
   * @param discrepancies An array of discrepancies found between the states.
   * @returns A new `ComparisonResult` object.
   */
  static createMismatch(
    id: string,
    discrepancies: Discrepancy[],
  ): ComparisonResult {
    return new ComparisonResult(
      id,
      false,
      discrepancies,
      `Mismatch detected in ${discrepancies.length} fields`,
    );
  }
}
