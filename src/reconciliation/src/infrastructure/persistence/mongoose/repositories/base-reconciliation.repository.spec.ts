import { BaseReconciliationRepository } from './base-reconciliation.repository';
import { Model, Document } from 'mongoose';

type MockModel = jest.Mocked<Model<Document>>;

const mockModel: MockModel = {
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
} as unknown as MockModel;

// Mock chainable for queries
const mockQuery = {
  lean: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

describe('BaseReconciliationRepository', () => {
  class TestRepository extends BaseReconciliationRepository<Document> {
    constructor(model: Model<Document>) {
      super(model);
    }
  }
  let repo: TestRepository;

  beforeEach(() => {
    repo = new TestRepository(mockModel as any); // Cast to avoid strict typing issues
    jest.clearAllMocks();
    // Setup returns for chaining
    mockModel.findById.mockReturnValue(mockQuery as any);
    mockModel.find.mockReturnValue(mockQuery as any);
    mockModel.findByIdAndUpdate.mockReturnValue(mockQuery as any);
  });

  describe('findById', () => {
    it('should find by ID excluding timestamps', async () => {
      mockQuery.exec.mockResolvedValue({ _id: '1', name: 'test' });
      const result = await repo.findById('1');
      expect(result).toEqual({ _id: '1', name: 'test' });
      expect(mockModel.findById).toHaveBeenCalledWith('1');
      expect(mockQuery.select).toHaveBeenCalledWith(
        '-createdAt -updatedAt -__v',
      );
      expect(mockQuery.exec).toHaveBeenCalled();
    });
  });

  describe('getAllIds', () => {
    it('should return all IDs', async () => {
      mockQuery.exec.mockResolvedValue([{ _id: '1' }, { _id: '2' }]);
      expect(await repo.getAllIds()).toEqual(['1', '2']);
      expect(mockModel.find).toHaveBeenCalledWith({}, '_id');
    });
  });

  describe('getIdsByDateRange', () => {
    it('should filter by date range', async () => {
      mockQuery.exec.mockResolvedValue([{ _id: '1' }]);
      const start = new Date(),
        end = new Date();
      await repo.getIdsByDateRange(start, end);
      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ updatedAt: expect.any(Object) }),
        '_id',
      );
      expect(mockQuery.exec).toHaveBeenCalled();
    });
  });

  describe('getIdsByFilter', () => {
    it('should filter by custom filters', async () => {
      mockQuery.exec.mockResolvedValue([{ _id: '1' }]);
      await repo.getIdsByFilter({ name: 'test' });
      expect(mockModel.find).toHaveBeenCalledWith({ name: 'test' }, '_id');
      expect(mockQuery.exec).toHaveBeenCalled();
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should update and return new document', async () => {
      mockQuery.exec.mockResolvedValue({ _id: '1', name: 'updated' }); // Use a property that might exist, or any
      const updateData = { name: 'updated' } as Partial<Document>; // Cast to Partial<Document>
      const result = await repo.findByIdAndUpdate('1', updateData);
      expect(result).toEqual({ _id: '1', name: 'updated' });
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { $set: updateData },
        { new: true },
      );
      expect(mockQuery.exec).toHaveBeenCalled();
    });
  });
});
