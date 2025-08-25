import { StateComparator } from '../../application';
import { Discrepancy, ComparisonResult } from '../../domain';

describe('StateComparator', () => {
  let stateComparator: StateComparator;

  beforeEach(() => {
    stateComparator = new StateComparator();
  });

  it('should be defined', () => {
    expect(stateComparator).toBeDefined();
  });

  // Test Case 1: Identical simple objects
  describe('when comparing two identical simple objects', () => {
    it('should return a match result with an empty discrepancies array', () => {
      const obj1 = { _id: '1', name: 'test', value: 100 };
      const obj2 = { _id: '1', name: 'test', value: 100 };

      const result = stateComparator.compare(obj1, obj2);

      expect(result.isMatch).toBe(true);
      expect(result.discrepancies).toEqual([]);
      expect(result).toBeInstanceOf(ComparisonResult);
    });
  });

  // Test Case 2: Different top-level field
  describe('when a top-level field is different', () => {
    it('should return a mismatch result with a Discrepancy object', () => {
      const obj1 = { _id: '1', name: 'testA', value: 100 };
      const obj2 = { _id: '1', name: 'testB', value: 100 };

      const result = stateComparator.compare(obj1, obj2);

      expect(result.isMatch).toBe(false);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0]).toBeInstanceOf(Discrepancy);
      expect(result.discrepancies[0]).toEqual(
        Discrepancy.create('name', 'testA', 'testB'),
      );
    });
  });

  // Test Case 3: Different nested object field
  describe('when comparing objects with different nested values', () => {
    it('should identify differences using dot notation for the path', () => {
      const obj1 = { _id: '1', data: { user: { name: 'John' } } };
      const obj2 = { _id: '1', data: { user: { name: 'Jane' } } };

      const result = stateComparator.compare(obj1, obj2);

      expect(result.isMatch).toBe(false);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].field).toBe('data.user.name');
      expect(result.discrepancies[0].expected).toBe('John');
      expect(result.discrepancies[0].actual).toBe('Jane');
    });
  });

  // Test Case 4: Handling null and undefined
  describe('when handling null and undefined values', () => {
    it('should correctly report a discrepancy from a value to undefined', () => {
      const obj1 = { _id: '1', name: 'test', value: 100 };
      const obj2 = { _id: '1', name: 'test' }; // value is undefined

      const result = stateComparator.compare(obj1, obj2);

      expect(result.isMatch).toBe(false);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].field).toBe('value');
      expect(result.discrepancies[0].expected).toBe(100);
      expect(result.discrepancies[0].actual).toBeUndefined();
    });

    it('should correctly report a discrepancy from null to a value', () => {
      const obj1 = { _id: '1', name: 'test', value: null };
      const obj2 = { _id: '1', name: 'test', value: 100 };

      const result = stateComparator.compare(obj1, obj2);

      expect(result.isMatch).toBe(false);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].field).toBe('value');
      expect(result.discrepancies[0].expected).toBeNull();
      expect(result.discrepancies[0].actual).toBe(100);
    });
  });
});
