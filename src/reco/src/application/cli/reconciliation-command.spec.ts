import { Test } from '@nestjs/testing';
import { RecoCommand } from '../cli/reconciliation-command';
import { InquirerService } from 'nest-commander';
import { RecoRegistry } from '../../../src/application/services/reconciliation-registry.service';
import { CliReportGenerator } from '../../../src/application/services/cli-report-generator.service';
import { RecoServicePort } from '../../../src/application/ports/reconciliation-service.port';

describe('RecoCommand', () => {
  let command: RecoCommand;
  let mockInquirer: jest.Mocked<InquirerService>;
  let mockRegistry: jest.Mocked<RecoRegistry>;
  let mockGenerator: jest.Mocked<CliReportGenerator>;
  let mockService: jest.Mocked<Partial<RecoServicePort>>;

  beforeEach(async () => {
    mockInquirer = { ask: jest.fn() } as any;
    mockRegistry = { getService: jest.fn() } as any;
    mockGenerator = { generateReport: jest.fn() } as any;
    mockService = { getComparableFields: jest.fn() } as jest.Mocked<
      Partial<RecoServicePort>
    >;

    const module = await Test.createTestingModule({
      providers: [
        RecoCommand,
        { provide: InquirerService, useValue: mockInquirer },
        { provide: RecoRegistry, useValue: mockRegistry },
        { provide: CliReportGenerator, useValue: mockGenerator },
      ],
    }).compile();

    command = module.get<RecoCommand>(RecoCommand);
    mockRegistry.getService.mockReturnValue(mockService as RecoServicePort);
  });

  it('should run with provided options', async () => {
    const options = { action: 'check' as const, name: 'test' };
    await command.run([], options);

    expect(mockGenerator.generateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'check',
        name: 'test',
        recoService: mockService,
      }),
    );
  });

  it('should prompt for missing name and action', async () => {
    mockInquirer.ask
      .mockResolvedValueOnce({ name: 'test' })
      .mockResolvedValueOnce({ action: 'check' });

    await command.run([], {});
    expect(mockInquirer.ask).toHaveBeenCalledWith('name-question', undefined);
    expect(mockInquirer.ask).toHaveBeenCalledWith('action-question', undefined);
  });

  it('should error if no service found', async () => {
    mockRegistry.getService.mockReturnValue(undefined);
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const loggerErrorSpy = jest.spyOn(command.logger, 'error');

    await command.run([], { name: 'invalid', action: 'check' as const });
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('No reconciliation module found'),
    );

    consoleErrorSpy.mockRestore();
  });
});
