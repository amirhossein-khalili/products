import { Test } from '@nestjs/testing';
import { RecoRegistrator } from '../../../src/application/services/reconciliation-registrator.service';
import { RecoRegistry } from '../../../src/application/services/reconciliation-registry.service';
import { RECO_SERVICE_PORT } from '../../../src/application/constants/tokens';
import { RecoServicePort } from '../../../src/application/ports/reconciliation-service.port';
import { RecoModuleOptions } from '../../../src/application/dtos/reconciliation-module-options.dto';

describe('RecoRegistrator', () => {
  let registrator: RecoRegistrator;
  let mockRegistry: jest.Mocked<RecoRegistry>;
  let mockService: jest.Mocked<RecoServicePort>;
  const mockOptions: RecoModuleOptions = {} as any;

  beforeEach(async () => {
    mockRegistry = { register: jest.fn() } as any;
    mockService = {} as jest.Mocked<RecoServicePort>;

    const module = await Test.createTestingModule({
      providers: [
        RecoRegistrator,
        { provide: RecoRegistry, useValue: mockRegistry },
        { provide: RECO_SERVICE_PORT, useValue: mockService },
        { provide: 'RECO_OPTIONS', useValue: mockOptions },
      ],
    }).compile();

    registrator = module.get<RecoRegistrator>(RecoRegistrator);
  });

  it('should register on module init', () => {
    registrator.onModuleInit();
    expect(mockRegistry.register).toHaveBeenCalledWith(
      mockOptions,
      mockService,
    );
  });
});
