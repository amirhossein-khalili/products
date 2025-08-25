// test/reco.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Schema } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose'; // Import getModelToken
import { RecoModule, RECO_SERVICE_PORT_TOKEN } from '../src/reco.module';
import { WriteRepository } from '../src/domain';
import { ComparisonResult } from '../src/domain/aggregates/comparison-result.aggregate';
import { Discrepancy } from '../src/domain/value-objects/discrepancy.value-object';
import { NotFoundException } from '@nestjs/common';

// Mock Aggregate Root for testing purposes
class MockAggregateRoot {
  constructor(
    public id: string,
    public name: string,
    public value: number,
  ) {}
}

// Mock Write Repository
class MockWriteRepository implements WriteRepository<MockAggregateRoot> {
  findOneById = jest.fn();
}

// Mock RecoService
const mockRecoService = {
  checkSingleId: jest.fn(),
  reconcileById: jest.fn(),
  checkBatchIds: jest.fn(),
};

describe('RecoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        RecoModule.forFeature({
          name: 'TestEntity',
          schema: new Schema({ name: String, value: Number }),
          path: 'test-entity',
          aggregateRoot: MockAggregateRoot,
          writeRepository: MockWriteRepository,
          toComparableState: (agg: MockAggregateRoot) => ({
            name: agg.name,
            value: agg.value,
          }),
        }),
      ],
    })
      .overrideProvider(RECO_SERVICE_PORT_TOKEN)
      .useValue(mockRecoService)
      // ✅ FIX: Add an override for the Mongoose Model provider
      .overrideProvider(getModelToken('TestEntity'))
      .useValue({
        // Provide a mock object that satisfies the dependency injector.
        // It doesn't need any methods for this test since we mock the service layer.
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Add a check to prevent errors if app initialization fails
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const entityId = '123';
  const comparableState = { name: 'Test', value: 100 };

  describe('POST /test-entity/reco', () => {
    it('should return 201 with isMatch: true when states match', async () => {
      const matchResult = {
        id: entityId,
        expectedState: comparableState,
        actualState: comparableState,
        comparison: ComparisonResult.createMatch(entityId),
      };
      mockRecoService.checkSingleId.mockResolvedValue(matchResult);

      return request(app.getHttpServer())
        .post('/test-entity/reco')
        .send({ id: entityId })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBe(entityId);
          expect(res.body.comparison.isMatch).toBe(true);
        });
    });

    it('should return 201 with isMatch: false and discrepancies on mismatch', async () => {
      const discrepancies = [Discrepancy.create('value', 100, 200)];
      const mismatchResult = {
        id: entityId,
        expectedState: comparableState,
        actualState: { ...comparableState, value: 200 },
        comparison: ComparisonResult.createMismatch(entityId, discrepancies),
      };
      mockRecoService.checkSingleId.mockResolvedValue(mismatchResult);

      return request(app.getHttpServer())
        .post('/test-entity/reco')
        .send({ id: entityId })
        .expect(201)
        .expect((res) => {
          expect(res.body.comparison.isMatch).toBe(false);
          expect(res.body.comparison.discrepancies).toHaveLength(1);
        });
    });

    it('should return 404 if the service throws a NotFoundException', async () => {
      mockRecoService.checkSingleId.mockRejectedValue(
        new NotFoundException(`Aggregate not found.`),
      );

      return request(app.getHttpServer())
        .post('/test-entity/reco')
        .send({ id: entityId })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain(`Aggregate not found.`);
        });
    });
  });

  describe('POST /test-entity/reco/fix', () => {
    it('should return 201 with the updated document on a successful fix', async () => {
      const updatedDoc = { _id: entityId, ...comparableState };
      mockRecoService.reconcileById.mockResolvedValue(updatedDoc);

      return request(app.getHttpServer())
        .post('/test-entity/reco/fix')
        .send({ id: entityId })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual(updatedDoc);
        });
    });

    it('should return 404 if the entity to fix is not found', async () => {
      mockRecoService.reconcileById.mockRejectedValue(new NotFoundException());

      return request(app.getHttpServer())
        .post('/test-entity/reco/fix')
        .send({ id: entityId })
        .expect(404);
    });
  });

  describe('POST /test-entity/reco/batch', () => {
    it('should handle a mix of matching, mismatching, and not-found IDs', async () => {
      const results = [
        { id: 'id1', comparison: ComparisonResult.createMatch('id1') },
        { id: 'id2', error: 'Aggregate with id id2 not found.' },
        { id: 'id3', comparison: ComparisonResult.createMismatch('id3', []) },
      ];
      mockRecoService.checkBatchIds.mockResolvedValue(results);

      return request(app.getHttpServer())
        .post('/test-entity/reco/batch')
        .send({ ids: ['id1', 'id2', 'id3'] })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          expect(res.body[1].error).toBeDefined();
        });
    });
  });
});
