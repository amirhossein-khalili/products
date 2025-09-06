import { ComparisonResult } from '../aggregates/comparison-result.aggregate';
import { Discrepancy } from '../value-objects/discrepancy.value-object';

describe('ComparisonResult', () => {
  const entityId = 'entity-123';

  describe('createMatch', () => {
    it('should create a result with isMatch: true and no discrepancies', () => {
      const result = ComparisonResult.createMatch(entityId);

      expect(result).toBeInstanceOf(ComparisonResult);
      expect(result.id).toBe(entityId);
      expect(result.isMatch).toBe(true);
      expect(result.discrepancies).toEqual([]);
      expect(result.details).toBe('States match');
    });
  });

  describe('createMismatch', () => {
    it('should create a result with isMatch: false and store discrepancies', () => {
      const discrepancies = [
        Discrepancy.create('field1', 'expected1', 'actual1'),
        Discrepancy.create('field2', 'expected2', 'actual2'),
      ];

      const result = ComparisonResult.createMismatch(entityId, discrepancies);

      expect(result).toBeInstanceOf(ComparisonResult);
      expect(result.id).toBe(entityId);
      expect(result.isMatch).toBe(false);
      expect(result.discrepancies).toHaveLength(2);
      expect(result.discrepancies).toEqual(discrepancies);
      expect(result.details).toBe('Mismatch detected in 2 fields');
    });
  });

  describe('isMatch property', () => {
    it('should be true when created with createMatch', () => {
      const result = ComparisonResult.createMatch(entityId);
      expect(result.isMatch).toBe(true);
    });

    it('should be false when created with createMismatch', () => {
      const discrepancies = [Discrepancy.create('field', 'a', 'b')];
      const result = ComparisonResult.createMismatch(entityId, discrepancies);
      expect(result.isMatch).toBe(false);
    });
  });
});
