import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecoService } from '../services/reco.service';
import { AggregateReconstructor } from '../services/aggregate-reconstructor.service';
import { StateComparator } from '../services/state-comparator.service';
import { ReconciliationRepository } from '../../infrastructure';
import { ComparisonResult } from '../../domain/aggregates/comparison-result.aggregate';

// Mocks
const mockAggregateReconstructor = {
  reconstruct: jest.fn(),
};

const mockStateComparator = {
  compare: jest.fn(),
};

const mockReadRepository = {
  findById: jest.fn(),
};

const toComparableState = (aggregate: any) => ({
  name: aggregate.name,
  value: aggregate.value,
  nested: {
    prop: aggregate.nested.prop,
  },
});

describe('RecoService (as CheckEntityUseCase)', () => {
  let recoService: RecoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // Provide the service using a factory to explicitly manage its dependencies,
        // which resolves the dependency injection error.
        {
          provide: RecoService,
          useFactory: (aggReconstructor, comparator, readRepo, toComparable) =>
            new RecoService(
              aggReconstructor,
              comparator,
              readRepo,
              toComparable,
            ),
          inject: [
            AggregateReconstructor,
            StateComparator,
            ReconciliationRepository,
            'TO_COMPARABLE_STATE',
          ],
        },
        // Provide the mock implementations for the service's dependencies.
        {
          provide: AggregateReconstructor,
          useValue: mockAggregateReconstructor,
        },
        {
          provide: StateComparator,
          useValue: mockStateComparator,
        },
        {
          provide: ReconciliationRepository,
          useValue: mockReadRepository,
        },
        {
          provide: 'TO_COMPARABLE_STATE',
          useValue: toComparableState,
        },
      ],
    }).compile();

    recoService = module.get<RecoService>(RecoService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  const entityId = 'test-id-123';
  const mockAggregate = {
    id: entityId,
    name: 'Test Aggregate',
    value: 100,
    nested: { prop: 'A' },
    extra: 'field',
  };

  // Test Case 1: Happy Path (States Match)
  it('execute() should return a result with isMatch: true when states are identical', async () => {
    const comparableState = toComparableState(mockAggregate);
    mockAggregateReconstructor.reconstruct.mockResolvedValue(mockAggregate);
    mockReadRepository.findById.mockResolvedValue(comparableState);
    mockStateComparator.compare.mockReturnValue(
      ComparisonResult.createMatch(entityId),
    );

    const result = await recoService.checkSingleId(entityId);

    expect(mockAggregateReconstructor.reconstruct).toHaveBeenCalledWith(
      entityId,
    );
    expect(mockReadRepository.findById).toHaveBeenCalledWith(entityId);
    expect(mockStateComparator.compare).toHaveBeenCalledWith(
      comparableState,
      comparableState,
    );
    expect(result.comparison.isMatch).toBe(true);
    expect(result.id).toBe(entityId);
  });

  // Test Case 2: Mismatch
  it('execute() should return a result with isMatch: false when states differ', async () => {
    const expectedState = toComparableState(mockAggregate);
    const actualState = { ...expectedState, value: 200 };
    const mismatchResult = ComparisonResult.createMismatch(entityId, []); // discrepancies don't matter for this test

    mockAggregateReconstructor.reconstruct.mockResolvedValue(mockAggregate);
    mockReadRepository.findById.mockResolvedValue(actualState);
    mockStateComparator.compare.mockReturnValue(mismatchResult);

    const result = await recoService.checkSingleId(entityId);

    expect(mockStateComparator.compare).toHaveBeenCalledWith(
      expectedState,
      actualState,
    );
    expect(result.comparison.isMatch).toBe(false);
  });

  // Test Case 3: Error (Not Found)
  it('execute() should throw NotFoundException if the aggregate is not found', async () => {
    mockAggregateReconstructor.reconstruct.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(recoService.checkSingleId(entityId)).rejects.toThrow(
      NotFoundException,
    );
  });

  // Test Case 4: Fields filter
  it('execute() should correctly pick only specified fields for comparison', async () => {
    const fullExpectedState = toComparableState(mockAggregate);
    const fullActualState = {
      ...fullExpectedState,
      value: 999,
      nested: { prop: 'B' },
    };
    const fieldsToCompare = ['name'];
    const partialExpectedState = { name: 'Test Aggregate' };
    const partialActualState = { name: 'Test Aggregate' }; // value and nested are different, but not checked

    mockAggregateReconstructor.reconstruct.mockResolvedValue(mockAggregate);
    mockReadRepository.findById.mockResolvedValue(fullActualState);
    // We expect a match because only the 'name' field is compared
    mockStateComparator.compare.mockReturnValue(
      ComparisonResult.createMatch(entityId),
    );

    await recoService.checkSingleId(entityId, fieldsToCompare);

    expect(mockStateComparator.compare).toHaveBeenCalledWith(
      partialExpectedState,
      partialActualState,
    );
  });

   // Test Case 5: Check Not Found Read model
  it('execute() should return mismatch if entity not found in read model', async () => {
  mockAggregateReconstructor.reconstruct.mockResolvedValue(mockAggregate);
  mockReadRepository.findById.mockResolvedValue(null);
  const result = await recoService.checkSingleId(entityId);
  expect(result.comparison.isMatch).toBe(false);
  expect(result.comparison.discrepancies[0].field).toBe('_entity');
});
});
