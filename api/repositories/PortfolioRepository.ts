import Portfolio, { PortfolioDocument } from "@/models/Portfolio";
import { BaseRepository } from "./BaseRepository";
import {
  CreatePortfolioRequest,
  PortfolioFilters,
  PortfolioResponse,
  UpdatePortfolioRequest,
} from "@/types/portfolio";
import { FilterQuery } from "mongoose";
import Template from "@/models/Template";
import { generateSlug, validateSlug } from "@/lib/utils";

export class PortfolioRepositoryClass extends BaseRepository<PortfolioDocument> {
  constructor() {
    super(Portfolio);
  }

  // find portfolio by slug
  async findBySlug(slug: string): Promise<PortfolioDocument | null> {
    try {
      const portfolio = await Portfolio.findOne({
        slug,
      }).populate("templateId");
      return portfolio;
    } catch (error) {
      throw new Error(
        `Failed to find portfolio by slug : ${
          error instanceof Error ? error.message : "UNknown error"
        }`
      );
    }
  }

  // Find portfolio by user ID with filters
  async findByUserId(
    userId: string,
    filters: PortfolioFilters = {}
  ): Promise<PortfolioResponse> {
    try {
      const {
        status,
        templateId,
        search,
        sortBy = "updatedAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = filters;

      //   Build query
      const query: FilterQuery<PortfolioDocument> = { userId };

      if (status) {
        query.status = status;
      }

      if (templateId) {
        query.templateId = templateId;
      }

      if (search) {
        query.$or = [
          {
            "profile.name": { $regex: search, $options: "i" },
          },

          {
            "profile.title": { $regex: search, $options: "i" },
          },

          {
            "profile.bio": { $regex: search, $options: "i" },
          },

          {
            slug: { $regex: search, $options: "i" },
          },
        ];
      }

      // Get total count
      const total = await Portfolio.countDocuments(query);

      // build sort object
      const sort: Record<string, 1 | -1> = {};

      if (sortBy === "name") {
        sort["profile.name"] = sortOrder === "asc" ? 1 : -1;
      } else {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
      }

      //execute query with pagination
      const skip = (page - 1) * limit;
      const portfolios = await Portfolio.find(query)
        .populate({
          path: "templateId",
          model: Template,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit);

      return {
        portfolios,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(
        `Failed to find portfolios by user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Finds portfolios by user ID with filters
  async findAll(filters: PortfolioFilters = {}): Promise<PortfolioResponse> {
    try {
      const { page = 1, limit = 10 } = filters;

      //build query
      const query: FilterQuery<PortfolioDocument> = {
        status: "published",
        "settings.isPublic": true,
      };

      // Get total count
      const total = await Portfolio.countDocuments(query);

      //Build sort object
      const sort: Record<string, 1 | -1> = {};

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const portfolios = await Portfolio.find(query)
        .populate({
          path: "templateId",
          model: Template,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit);

      return {
        portfolios,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(
        `Failed to find portfolios by user : ${
          error instanceof Error ? error.message : "Unknow error"
        }`
      );
    }
  }

  //increment view count for a portfolio
  async incrementViewCount(id: string): Promise<PortfolioDocument | null> {
    try {
      const portfolio = await Portfolio.findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } },
        { new: true }
      ).populate("templateId", "name thumbnail category");

      return portfolio;
    } catch (error) {
      throw new Error(
        `Failed to increment view count: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    }
  }

  //Get a single portfolio by ID
  async getPortfolioById(
    id: string,
    userId: string
  ): Promise<PortfolioDocument | null> {
    try {
      const portfolio = await Portfolio.findOne({
        _id: id,
        userId,
      }).populate("templateId");

      return portfolio;
    } catch (error) {
      throw new Error(
        `Failed to get portfolio : ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  //Get all portfolios for a user with filtering and pagination
  async getPortfolios(
    userId: string,
    filters: PortfolioFilters = {}
  ): Promise<PortfolioResponse> {
    return this.findByUserId(userId, filters);
  }

  //Get public portfolio
  async getPublicPortfolios(
    filters: PortfolioFilters = {}
  ): Promise<PortfolioResponse> {
    return this.findAll(filters);
  }

  //Get a portfolio by slug (for public viewing )
  async getPortfolioBySlug(slug: string): Promise<PortfolioDocument | null> {
    try {
      const portfolio = await this.findBySlug(slug);

      if (portfolio) {
        //increment
        await this.incrementViewCount(portfolio._id.toString());
      }

      return portfolio;
    } catch (error) {
      throw new Error(
        `Failed to get portfolio by slug: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Check if a slug is already taken
  async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const query: FilterQuery<PortfolioDocument> = { slug };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const portfolio = await Portfolio.findOne(query);

      return !!portfolio;
    } catch (error) {
      throw new Error(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Generate unique slug for the portfolio
  async generateUniqueSlug(
    baseName: string,
    excludeId?: string
  ): Promise<string> {
    const baseSlug = generateSlug(baseName) as string;
    let slug = baseSlug;
    let counter = 1;

    while (await this.isSlugTaken(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Validate slug format and availability
  async validateSlugAvailability(
    slug: string,
    excludeId?: string
  ): Promise<{ isValid: boolean; message?: string }> {
    //Check format
    if (!validateSlug(slug)) {
      return {
        isValid: false,
        message:
          "This slug must contain only lowercase, letters, numbers and hyphens and be 3-50 character long",
      };
    }

    // Check availability
    const isTaken = await this.isSlugTaken(slug, excludeId);
    if (isTaken) {
      return {
        isValid: false,
        message: "This slug is already taken",
      };
    }

    return { isValid: true };
  }

  // Create a portfolio
  async createPortfolio(
    portfolioData: CreatePortfolioRequest
  ): Promise<PortfolioDocument> {
    try {
      //generate slug if not provided
      let slug = portfolioData.slug;

      if (!slug) {
        slug = await this.generateUniqueSlug(portfolioData.profile.name);
      }

      const validation = await this.validateSlugAvailability(slug);

      if (validation.isValid === false) {
        slug = await this.generateUniqueSlug(portfolioData.profile.name);
      }

      const portfolio = new Portfolio({
        userId: portfolioData.userId,
        name: portfolioData.name,
        slug,
        templateId: portfolioData.templateId,
        profile: portfolioData.profile,
        skills: portfolioData.skills,
        certifications: portfolioData.certifications,
        experiences: portfolioData.experiences,
        projects: portfolioData.projects,
        settings: portfolioData.settings,
        status: "draft",
        viewCount: 0,
      });

      const savedPortfolio = await portfolio.save();
      return savedPortfolio;
    } catch (error) {
      throw new Error(
        `Erro in creating portfolio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  //update portfolio
  async updatePortfolio(
    userId: string,
    portfolioData: UpdatePortfolioRequest
  ): Promise<PortfolioDocument | null> {
    try {
      const updateData: Partial<UpdatePortfolioRequest> = {};

      //handle slug update
      if (portfolioData.slug) {
        const validation = await this.validateSlugAvailability(
          portfolioData.slug,
          portfolioData.id
        );
        if (!validation.isValid) {
          throw new Error(validation.message);
        }
        updateData.slug = portfolioData.slug;
      }

      //map other fields
      if (portfolioData.templateId) {
        updateData.templateId = portfolioData.templateId;
      }
      if (portfolioData.profile) {
        updateData.profile = portfolioData.profile;
      }
      if (portfolioData.skills) {
        updateData.skills = portfolioData.skills;
      }
      if (portfolioData.certifications) {
        updateData.certifications = portfolioData.certifications;
      }
      if (portfolioData.experiences) {
        updateData.experiences = portfolioData.experiences;
      }
      if (portfolioData.projects) {
        updateData.projects = portfolioData.projects;
      }
      if (portfolioData.settings) {
        updateData.settings = portfolioData.settings;
      }
      if (portfolioData.status) {
        updateData.status = portfolioData.status;
      }

      const portfolio = await Portfolio.findOneAndUpdate(
        {
          _id: portfolioData.id,
          userId,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate("templateId");
      return portfolio;
    } catch (error) {
      throw new Error(
        `Failed to update portfolio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // duplicate a portfolio
  async duplicatePortfolio(
    userId: string,
    portfolioId: string
  ): Promise<PortfolioDocument> {
    try {
      const originalPortfolio = await this.getPortfolioById(
        portfolioId,
        userId
      );
      if (!originalPortfolio) {
        throw new Error("Portfolio not found");
      }

      //Genrate new slug
      const newSlug = await this.generateUniqueSlug(
        `${originalPortfolio.profile.name}-copy`
      );

      const cleanedSocialMedia = originalPortfolio.profile.socialMedia.map(
        (item) => ({
          platform: item.platform,
          url: item.url,
        })
      );

      const cleanedSkills = originalPortfolio.skills.map((skill) => ({
        name: skill.name,
        category: skill.category,
        proficiency:
          skill.proficiency === null || skill.proficiency === undefined
            ? "beginner"
            : skill.proficiency,
        level: skill.level ?? undefined,
      }));

      const certifications = originalPortfolio.certifications.map((cert) => ({
        name: cert.name,
        provider: cert.provider,
        issueDate: cert.issueDate ?? new Date(),
        expiryDate: cert.expiryDate ?? undefined,
        credentialId: cert.credentialId ?? undefined,
        credentialUrl: cert.credentialUrl ?? undefined,
      }));

      const experiences = originalPortfolio.experiences.map((exp) => ({
        title: exp.title,
        description: exp.description,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate ?? null,
        isCurrent: exp.isCurrent,
        location: exp.location ?? undefined,
        achivements: exp.achievements,
        technologies: exp.technologies,
      }));

      const projects = originalPortfolio.projects.map((project) => ({
        title: project.title,
        description: project.description,
        technologies: project.technologies,
        isFeatured: project.isFeatured,
        thumbnail: project.thumbnail ?? "",
        demoUrl: project.demoUrl ?? "",
        githubUrl: project.githubUrl ?? "",
        completedDate: project.completedDate ?? new Date(),
      }));

      const duplicateData = {
        userId: originalPortfolio.userId.toString(),
        templateId: originalPortfolio.templateId.toString(),
        name: originalPortfolio.name + " COPY",
        slug: newSlug,
        profile: {
          ...originalPortfolio.profile,
          socialMedia: cleanedSocialMedia,
          location: originalPortfolio.profile.location ?? undefined,
          phone: originalPortfolio.profile.phone ?? undefined,
          website: originalPortfolio.profile.website ?? undefined,
          profilePhoto: originalPortfolio.profile.profilePhoto ?? undefined,
        },
        skills: cleanedSkills,
        certifications,
        experiences,
        projects,
        settings: {
          ...originalPortfolio.settings,
          customDomain: originalPortfolio.settings.customDomain ?? undefined,
          showContactInfo:
            originalPortfolio.settings.ShowContactInfo ?? undefined,
          seoTitle: originalPortfolio.settings.seoTitle ?? undefined,
          seoDescription:
            originalPortfolio.settings.seoDescription ?? undefined,
        },
      };

      const data = await this.createPortfolio(duplicateData);
      return data;
    } catch (error) {
      throw new Error(
        `Failed to duplciate portfolio ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Delete a portfolio
  async deletePortfolio(userId: string, portfolioId: string): Promise<void> {
    try {
      const result = await Portfolio.findOneAndDelete({
        _id: portfolioId,
        userId,
      });

      if (!result) {
        throw new Error("Portfolio not found or access denied!");
      }
    } catch (error) {
      throw new Error(
        `Error in deleteing the portfolio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  //publish a portfolio
  async publishPortfolio(
    userId: string,
    portfolioId: string
  ): Promise<PortfolioDocument> {
    try {
      const portfolio = await Portfolio.findOneAndUpdate(
        {
          _id: portfolioId,
          userId,
        },
        { status: "published" },
        { new: true, runValidators: true }
      ).populate("templateId", "name thumbnail category");

      if (!portfolio) {
        throw new Error("Portfolio not found or access denied!");
      }

      return portfolio;
    } catch (error) {
      throw new Error(
        `Failed to publish portfolio:  ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  //Get portfolio URL
  getPorfolioUrl(slug: string): string {
    return `/portfolio/${slug}`;
  }

  // Get portfolio preview URL
  getPortfolioPreviewUrl(slug: string): string {
    return `/preview/${slug}`;
  }

  //  Get number published portfolio
  async countPublished(userId: string): Promise<number> {
    try {
      const count = await Portfolio.countDocuments({
        status: "published",
        userId,
      });

      return count;
    } catch (error) {
      throw new Error(
        `Failed to count published portfolio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// create an instance of PortfolioRepositoryClass
export const portfolioRepository = new PortfolioRepositoryClass();
