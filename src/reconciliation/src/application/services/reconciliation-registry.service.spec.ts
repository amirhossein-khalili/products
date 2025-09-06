import { ReconciliationRegistry } from './reconciliation-registry.service';
import { ReconciliationModuleOptions } from '../dtos/reconciliation-module-options.dto';
import { ReconciliationServicePort } from '../ports/reconciliation-service.port';

describe('RecoRegistry', () => {
  let registry: ReconciliationRegistry;
  const mockOptions: ReconciliationModuleOptions = {
    name: 'test',
    schema: {} as any,
    path: '',
    toComparableState: () => ({}),
    aggregateRoot: class {},
    aggregateName: 'test',
    eventTransformers: {},
  };
  const mockService: ReconciliationServicePort = {} as any;

  beforeEach(() => {
    registry = new ReconciliationRegistry();
  });

  it('should register a module and service', () => {
    registry.register(mockOptions, mockService);
    expect(registry.getAll()).toEqual([mockOptions]);
    expect(registry.getService('test')).toBe(mockService);
  });

  it('should throw error if duplicate name registered', () => {
    registry.register(mockOptions, mockService);
    expect(() => registry.register(mockOptions, mockService)).toThrow(
      'Module with name test already registered',
    );
  });

  it('should register a module', () => {
    registry.register(mockOptions, mockService);
    expect(registry.getAll()).toEqual([mockOptions]);
    expect(registry.getService('test')).toBe(mockService);
  });

  it('should throw on duplicate registration', () => {
    registry.register(mockOptions, mockService);
    expect(() => registry.register(mockOptions, mockService)).toThrow(
      'Module with name test already registered',
    );
  });

  it('should return undefined for unknown service', () => {
    expect(registry.getService('unknown')).toBeUndefined();
  });
});
