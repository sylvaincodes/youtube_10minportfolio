// create schema

import { models } from "mongoose";
import { model } from "mongoose";
import { HydratedDocument, InferSchemaType, Model, Schema } from "mongoose";

const ContactSchema = new Schema(
  {
    portfolio: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Portfolio",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Email must be a valid email address",
      },
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Subject cannot exceed 100 characters"],
      lowercase: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for performance
ContactSchema.index({ portfolio: 1, email: 1 }, { unique: true }); // avoid receiving same email for the same portfolio
ContactSchema.index({ status: 1, createdAt: -1 }); // optimize queries by status and creation date

// Pre-save hook: sanitize message input
ContactSchema.pre("save", function (next) {
  this.message = this.message.replace(/<[^>]*>/g, ""); // remove HTML tags
  next();
});

// Infer TypeScript types from the schema for full type safety
export type ContactType = InferSchemaType<typeof ContactSchema>;
export type ContactDocument = HydratedDocument<ContactType>;
type ContactModel = Model<ContactDocument>;


//Safe export
const Contact = (models.Contact as ContactModel) || model<ContactType,ContactModel>("Contact", ContactSchema)

export default Contact