import { Injectable } from '@nestjs/common';
import { isEqual } from 'lodash';
import * as deepDiff from 'deep-diff';
import { ComparisonResult, Discrepancy } from '../dtos';

/**
 * Service for comparing two states with detailed discrepancy detection.
 * Uses deep-diff for field-level differences.
 */
@Injectable()
export class StateComparator {
  compare(expected: any, actual: any): ComparisonResult {
    if (isEqual(expected, actual)) {
      return new ComparisonResult(actual._id, true);
    }

    const differences = deepDiff.diff(expected, actual) || [];
    const discrepancies = differences.map((diff) => {
      const field = diff.path ? diff.path.join('.') : 'root';
      return new Discrepancy(field, diff.lhs, diff.rhs);
    });

    return new ComparisonResult(
      actual._id,
      false,
      discrepancies,
      'Mismatch detected in fields.',
    );
  }
}
