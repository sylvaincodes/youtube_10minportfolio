// USER SCHEMA VALIDATION

import z from "zod";
import { safeString, sanitize } from "./zod-helper";

export const userSchema = z
  .object({
    email: z.string().email("Invalid email format").transform(sanitize),
    name: safeString("Name", 2, 50).transform(sanitize),
  })
  .strict();

export type UserUpdateInput = z.infer<typeof userSchema>;
