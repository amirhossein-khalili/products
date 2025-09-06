import { Injectable } from '@nestjs/common';
import { isEqual } from 'lodash';
import * as deepDiff from 'deep-diff';

import { StateComparator as StateComparatorInterface } from '../../domain/services/state-comparator.interface';
import { ComparisonResult } from '../../domain/aggregates/comparison-result.aggregate';
import { Discrepancy } from '../../domain/value-objects/discrepancy.value-object';

/**
 * A service that compares two states and returns the result of the comparison.
 */
@Injectable()
export class StateComparator implements StateComparatorInterface {
  /**
   * Compares an expected state with an actual state.
   * @param expected The expected state.
   * @param actual The actual state.
   * @returns A `ComparisonResult` object that represents the result of the comparison.
   */
  compare(expected: any, actual: any): ComparisonResult {
    if (isEqual(expected, actual)) {
      return ComparisonResult.createMatch(actual._id);
    }

    const differences = deepDiff.diff(expected, actual) || [];
    const discrepancies = differences.map((diff) =>
      Discrepancy.create(
        diff.path ? diff.path.join('.') : 'root',
        diff.lhs,
        diff.rhs,
      ),
    );

    return ComparisonResult.createMismatch(actual._id, discrepancies);
  }
}
