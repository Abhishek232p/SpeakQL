import { NextResponse } from "next/server";
import { UnauthenticatedError, requireIdentity } from "@/src/server/auth/require-auth";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import { getDb } from "@/src/server/db/client";
import {
  createGoalsRepository,
  ExerciseAccessLockedError,
  ExerciseNotFoundError,
} from "@/src/server/goals/repository";

const noStoreHeaders = { "cache-control": "no-store" };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PRACTICE_RESPONSE_LENGTH = 10_000;

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await requireIdentity(createSupabaseAuthProvider());

    // Resolve params (supports Next.js 15+ Promise-based params or sync params)
    const resolvedParams = await Promise.resolve(context.params);
    const exerciseId = resolvedParams.id;

    if (!exerciseId || !UUID_REGEX.test(exerciseId)) {
      return jsonResponse({ error: "invalid_exercise_id" }, 400);
    }

    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    let responseText = "";

    if (contentType === "application/json") {
      try {
        const body = await request.json();
        if (typeof body?.response === "string") {
          responseText = body.response.trim();
        }
      } catch {
        return jsonResponse({ error: "invalid_json" }, 400);
      }
    } else if (contentType === "application/x-www-form-urlencoded" || contentType === "multipart/form-data") {
      try {
        const formData = await request.formData();
        const raw = formData.get("response");
        if (typeof raw === "string") {
          responseText = raw.trim();
        }
      } catch {
        return jsonResponse({ error: "invalid_form_data" }, 400);
      }
    } else {
      return jsonResponse({ error: "unsupported_media_type" }, 415);
    }

    if (!responseText || responseText.length > MAX_PRACTICE_RESPONSE_LENGTH) {
      return jsonResponse({ error: "invalid_response_payload" }, 400);
    }

    const db = getDb();
    const repository = createGoalsRepository(db);
    const evaluation = await repository.evaluateExercise(identity, exerciseId, responseText);

    return jsonResponse(evaluation, 200);
  } catch (error) {
    if (error instanceof ExerciseAccessLockedError) {
      return jsonResponse(
        {
          error: "exercise_access_locked",
          message: error.message,
        },
        403
      );
    }

    if (error instanceof ExerciseNotFoundError) {
      return jsonResponse(
        {
          error: "exercise_not_found",
          message: error.message,
        },
        404
      );
    }

    if (error instanceof UnauthenticatedError) {
      return jsonResponse({ error: "unauthenticated" }, 401);
    }

    return jsonResponse({ error: "internal_error" }, 500);
  }
}
