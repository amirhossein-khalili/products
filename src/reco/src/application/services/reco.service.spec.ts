import { Test } from '@nestjs/testing';
import { RecoService } from './reco.service';
import { NotFoundException } from '@nestjs/common';
import { ComparisonResult } from '../../domain/aggregates/comparison-result.aggregate';
import { AggregateReconstructor } from './aggregate-reconstructor.service';
import { StateComparator } from './state-comparator.service';
import { TO_COMPARABLE_STATE } from '../constants/tokens';

const mockReconstructor = { reconstruct: jest.fn() };
const mockComparator = { compare: jest.fn() };
const mockRepository = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  getAllIds: jest.fn(),
  getIdsByFilter: jest.fn(),
};
const mockToComparable = jest.fn();

describe('RecoService', () => {
  let service: RecoService;

  beforeEach(async () => {
    const ReadRepositoryToken = 'ReadRepositoryToken';

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: RecoService,
          // Use a factory to manually create the RecoService instance
          useFactory: (reconstructor, comparator, repository, toComparable) =>
            new RecoService(
              reconstructor,
              comparator,
              repository,
              toComparable,
            ),
          // Specify the dependencies for the factory
          inject: [
            AggregateReconstructor,
            StateComparator,
            ReadRepositoryToken,
            TO_COMPARABLE_STATE,
          ],
        },
        // Provide the mock implementations for the service's dependencies
        {
          provide: AggregateReconstructor,
          useValue: mockReconstructor,
        },
        {
          provide: StateComparator,
          useValue: mockComparator,
        },
        {
          provide: ReadRepositoryToken, // Use the same custom token here
          useValue: mockRepository,
        },
        {
          provide: TO_COMPARABLE_STATE,
          useValue: mockToComparable,
        },
      ],
    }).compile();

    service = module.get<RecoService>(RecoService);
    jest.clearAllMocks();
  });

  const id = 'test-id';
  const aggregate = { id, field1: 'val1', field2: 'val2' };
  const comparable = { field1: 'val1', field2: 'val2' };

  describe('getComparableFields', () => {
    it('should return keys from mock state', () => {
      mockToComparable.mockReturnValue(comparable);
      expect(service.getComparableFields()).toEqual(['field1', 'field2']);
    });
  });

  describe('checkSingleId', () => {
    it('should return match result', async () => {
      mockReconstructor.reconstruct.mockResolvedValue(aggregate);
      mockToComparable.mockReturnValue(comparable);
      mockRepository.findById.mockResolvedValue(comparable);
      mockComparator.compare.mockReturnValue(ComparisonResult.createMatch(id));

      const result = await service.checkSingleId(id);
      expect(result.comparison.isMatch).toBe(true);
      expect(mockComparator.compare).toHaveBeenCalledWith(
        comparable,
        comparable,
      );
    });

    it('should handle partial fields', async () => {
      mockReconstructor.reconstruct.mockResolvedValue(aggregate);
      mockToComparable.mockReturnValue(comparable);
      mockRepository.findById.mockResolvedValue({
        field1: 'val1',
        field2: 'wrong',
      });
      mockComparator.compare.mockReturnValue(ComparisonResult.createMatch(id));

      await service.checkSingleId(id, ['field1']);
      expect(mockComparator.compare).toHaveBeenCalledWith(
        { field1: 'val1' },
        { field1: 'val1' },
      );
    });

    it('should return mismatch if entity not found', async () => {
      mockReconstructor.reconstruct.mockResolvedValue(aggregate);
      mockToComparable.mockReturnValue(comparable);
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.checkSingleId(id);
      expect(result.comparison.isMatch).toBe(false);
      expect(result.comparison.discrepancies[0].field).toBe('_entity');
    });

    it('should propagate NotFoundException', async () => {
      mockReconstructor.reconstruct.mockRejectedValue(new NotFoundException());
      await expect(service.checkSingleId(id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reconcileById', () => {
    it('should update with full state', async () => {
      mockReconstructor.reconstruct.mockResolvedValue(aggregate);
      mockToComparable.mockReturnValue(comparable);
      mockRepository.findByIdAndUpdate.mockResolvedValue(comparable);

      const result = await service.reconcileById(id);
      expect(result).toBe(comparable);
      expect(mockRepository.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        comparable,
      );
    });

    it('should update partial fields', async () => {
      mockReconstructor.reconstruct.mockResolvedValue(aggregate);
      mockToComparable.mockReturnValue(comparable);
      await service.reconcileById(id, ['field1']);
      expect(mockRepository.findByIdAndUpdate).toHaveBeenCalledWith(id, {
        field1: 'val1',
      });
    });
  });

  describe('checkBatchIds', () => {
    it('should handle mixed fulfilled/rejected promises', async () => {
      mockReconstructor.reconstruct
        .mockResolvedValueOnce(aggregate)
        .mockRejectedValueOnce(new Error('Failed'));
      mockToComparable.mockReturnValue(comparable);
      mockRepository.findById.mockResolvedValue(comparable);
      mockComparator.compare.mockReturnValue(ComparisonResult.createMatch(id));

      const results = await service.checkBatchIds(['id1', 'id2']);
      expect(results[0].comparison.isMatch).toBe(true);
      expect(results[1].error).toBe('Failed');
    });

    it('should return empty on empty input', async () => {
      expect(await service.checkBatchIds([])).toEqual([]);
    });
  });

  describe('reconcileBatchByIds', () => {
    it('should handle partial failures', async () => {
      mockReconstructor.reconstruct
        .mockResolvedValueOnce(aggregate)
        .mockRejectedValueOnce(new Error('Failed'));
      mockToComparable.mockReturnValue(comparable);
      mockRepository.findByIdAndUpdate.mockResolvedValue(comparable);

      const results = await service.reconcileBatchByIds(['id1', 'id2']);
      expect(results[0]).toBe(comparable);
      expect(results[1].error).toBe('Failed');
    });
  });

  describe('checkAll', () => {
    it('should check all IDs without filters', async () => {
      mockRepository.getAllIds.mockResolvedValue(['id1']);
      service.checkBatchIds = jest.fn().mockResolvedValue([{ id: 'id1' }]);
      const results = await service.checkAll();
      expect(results).toEqual([{ id: 'id1' }]);
      expect(service.checkBatchIds).toHaveBeenCalledWith(['id1'], undefined);
    });

    it('should use filters', async () => {
      mockRepository.getIdsByFilter.mockResolvedValue(['id1']);
      await service.checkAll({ name: 'test' });
      expect(mockRepository.getIdsByFilter).toHaveBeenCalledWith({
        name: 'test',
      });
    });
  });

  describe('reconcileAll', () => {
    it('should reconcile all', async () => {
      mockRepository.getAllIds.mockResolvedValue(['id1']);
      service.reconcileBatchByIds = jest
        .fn()
        .mockResolvedValue([{ id: 'id1' }]);
      await service.reconcileAll();
      expect(service.reconcileBatchByIds).toHaveBeenCalledWith(
        ['id1'],
        undefined,
      );
    });
  });
});
