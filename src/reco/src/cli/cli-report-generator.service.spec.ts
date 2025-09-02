// src/cli/cli-report-generator.service.spec.ts
import { Test } from '@nestjs/testing';
import { CliReportGenerator } from './cli-report-generator.service';
import { Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('xlsx');
jest.mock('fs');
jest.mock('path');

describe('CliReportGenerator', () => {
  let generator: CliReportGenerator;
  const mockService = {
    getComparableFields: jest.fn(), // Added to satisfy RecoServicePort interface
    checkSingleId: jest.fn(),
    reconcileById: jest.fn(),
    checkBatchIds: jest.fn(),
    reconcileBatchByIds: jest.fn(),
    checkAll: jest.fn(),
    reconcileAll: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CliReportGenerator, Logger],
    }).compile();
    generator = module.get<CliReportGenerator>(CliReportGenerator);
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate check report for single ID', async () => {
      const options = {
        recoService: mockService,
        action: 'check' as const,
        name: 'test',
        ids: ['1'],
      };
      const result = {
        id: '1',
        comparison: { isMatch: true, discrepancies: [] },
      };
      mockService.checkSingleId.mockResolvedValue(result);

      await generator.generateReport(options);
      expect(mockService.checkSingleId).toHaveBeenCalledWith('1', undefined);
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should handle fix action for all', async () => {
      const options = {
        recoService: mockService,
        action: 'fix' as const,
        name: 'test',
      };
      mockService.reconcileAll.mockResolvedValue([{ _id: '1' }]);
      await generator.generateReport(options);
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        {
          ID: '1',
          Status: 'Reconciled',
          Details: 'Successfully updated document.',
        },
      ]);
    });

    it('should log warning on empty results', async () => {
      const spy = jest.spyOn(Logger.prototype, 'warn');
      mockService.checkAll.mockResolvedValue([]);
      await generator.generateReport({
        recoService: mockService,
        action: 'check' as const,
        name: 'test',
      });
      expect(spy).toHaveBeenCalledWith(
        'No results were returned from the service. The report will be empty.',
      );
    });

    it('should handle errors during fetch', async () => {
      const spy = jest.spyOn(Logger.prototype, 'error');
      // You are intentionally making the mock service throw an error here
      mockService.checkAll.mockRejectedValue(new Error('Fetch error'));

      await generator.generateReport({
        recoService: mockService,
        action: 'check' as const,
        name: 'test',
      });

      // The test then checks if the logger's error method was called
      expect(spy).toHaveBeenCalled();
      expect(XLSX.writeFile).not.toHaveBeenCalled();
    });
  });
});
