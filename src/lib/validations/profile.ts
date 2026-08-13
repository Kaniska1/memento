import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80),

  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(40)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores.",
    )
    .transform((value) =>
      value.toLowerCase(),
    ),

  bio: z
    .string()
    .trim()
    .max(300)
    .optional()
    .default(""),
});