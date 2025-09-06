// Fixed: test/application/services/reco-registrator.service.spec.ts
import { Test } from '@nestjs/testing';
import { RecoRegistrator } from '../../../src/application/services/reco-registrator.service';
import { RecoRegistry } from '../../../src/application/services/reco-registry.service';
import { RECO_SERVICE_PORT } from '../../../src/application/constants/tokens';
import { RecoServicePort } from '../../../src/application/ports/reco-service.port';
import { RecoModuleOptions } from '../../../src/application/dtos/reco-module-options.dto';

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
