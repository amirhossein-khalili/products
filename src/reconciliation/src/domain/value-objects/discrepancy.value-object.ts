/**
 * A value object that represents a discrepancy between two states.
 */
export class Discrepancy {
  /**
   * @param field The field where the discrepancy was found.
   * @param expected The expected value of the field.
   * @param actual The actual value of the field.
   */
  constructor(
    public readonly field: string,
    public readonly expected: any,
    public readonly actual: any,
  ) {}

  /**
   * Creates a new `Discrepancy` object.
   * @param field The field where the discrepancy was found.
   * @param expected The expected value of the field.
   * @param actual The actual value of the field.
   * @returns A new `Discrepancy` object.
   */
  static create(field: string, expected: any, actual: any): Discrepancy {
    return new Discrepancy(field, expected, actual);
  }
}
