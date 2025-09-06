import { Model } from 'mongoose';
import { ReconciliationRepository } from './reconciliation.repository';

describe('ReconciliationRepository', () => {
  let repo: ReconciliationRepository<any>;
  let mockModel: jest.Mocked<Model<any>>;

  beforeEach(() => {
    mockModel = {
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    } as any;
    repo = new ReconciliationRepository(mockModel);
  });

  it('should find by ID and select fields', async () => {
    const id = '1';
    const mockDoc = { _id: id, field: 'value' };
    (mockModel.findById as jest.Mock).mockReturnValue({
      lean: () => ({
        select: () => ({ exec: jest.fn().mockResolvedValue(mockDoc) }),
      }),
    });

    const result = await repo.findById(id);
    expect(result).toBe(mockDoc);
    expect(mockModel.findById).toHaveBeenCalledWith(id);
  });

  it('should get all IDs', async () => {
    const mockDocs = [{ _id: '1' }, { _id: '2' }];
    (mockModel.find as jest.Mock).mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue(mockDocs) }),
    });

    const ids = await repo.getAllIds();
    expect(ids).toEqual(['1', '2']);
  });
});
