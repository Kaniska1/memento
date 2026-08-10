import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(60, "Name must contain at most 60 characters."),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must contain at least 3 characters.")
    .max(30, "Username must contain at most 30 characters.")
    .regex(
      /^[a-z0-9_]+$/,
      "Username may only contain lowercase letters, numbers, and underscores.",
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .max(128, "Password is too long.")
    .regex(
      /[a-zA-Z]/,
      "Password must contain at least one letter.",
    )
    .regex(
      /\d/,
      "Password must contain at least one number.",
    ),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address."),

  password: z
    .string()
    .min(1, "Enter your password.")
    .max(128, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;