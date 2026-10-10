import { NextResponse } from "next/server";
import { getEnv } from "@/src/lib/env";
import {
  configurationFailureResponse,
  healthyResponse,
  healthResponseSchema,
} from "@/src/lib/health";
import { logError, logInfo } from "@/src/lib/server/logger";

export function GET(): NextResponse {
  try {
    getEnv();
    const response = healthResponseSchema.parse(healthyResponse);

    logInfo("health_check", { service: response.service, version: response.version });
    return NextResponse.json(response, { status: 200, headers: { "cache-control": "no-store" } });
  } catch (error) {
    logError("health.configuration_invalid", { issueCount: error instanceof Error ? 1 : 0 });
    return NextResponse.json(configurationFailureResponse, {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
}
