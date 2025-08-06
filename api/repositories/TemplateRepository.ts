import Template, { TemplateDocument } from "@/models/Template";
import { BaseRepository } from "./BaseRepository";
import { FilterQuery } from "mongoose";

export class TemplateRepositoryClass extends BaseRepository<TemplateDocument> {
  constructor() {
    super(Template);
  }

  // finds all template
  async findAllWithFilters(
    filters: FilterQuery<TemplateDocument> = {}
  ): Promise<{
    data: TemplateDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: FilterQuery<TemplateDocument> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.premium !== undefined) {
      query.premium = filters.premium;
    }
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    return await this.findWithPagination(query, filters.page, filters.limit);
  }

  async duplicateTemplate(
    templateId: string
  ): Promise<TemplateDocument | null> {
    const originalTemplate = await Template.findById(templateId).lean();
    if (!originalTemplate) {
      return null;
    }

    let duplicateTitle = `${originalTemplate.title} (Copy)`;
    let counter = 1;

    while (await Template.findOne({ title: duplicateTitle })) {
      counter++;
      duplicateTitle = `${originalTemplate.title} (Copy ${counter}) `;
    }

    const duplicateTemplate = new Template({
      title: duplicateTitle,
      description: originalTemplate.description,
      primaryColor: originalTemplate.primaryColor,
      secondaryColor: originalTemplate.secondaryColor,
      font: originalTemplate.font,
      thumbnail: originalTemplate.thumbnail,
      premium: originalTemplate.premium,
      tags: originalTemplate.tags,
      status: "inactive",
    });

    await duplicateTemplate.save();
    return duplicateTemplate;
  }
}

export const templateRepository = new TemplateRepositoryClass();
