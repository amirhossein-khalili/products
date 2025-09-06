import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Schema } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { RecoModule } from '../src/reconciliation.module';
import { ComparisonResult } from '../src/domain/aggregates/comparison-result.aggregate';
import { Discrepancy } from '../src/domain/value-objects/discrepancy.value-object';
import { NotFoundException } from '@nestjs/common';
import { RECO_SERVICE_PORT } from '../src/application/constants/tokens';
import { BaseAggregate, IMetadata } from 'com.chargoon.cloud.svc.common'; // Import with IMetadata if needed

// Mock Aggregate Root extending BaseAggregate with overrides
class MockAggregateRoot extends BaseAggregate {
  constructor(
    override readonly id: string,
    public name: string,
    public value: number,
  ) {
    super();
  }

  override apply(event: any): void {} // Stub with override

  override getVersionedMeta(): any {
    return {};
  } // Stub with override

  override makeSnapshot(): Partial<BaseAggregate> & {
    id: string;
    versionHistory: Record<number, IMetadata>;
  } {
    return { id: this.id, versionHistory: this.versionHistory }; // Match return type
  }

  override applySnapshot(snapshot: any): void {} // Stub with override

  override versionHistory: Record<number, IMetadata> = {}; // Override property
  // Add overrides for other required members if needed
}

// Mock RecoService
const mockRecoService = {
  checkSingleId: jest.fn(),
  reconcileById: jest.fn(),
  checkBatchIds: jest.fn(),
  reconcileBatchByIds: jest.fn(),
  checkAll: jest.fn(),
  reconcileAll: jest.fn(),
  getComparableFields: jest.fn().mockReturnValue(['name', 'value']),
};

describe('RecoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RecoModule.forFeature<MockAggregateRoot>({
          name: 'TestEntity',
          schema: new Schema({ name: String, value: Number }),
          path: 'test-entity',
          aggregateRoot: MockAggregateRoot,
          toComparableState: (agg: MockAggregateRoot) => ({
            name: agg.name,
            value: agg.value,
          }),
          aggregateName: 'TestAggregate',
          eventTransformers: {},
        }),
      ],
    })
      .overrideProvider(RECO_SERVICE_PORT)
      .useValue(mockRecoService)
      .overrideProvider(getModelToken('TestEntity'))
      .useValue({}) // Mock Mongoose model
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const entityId = '123';
  const comparableState = { name: 'Test', value: 100 };

  describe('GET /test-entity/reco/fields', () => {
    it('should return comparable fields', () => {
      return request(app.getHttpServer())
        .get('/test-entity/reco/fields')
        .expect(200)
        .expect(['name', 'value']);
    });
  });

  describe('POST /test-entity/reco', () => {
    it('should return 201 with match on identical states', async () => {
      const matchResult = {
        id: entityId,
        expectedState: comparableState,
        actualState: comparableState,
        comparison: ComparisonResult.createMatch(entityId),
      };
      mockRecoService.checkSingleId.mockResolvedValue(matchResult);
      await request(app.getHttpServer())
        .post('/test-entity/reco')
        .send({ id: entityId })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBe(entityId);
          expect(res.body.comparison.isMatch).toBe(true);
        });
    });

    it('should return 201 with mismatch and discrepancies', async () => {
      const discrepancies = [Discrepancy.create('value', 100, 200)];
      const mismatchResult = {
        id: entityId,
        expectedState: comparableState,
        actualState: { ...comparableState, value: 200 },
        comparison: ComparisonResult.createMismatch(entityId, discrepancies),
      };
      mockRecoService.checkSingleId.mockResolvedValue(mismatchResult);
      await request(app.getHttpServer())
        .post('/test-entity/reco')
        .send({ id: entityId })
        .expect(201)
        .expect((res) => {
          expect(res.body.comparison.isMatch).toBe(false);
          expect(res.body.comparison.discrepancies).toHaveLength(1);
        });
    });

    it('should return 404 on NotFoundException', async () => {
      mockRecoService.checkSingleId.mockRejectedValue(
        new NotFoundException('Aggregate not found.'),
      );
      await request(app.getHttpServer())
        .post('/test-entity/reco')
        .send({ id: entityId })
        .expect(404)
        .expect((res) =>
          expect(res.body.message).toContain('Aggregate not found.'),
        );
    });

    it('should return 400 on invalid input', async () => {
      await request(app.getHttpServer())
        .post('/test-entity/reco')
        .send({ id: 123 }) // Invalid type
        .expect(400);
    });
  });

  describe('POST /test-entity/reco/fix', () => {
    it('should return 201 with updated document', async () => {
      const updatedDoc = { _id: entityId, ...comparableState };
      mockRecoService.reconcileById.mockResolvedValue(updatedDoc);
      await request(app.getHttpServer())
        .post('/test-entity/reco/fix')
        .send({ id: entityId })
        .expect(201)
        .expect(updatedDoc);
    });

    it('should return 404 if not found', async () => {
      mockRecoService.reconcileById.mockRejectedValue(new NotFoundException());
      await request(app.getHttpServer())
        .post('/test-entity/reco/fix')
        .send({ id: entityId })
        .expect(404);
    });
  });

  describe('POST /test-entity/reco/batch', () => {
    it('should handle mixed results', async () => {
      const results = [
        { id: 'id1', comparison: ComparisonResult.createMatch('id1') },
        { id: 'id2', error: 'Not found' },
      ];
      mockRecoService.checkBatchIds.mockResolvedValue(results);
      await request(app.getHttpServer())
        .post('/test-entity/reco/batch')
        .send({ ids: ['id1', 'id2'] })
        .expect(201)
        .expect(results);
    });

    it('should return empty array on empty batch', async () => {
      mockRecoService.checkBatchIds.mockResolvedValue([]);
      await request(app.getHttpServer())
        .post('/test-entity/reco/batch')
        .send({ ids: [] })
        .expect(201)
        .expect([]);
    });
  });

  describe('POST /test-entity/reco/batch/fix', () => {
    it('should return fixed results', async () => {
      const results = [{ _id: 'id1' }, { id: 'id2', error: 'Failed' }];
      mockRecoService.reconcileBatchByIds.mockResolvedValue(results);
      await request(app.getHttpServer())
        .post('/test-entity/reco/batch/fix')
        .send({ ids: ['id1', 'id2'] })
        .expect(201)
        .expect(results);
    });
  });

  describe('POST /test-entity/reco/all', () => {
    it('should check all with filters', async () => {
      const results = [
        { id: 'id1', comparison: ComparisonResult.createMatch('id1') },
      ];
      mockRecoService.checkAll.mockResolvedValue(results);
      await request(app.getHttpServer())
        .post('/test-entity/reco/all')
        .send({ filters: { name: 'Test' } })
        .expect(201)
        .expect(results);
    });
  });

  describe('POST /test-entity/reco/all/fix', () => {
    it('should fix all', async () => {
      const results = [{ _id: 'id1' }];
      mockRecoService.reconcileAll.mockResolvedValue(results);
      await request(app.getHttpServer())
        .post('/test-entity/reco/all/fix')
        .send({})
        .expect(201)
        .expect(results);
    });
  });
});
