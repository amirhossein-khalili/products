import { Test, TestingModule } from '@nestjs/testing';
import { CliReportGenerator } from '../../../src/application/services/cli-report-generator.service';
import { Logger } from '@nestjs/common';
import { RECO_SERVICE_PORT } from '../../../src/application/constants/tokens';
import { ComparisonResult, Discrepancy } from '../../../src/domain';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { RecoServicePort } from '../../../src/application/ports/reconciliation-service.port';

jest.mock('fs');
jest.mock('xlsx');
jest.mock('path');

interface MockRecoService extends RecoServicePort {
  getComparableFields: jest.Mock;
  checkSingleId: jest.Mock;
  reconcileById: jest.Mock;
  checkBatchIds: jest.Mock;
  reconcileBatchByIds: jest.Mock;
  checkAll: jest.Mock;
  reconcileAll: jest.Mock;
}

describe('CliReportGenerator', () => {
  let service: CliReportGenerator;
  let mockRecoService: MockRecoService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRecoService = {
      getComparableFields: jest.fn(),
      checkSingleId: jest.fn(),
      reconcileById: jest.fn(),
      checkBatchIds: jest.fn(),
      reconcileBatchByIds: jest.fn(),
      checkAll: jest.fn(),
      reconcileAll: jest.fn(),
    } as MockRecoService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CliReportGenerator,
        {
          provide: RECO_SERVICE_PORT,
          useValue: mockRecoService,
        },
      ],
    }).compile();

    service = module.get<CliReportGenerator>(CliReportGenerator);

    // Spy on logger to avoid console output during tests
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateReport', () => {
    it('should handle check action with single ID', async () => {
      const comparisonResult = new ComparisonResult(
        'test-id',
        false,
        [Discrepancy.create('field', 'expected', 'actual')],
        'Mismatch detected',
      );

      const mockResult = {
        id: 'test-id',
        expectedState: { field: 'expected' },
        actualState: { field: 'actual' },
        comparison: comparisonResult,
      };

      mockRecoService.checkSingleId.mockResolvedValue(mockResult);

      await service.generateReport({
        recoService: mockRecoService,
        action: 'check',
        name: 'test-module',
        ids: ['test-id'],
      });

      expect(mockRecoService.checkSingleId).toHaveBeenCalledWith(
        'test-id',
        undefined,
      );
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle fix action with single ID', async () => {
      const mockResult = { id: 'test-id', status: 'fixed' };
      mockRecoService.reconcileById.mockResolvedValue(mockResult);

      await service.generateReport({
        recoService: mockRecoService,
        action: 'fix',
        name: 'test-module',
        ids: ['test-id'],
      });

      expect(mockRecoService.reconcileById).toHaveBeenCalledWith(
        'test-id',
        undefined,
      );
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle check action with multiple IDs', async () => {
      const comparisonResult1 = new ComparisonResult(
        'test-id-1',
        false,
        [Discrepancy.create('field', 'expected', 'actual')],
        'Mismatch detected',
      );

      const comparisonResult2 = new ComparisonResult(
        'test-id-2',
        true,
        [],
        'States match',
      );

      const mockResults = [
        {
          id: 'test-id-1',
          expectedState: { field: 'expected' },
          actualState: { field: 'actual' },
          comparison: comparisonResult1,
        },
        {
          id: 'test-id-2',
          expectedState: { field: 'expected' },
          actualState: { field: 'expected' },
          comparison: comparisonResult2,
        },
      ];

      mockRecoService.checkBatchIds.mockResolvedValue(mockResults);

      await service.generateReport({
        recoService: mockRecoService,
        action: 'check',
        name: 'test-module',
        ids: ['test-id-1', 'test-id-2'],
      });

      expect(mockRecoService.checkBatchIds).toHaveBeenCalledWith(
        ['test-id-1', 'test-id-2'],
        undefined,
      );
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle errors from RecoService', async () => {
      const error = new Error('Fetch error');
      mockRecoService.checkSingleId.mockRejectedValue(error);

      await service.generateReport({
        recoService: mockRecoService,
        action: 'check',
        name: 'test-module',
        ids: ['test-id'],
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'An error occurred while fetching data from RecoService: Fetch error',
        ),
        expect.any(String),
      );
    });

    it('should handle empty results', async () => {
      mockRecoService.checkAll.mockResolvedValue([]);

      await service.generateReport({
        recoService: mockRecoService,
        action: 'check',
        name: 'test-module',
      });

      expect(mockRecoService.checkAll).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });

  describe('flattenResults', () => {
    it('should flatten check results with matches', () => {
      const comparisonResult = new ComparisonResult(
        'test-id',
        true,
        [],
        'States match',
      );

      const results = [
        {
          id: 'test-id',
          expectedState: { field: 'value' },
          actualState: { field: 'value' },
          comparison: comparisonResult,
        },
      ];

      const flattened = (service as any).flattenResults(results, 'check');

      expect(flattened).toEqual([
        {
          ID: 'test-id',
          'Is Match': 'Yes',
          'Discrepancy Field': '',
          'Expected Value': '',
          'Actual Value': '',
          Details: 'States match',
        },
      ]);
    });

    it('should flatten check results with discrepancies', () => {
      const comparisonResult = new ComparisonResult(
        'test-id',
        false,
        [Discrepancy.create('field', 'expected', 'actual')],
        'Mismatch detected in 1 fields',
      );

      const results = [
        {
          id: 'test-id',
          expectedState: { field: 'expected' },
          actualState: { field: 'actual' },
          comparison: comparisonResult,
        },
      ];

      const flattened = (service as any).flattenResults(results, 'check');

      expect(flattened).toEqual([
        {
          ID: 'test-id',
          'Is Match': 'No',
          'Discrepancy Field': 'field',
          'Expected Value': JSON.stringify('expected'),
          'Actual Value': JSON.stringify('actual'),
          Details: 'Mismatch detected in 1 fields',
        },
      ]);
    });

    it('should flatten fix results', () => {
      const results = [
        { _id: 'test-id', status: 'fixed' },
        { _id: 'test-id-2', error: 'Failed to fix' },
      ];

      const flattened = (service as any).flattenResults(results, 'fix');

      expect(flattened).toEqual([
        {
          ID: 'test-id',
          Status: 'Reconciled',
          Details: 'Successfully updated document.',
        },
        {
          ID: 'test-id-2',
          Status: 'Error',
          Details: 'Failed to fix',
        },
      ]);
    });

    it('should flatten check results with errors', () => {
      const results = [
        {
          id: 'test-id',
          error: 'Not found',
        },
      ];

      const flattened = (service as any).flattenResults(results, 'check');

      expect(flattened).toEqual([
        {
          ID: 'test-id',
          'Is Match': 'Error',
          'Discrepancy Field': 'N/A',
          'Expected Value': 'N/A',
          'Actual Value': 'N/A',
          Details: 'Not found',
        },
      ]);
    });
  });
});
