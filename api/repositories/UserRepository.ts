import User, { UserDocument } from "@/models/User";
import { BaseRepository } from "./BaseRepository";

export class UserRepositoryClass extends BaseRepository<UserDocument> {
  constructor() {
    super(User);
  }

  //find a user document by their clerk ID
  async findByClerkId(clerkId: string): Promise<UserDocument | null> {
    return this.findOne({ clerkId });
  }

  //update a user document by their clerkId
  async updateByClerkId(
    clerkId: string,
    data: Partial<UserDocument>
  ): Promise<UserDocument | null> {
    return User.findOneAndUpdate({ clerkId }, data, { newt: true }).exec();
  }

  async deleteByClerkId(clerkId: string): Promise<UserDocument | null> {
    return User.findOneAndDelete({ clerkId }).exec();
  }

  //find by email
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ email });
  }

  //Update by Id
  async updateById(
    id: string,
    data: Partial<UserDocument>
  ): Promise<UserDocument | null> {
    return this.update(id, data);
  }
}

export const userRepository = new UserRepositoryClass();
