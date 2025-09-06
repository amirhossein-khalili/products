import { Test } from '@nestjs/testing';
import { ReconciliationRegistrator } from '../../../src/application/services/reconciliation-registrator.service';
import { ReconciliationRegistry } from '../../../src/application/services/reconciliation-registry.service';
import { RECONCILIATION_SERVICE_PORT } from '../../../src/application/constants/tokens';
import { ReconciliationServicePort } from '../../../src/application/ports/reconciliation-service.port';
import { ReconciliationModuleOptions } from '../../../src/application/dtos/reconciliation-module-options.dto';

describe('RecoRegistrator', () => {
  let registrator: ReconciliationRegistrator;
  let mockRegistry: jest.Mocked<ReconciliationRegistry>;
  let mockService: jest.Mocked<ReconciliationServicePort>;
  const mockOptions: ReconciliationModuleOptions = {} as any;

  beforeEach(async () => {
    mockRegistry = { register: jest.fn() } as any;
    mockService = {} as jest.Mocked<ReconciliationServicePort>;

    const module = await Test.createTestingModule({
      providers: [
        ReconciliationRegistrator,
        { provide: ReconciliationRegistry, useValue: mockRegistry },
        { provide: RECONCILIATION_SERVICE_PORT, useValue: mockService },
        { provide: 'RECO_OPTIONS', useValue: mockOptions },
      ],
    }).compile();

    registrator = module.get<ReconciliationRegistrator>(
      ReconciliationRegistrator,
    );
  });

  it('should register on module init', () => {
    registrator.onModuleInit();
    expect(mockRegistry.register).toHaveBeenCalledWith(
      mockOptions,
      mockService,
    );
  });
});
