import { ComparisonResult } from '../../../src/domain/aggregates/comparison-result.aggregate';
import { Discrepancy } from '../../../src/domain/value-objects/discrepancy.value-object';

describe('ComparisonResult', () => {
  it('should create a match result correctly', () => {
    const id = '123';
    const result = ComparisonResult.createMatch(id);

    expect(result.id).toBe(id);
    expect(result.isMatch).toBe(true);
    expect(result.discrepancies).toEqual([]);
    expect(result.details).toBe('States match');
  });

  it('should create a mismatch result correctly', () => {
    const id = '123';
    const discrepancies = [Discrepancy.create('field1', 'expected', 'actual')];
    const result = ComparisonResult.createMismatch(id, discrepancies);

    expect(result.id).toBe(id);
    expect(result.isMatch).toBe(false);
    expect(result.discrepancies).toEqual(discrepancies);
    expect(result.details).toBe('Mismatch detected in 1 fields');
  });
});
