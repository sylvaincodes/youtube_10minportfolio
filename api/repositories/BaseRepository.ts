import {
  Document,
  FilterQuery,
  Model,
  QueryOptions,
  UpdateQuery,
} from "mongoose";

export abstract class BaseRepository<T extends Document> {
  //create a protected property
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  //create and saves a new document in the database
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  //finds a document by its MongoDB ObjectId
  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  //finds the first document matching the provided filter
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  //finds all documents matching the filter with optiona options
  async find(
    filter: FilterQuery<T> = {},
    options?: QueryOptions
  ): Promise<T[]> {
    return await this.model.find(filter, null, options).exec();
  }

  //Finds documents with pagination and sorting
  async findWithPagination(
    filter: FilterQuery<T> = {},
    page = 1,
    limit = 10,
    sort: FilterQuery<{ createdAt: string }> = { createdAt: -1 }
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  //update a document by its ID
  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  //update the first document matching the filter
  async updateOne(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<T | null> {
    return await this.model
      .findOneAndUpdate(filter, data, { new: true })
      .exec();
  }

  // Delete a document by its ID
  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  //delete multiple documents matching the filter
  async deleteMany(filter: FilterQuery<T>): Promise<{ deleteCount: number }> {
    const result = await this.model.deleteMany(filter).exec();
    return { deleteCount: result.deletedCount || 0 };
  }

  //counting the number of document matching the filter
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  //Check if a document exists matching the filter
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.findOne(filter).select("_id").exec();
    return !!doc;
  }
}
