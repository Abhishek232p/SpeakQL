import { z } from "zod";

export const HEALTH_SERVICE = "speakql" as const;
export const HEALTH_VERSION = "0.1.0" as const;

const healthSuccessResponseSchema = z
  .object({
    service: z.literal(HEALTH_SERVICE),
    status: z.literal("ok"),
    version: z.literal(HEALTH_VERSION),
  })
  .strict();

const healthFailureResponseSchema = z
  .object({
    error: z.literal("configuration_error"),
    service: z.literal(HEALTH_SERVICE),
    status: z.literal("error"),
    version: z.literal(HEALTH_VERSION),
  })
  .strict();

/** The stable response contract for both healthy and configuration-failure states. */
export const healthResponseSchema = z.discriminatedUnion("status", [
  healthSuccessResponseSchema,
  healthFailureResponseSchema,
]);

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type HealthyResponse = z.infer<typeof healthSuccessResponseSchema>;
export type HealthFailureResponse = z.infer<typeof healthFailureResponseSchema>;

export const healthyResponse: HealthyResponse = {
  service: HEALTH_SERVICE,
  status: "ok",
  version: HEALTH_VERSION,
};

export const configurationFailureResponse: HealthFailureResponse = {
  error: "configuration_error",
  service: HEALTH_SERVICE,
  status: "error",
  version: HEALTH_VERSION,
};
