import { Injectable } from '@nestjs/common';
import { Model, Document } from 'mongoose';

@Injectable()
export class RecoService<T extends Document> {
  constructor(
    // حذف @InjectModel چون مدل به صورت مستقیم از factory تزریق می‌شود
    private readonly entityModel: Model<T>,
  ) {}

  public async findAll(): Promise<T[]> {
    return this.entityModel.find().exec();
  }

  public async findById(id: string): Promise<T | null> {
    return this.entityModel.findById(id).exec();
  }
}
