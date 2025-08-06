import Contact, { ContactDocument } from "@/models/Contact";
import { BaseRepository } from "./BaseRepository";

// create repository
export class ContactRepositoryClass extends BaseRepository<ContactDocument> {
  constructor() {
    super(Contact);
  }

  // Check if a contact message already exists for the given portfolio and the email sent
  async existsForPortfolioEmail(
    portfolioId: string,
    email: string
  ): Promise<boolean> {
    const existing = await Contact.findOne({
      portfolio: portfolioId,
      email,
    });

    return !!existing;
  }

  //save a new contact message to the database
  async saveContactMessage(data: {
    portfolio: string;
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<ContactDocument> {
    const contact = new Contact({
      portfolio: data.portfolio,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });
    return await contact.save();
  }
}

export const contactRepository = new ContactRepositoryClass();
