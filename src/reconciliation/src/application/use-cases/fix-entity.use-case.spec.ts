import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReconciliationService } from '../services/reconciliation.service';
import { AggregateReconstructor } from '../services/aggregate-reconstructor.service';
import { StateComparator } from '../services/state-comparator.service';
import { ReconciliationRepository } from '../../infrastructure';

// Mocks
const mockAggregateReconstructor = {
  reconstruct: jest.fn(),
};

const mockReadRepository = {
  findByIdAndUpdate: jest.fn(),
};

const toComparableState = (aggregate: any) => ({
  name: aggregate.name,
  value: aggregate.value,
  nested: {
    prop: aggregate.nested.prop,
  },
});

describe('RecoService (as FixEntityUseCase)', () => {
  let recoService: ReconciliationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // Provide the service using a factory to explicitly manage its dependencies.
        {
          provide: ReconciliationService,
          useFactory: (aggReconstructor, comparator, readRepo, toComparable) =>
            new ReconciliationService(
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
          useValue: {}, // Not used in the fix flow, but required by constructor
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

    recoService = module.get<ReconciliationService>(ReconciliationService);
    jest.clearAllMocks();
  });

  const entityId = 'test-id-456';
  const mockAggregate = {
    id: entityId,
    name: 'Fix Aggregate',
    value: 500,
    nested: { prop: 'C' },
    extra: 'field',
  };
  const expectedState = toComparableState(mockAggregate);

  // Test Case 1: Happy Path (Full Fix)
  it('execute() should call readModelRepo.updateState with the full expected state', async () => {
    mockAggregateReconstructor.reconstruct.mockResolvedValue(mockAggregate);
    mockReadRepository.findByIdAndUpdate.mockResolvedValue({
      ...expectedState,
      _id: entityId,
    });

    await recoService.reconcileById(entityId);

    expect(mockAggregateReconstructor.reconstruct).toHaveBeenCalledWith(
      entityId,
    );
    expect(mockReadRepository.findByIdAndUpdate).toHaveBeenCalledWith(
      entityId,
      expectedState,
    );
  });

  // Test Case 2: Partial Fix
  it('execute() should call readModelRepo.updateState with only the specified fields', async () => {
    // The current implementation only picks top-level keys.
    const fieldsToFixActual = ['name', 'nested'];
    const partialState = {
      name: mockAggregate.name,
      nested: mockAggregate.nested,
    };

    mockAggregateReconstructor.reconstruct.mockResolvedValue(mockAggregate);
    mockReadRepository.findByIdAndUpdate.mockResolvedValue({ ...partialState });

    await recoService.reconcileById(entityId, fieldsToFixActual);

    expect(mockReadRepository.findByIdAndUpdate).toHaveBeenCalledWith(
      entityId,
      partialState,
    );
  });

  // Test Case 3: Error (Not Found)
  it('execute() should throw a NotFoundException if the aggregate cannot be reconstructed', async () => {
    mockAggregateReconstructor.reconstruct.mockRejectedValue(
      new NotFoundException('Aggregate not found'),
    );

    await expect(recoService.reconcileById(entityId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockReadRepository.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
