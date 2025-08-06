import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .trim(); // Trim leading and trailing hyphens
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export const devLog = {
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") console.error(...args);
  },
};
