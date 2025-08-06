// create schema

import { InferSchemaType } from "mongoose";
import { HydratedDocument } from "mongoose";
import { model, Model } from "mongoose";
import { models, Schema } from "mongoose";

const TemplateSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      lowercase: true,
    },

    tags: {
      type: [String],
      required: [true, "At least one tag"],
      trim: true,
      validate: {
        validator: function (tags: string[]) {
          return tags.length > 0;
        },
        message: "At least one tag is required",
      },
    },

    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required "],
      validate: {
        validator: function (url: string) {
          return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/i.test(url);
        },
        message: "Thumbnail must be a valid image URL",
      },
    },
    font: {
      type: String,
      required: [true, "Font is required"],
      trim: true,
    },
    primaryColor: {
      type: String,
      required: [true, "Primary color is required"],
      validate: {
        validator: function (color: string) {
          return /^#[0-9A-F]{6}$/i.test(color);
        },
        message: "Primary color must be a valid hex color code",
      },
    },
    secondaryColor: {
      type: String,
      required: [true, "Secondary color is required"],
      validate: {
        validator: function (color: string) {
          return /^#[0-9A-F]{6}$/i.test(color);
        },
        message: "Secondary color must be a valid hex color code",
      },
    },
    premium: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes to improve performance on filter/search operations
TemplateSchema.index({ status: 1, createdAt: -1 }); //for sorting by status, and recency
TemplateSchema.index({ tags: 1 }); // for filtering/searching by tags
TemplateSchema.index({ title: "text", description: "text" }); // Full text search support

//Pre-save hok: normalize tags (lowercase and trimed)
TemplateSchema.pre("save", function (next) {
  if (this.tags) {
    this.tags = this.tags.map((tag: string) => tag.toLowerCase().trim());
  }
  next();
});

// Infer TypeScript types from the schema for full type safety
export type TemplateType = InferSchemaType<typeof TemplateSchema>;
export type TemplateDocument = HydratedDocument<TemplateType>;
type TemplateModel = Model<TemplateDocument>;

// Safe export

const Template =
  (models.Template as TemplateModel) ||
  model<TemplateDocument>("Template", TemplateSchema);

export default Template;
