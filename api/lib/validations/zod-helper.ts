import z from "zod";

export const safeString = (fieldName: string, min = 1, max = 255) =>
  z
    .string()
    .trim()
    .min(min, `${fieldName} is required`)
    .max(max, `${fieldName} is too long`);

    export function sanitize(input: string): string {
        if(typeof input !== "string") return "";

        return input.replace(/<[^>]*>?/gm, "") // Remove all HTML tags
        .replace(/[<>]/g, "") // Remove angle brackets
        .replace(/&[a-z]+;/gi, "") //Remove encoded HTML entities
        .replace(/[\u0000-\u001F\u007F]/g, "") //Remove control characters
        .replace(/["'()]/g, "") //Remove quotes and parentheses
        .trim() // Trim whitespace
        .slice(0, 1000);
    }
