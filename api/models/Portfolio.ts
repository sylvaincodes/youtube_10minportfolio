import { generateSlug } from "@/lib/utils";
import mongoose, { HydratedDocument, InferSchemaType, Schema } from "mongoose";
import { model, models } from "mongoose";
import { Model } from "mongoose";

const PortfolioSettingsSchema = new Schema({
  isPublic: {
    type: Boolean,
    default: true,
  },
  allowComments: {
    type: Boolean,
    default: true,
  },
  ShowContactInfo: {
    type: Boolean,
    default: true,
  },
  customDomain: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: 60,
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: 100,
  },
});
const ProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  thumbnail: {
    type: String,
    required: false,
    default:
      "https://plus.unsplash.com/premium_photo-1681554601855-e04b390b5a4a",
  },
  technologies: [
    {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  ],
  demoUrl: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z]{2,})+\/?.*$/,
      "Please enter a valid URL.",
    ],
  },
  githubUrl: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z]{2,})+\/?.*$/,
      "Please enter a valid URL.",
    ],
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  completedDate: {
    type: Date,
  },
});

const ExperienceSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  company: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  achievements: [
    {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
  ],
  technologies: [
    {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
  ],
});
const CertificationsSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  provider: {
    type: String,
    required: true,
    trim: true,
  },
  issueDate: {
    type: Date,
    required: false,
  },
  expiryDate: {
    type: Date,
    required: false,
  },
  credentialId: {
    type: String,
    required: false,
  },
  credentialUrl: {
    type: String,
    required: false,
    trim: true,
    match: [
      /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z]{2,})+\/?.*$/,
      "Please enter a valid URL.",
    ],
  },
});
const SkillSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "frontend",
        "backend",
        "fullstack",
        "devops",
        "design",
        "other",
        "database",
      ],
    },
    proficiency: {
      type: String,
      required: true,
      enum: ["beginner", "intermediate", "advanced", "expert"],
    },
    level: {
      type: Number,
      required: false,
      enum: [1, 2, 3, 4, 5],
      default: 1,
    },
  },
  { _id: false }
);
const SocialMediaSchema = new Schema({
  platform: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
    match: [
      /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z]{2,})+\/?.*$/,
      "Please enter a valid URL.",
    ],
  },
});

const PortfolioProfileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
        "Please enter a valid email address.",
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      trim: true,
    },
    socialMedia: [SocialMediaSchema],
  },
  { _id: false }
);
// Create schema
const PortfolioSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },

    templateId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Template",
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase and can only contain letters, numbers, and hyphens.",
      ],
    },

    profile: {
      type: PortfolioProfileSchema,
      required: true,
    },

    skills: [SkillSchema],
    certifications: [CertificationsSchema],
    experiences: [ExperienceSchema],
    projects: [ProjectSchema],
    settings: {
      type: PortfolioSettingsSchema,
      required: true,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// add indexes:
PortfolioSchema.index({
  "profile.name": "text",
  "profile.title": "text",
  "profile.bio": "text",
});
PortfolioSchema.index({ createdAt: -1 });
PortfolioSchema.index({ updatedAt: -1 });
PortfolioSchema.index({ viewCount: -1 });

//add hook pre-save  to generate slug if not provided
PortfolioSchema.pre("save", function (next) {
  if (!this.slug && this.profile?.name) {
    this.slug = generateSlug(this.profile.name);
  }
  next();
});

// add hook to ensure slug uniqueness
PortfolioSchema.pre("save", async function (next) {
  if (this.isModified("slug")) {
    const existingPortfolio = await mongoose.models.Portfolio.findOne({
      slug: this.slug,
      _id: { $ne: this._id },
    });

    if (existingPortfolio) {
      let counter = 1;
      let newSlug = `${this.slug}-${counter}`;

      while (await mongoose.models.Portfolio.findOne({ slug: newSlug })) {
        counter++;
        newSlug = `${this.slug}-${counter}`;
      }

      this.slug = newSlug;
    }
  }

  next();
});

// Infer TypeScript types from the schema for full type safety
export type PortfolioType = InferSchemaType<typeof PortfolioSchema>;
export type PortfolioDocument = HydratedDocument<PortfolioType>;
type PortfolioModel = Model<PortfolioDocument>;

// SAFE EXPORT
const Portfolio =
  (models.Portfolio as PortfolioModel) ||
  model<PortfolioType, PortfolioDocument>("Portfolio", PortfolioSchema);

export default Portfolio;
