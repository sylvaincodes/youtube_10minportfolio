// PORTFOLIO SCHEMA

import z from "zod";
import { safeString, sanitize } from "./zod-helper";

export const ProfileStatusEnum = z.enum(["draft", "published", "archived"]);

export const SocialMediaSchema = z.object({
  platform: safeString("Plateform", 1, 100).transform(sanitize),
  url: z.string().trim().url("Social media invalid url format"),
});
export const PortfolioProfileSchema = z.object({
  name: safeString("Name", 1, 100).transform(sanitize),
  title: safeString("Title", 1, 200).transform(sanitize),
  bio: safeString("Bio", 1, 500).transform(sanitize),
  location: safeString("Location", 1, 100)
    .optional()
    .transform((val) => (val ? sanitize(val) : val)),
  email: z.string().email("Invalid email address"),
  phone: z.string().trim().optional(),
  website: z
    .string()
    .trim()
    .url()
    .max(100, "Website must be less than 100 characters")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? "" : sanitize(val ?? ""))),
  profilePhoto: z
    .string()
    .trim()
    .optional()
    .refine((val) => val === undefined || val.length > 0, {
      message: "Profile phot cannot be an empty string",
    }),

  socialMedia: z.array(SocialMediaSchema).max(5, "Too many social media"),
  status: ProfileStatusEnum.default("draft"),
});

export const SkillCategoryEnum = z.enum([
  "frontend",
  "backend",
  "fullstack",
  "devops",
  "design",
  "other",
  "database",
]);

export const ProficiencyEnum = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);
export const SkillSchema = z.object({
  name: safeString("Name", 1, 100).transform(sanitize),
  category: SkillCategoryEnum,
  proficiency: ProficiencyEnum,
});

export const CertficationSchema = z.object({
  name: safeString("Certification", 1, 100).transform(sanitize),
  provider: safeString("Provider", 1, 100).transform(sanitize),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  credentialId: safeString("CredentialId", 1, 100).optional(),
  credentialUrl: z.string().url("Invalid url").optional(),
});

export const ExperienceSchema = z.object({
  title: safeString("Title", 1, 100).transform(sanitize),
  company: safeString("Company", 1, 100).transform(sanitize),
  location: safeString("Location", 1, 100).transform(sanitize),
  startDate: z.coerce
    .date()
    .refine((val) => val === null || val instanceof Date, {
      message: "Start date must be a valid date",
    }),
  endDate: z
    .union([z.coerce.date(), z.literal(null)])
    .refine((val) => val === null || val instanceof Date, {
      message: "End date must be a valid date or null ",
    }),
  isCurrent: z.boolean().default(false),
  description: safeString("Description", 1, 1000).transform(sanitize),
  achivements: z.array(safeString("Achievement", 1, 100).transform(sanitize)),
  technologies: z.array(safeString("Technologies", 1, 100).transform(sanitize)),
});

export const ProjectSchema = z.object({
  title: safeString("Title", 1, 100).transform(sanitize),
  description: safeString("Description", 1, 1000).transform(sanitize),
  thumbnail: safeString("Thumbnail", 1, 100).transform(sanitize),
  technologies: z.array(safeString("Technologies", 1, 100).transform(sanitize)),
  demoUrl: z.string().trim().url("Demo must be a valid url"),
  githubUrl: z.string().trim().url("Github url is not a valid url"),
  isFeatured: z.boolean().default(false),
  completedDate: z.coerce.date().optional(),
});

export const PortfolioSettingsSchema = z.object({
  isPublic: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  showContactInfo: z.boolean().default(true),
  customDomain: safeString("CustomDomain", 0, 100).transform(sanitize),
  seoTitle: safeString("SeoTitle", 0, 100).transform(sanitize),
  seoDescription: safeString("SeoDescription", 0, 500).transform(sanitize),
});

export const PortfolioStatusEnum = z.enum(["draft", "published", "archived"]);
export const createPortfolioSchema = z
  .object({
    userId: z.string().min(1, "User id is required"),
    name: safeString("Name", 2, 100).transform(sanitize),
    templateId: z.string().min(1, "TemplateId is required"),
    slug: safeString("Slug", 1, 100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must contain only lowercase letters, numbers and hyphens",
    }),

    profile: PortfolioProfileSchema,
    skills: z.array(SkillSchema).default([]),
    certifications: z.array(CertficationSchema).default([]),
    experiences: z.array(ExperienceSchema).default([]),
    projects: z.array(ProjectSchema).default([]),
    settings: PortfolioSettingsSchema.default({
      isPublic: true,
      allowComments: true,
      showContactInfo: true,
      customDomain: "",
      seoTitle: "",
      seoDescription: "",
    }),
    status: PortfolioStatusEnum.default("draft"),
    viewCount: z.number().int().min(0).default(0),
  })
  .strict();

export const updatePortfolioSchema = createPortfolioSchema.partial().extend({
  id: safeString("Id", 1, 100),
  status: PortfolioStatusEnum.optional(),
});

export const slugSchema = safeString("Slug", 3, 50).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Slug must contain letters numbers and hyphens only"
);

export type PortfolioInput = z.infer<typeof createPortfolioSchema>;
export type PortfolioUpdate = z.infer<typeof updatePortfolioSchema>;
