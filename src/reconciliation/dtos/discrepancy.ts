/**
 * Data structure for a single discrepancy in a comparison.
 * Updated to include field path for better debugging.
 */
export class Discrepancy {
  constructor(
    public readonly field: string,
    public readonly expected: any,
    public readonly actual: any,
  ) {}
}
