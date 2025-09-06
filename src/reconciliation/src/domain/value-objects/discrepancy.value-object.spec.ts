import { Discrepancy } from './discrepancy.value-object';

describe('Discrepancy', () => {
  it('should create a discrepancy with field, expected, and actual values', () => {
    const field = 'testField';
    const expected = 'expectedValue';
    const actual = 'actualValue';

    const discrepancy = Discrepancy.create(field, expected, actual);

    expect(discrepancy.field).toBe(field);
    expect(discrepancy.expected).toBe(expected);
    expect(discrepancy.actual).toBe(actual);
  });
});
