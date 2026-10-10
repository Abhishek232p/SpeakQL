import { z } from "zod";

export const profileInputSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  locale: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).max(16).default("en-US"),
  timezone: z.string().trim().min(1).max(64).default("UTC"),
}).strict();

export const profileResponseSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  locale: z.string(),
  timezone: z.string(),
}).strict();

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
