import { Model } from 'mongoose';
import { AbstractEntity } from './abstract.entity';

/**
 * Abstract Repository for MongoDB operations
 * All repositories should extend this class
 */
export abstract class AbstractRepository<T extends AbstractEntity> {
  constructor(public model: Model<T>) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find().skip(skip).limit(limit).exec(),
      this.model.countDocuments().exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
