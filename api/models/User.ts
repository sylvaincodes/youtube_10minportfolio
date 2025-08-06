import { HydratedDocument, Model } from "mongoose";
import { models, model } from "mongoose";
import { InferSchemaType } from "mongoose";
import { Schema } from "mongoose";

// create schema
const UserSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid email!`,
      },
    },
    name: {
      type: String,
      required: false,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    role: {
      type: String,
      required: false,
      enum: ["admin", "user"],
      default: "user",
    },
    plan: {
      type: String,
      required: false,
      enum: ["free", "premium"],
      default: "free",
    },

    status: {
      type: String,
      required: false,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

//TypeScript interface for User
export type UserType = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserType>;
type UserModel = Model<UserDocument>;

//safe model export
const User =
  (models.User as UserModel) || model<UserType, UserModel>("User", UserSchema);
export default User;
