export class Discrepancy {
  constructor(
    public readonly field: string,
    public readonly expected: any,
    public readonly actual: any,
  ) {}

  static create(field: string, expected: any, actual: any): Discrepancy {
    return new Discrepancy(field, expected, actual);
  }
}
