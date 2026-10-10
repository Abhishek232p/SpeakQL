import { NextResponse } from "next/server";
import { UnauthenticatedError, requireIdentity } from "@/src/server/auth/require-auth";
import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import { getDb } from "@/src/server/db/client";
import { profileInputSchema } from "@/src/server/profiles/contract";
import { createPostgresProfileRepository } from "@/src/server/profiles/postgres-repository";
import { getProfile, updateProfile } from "@/src/server/profiles/service";

const noStoreHeaders = { "cache-control": "no-store" };

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}

function errorResponse(error: unknown) {
  return error instanceof UnauthenticatedError
    ? jsonResponse({ error: "unauthenticated" }, 401)
    : jsonResponse({ error: "internal_error" }, 500);
}

export async function GET() {
  try {
    const identity = await requireIdentity(createSupabaseAuthProvider());
    const repository = createPostgresProfileRepository(getDb());
    const profile = await getProfile(repository, identity);
    return profile ? jsonResponse(profile) : new NextResponse(null, { status: 404, headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const identity = await requireIdentity(createSupabaseAuthProvider());
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return jsonResponse({ error: "unsupported_media_type" }, 415);

    // Authentication uses cookies, so writes require an explicit same-origin
    // Origin. Do not derive a trusted origin from client-supplied proxy headers.
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    let input: unknown;
    try {
      input = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) return jsonResponse({ error: "invalid_json" }, 400);
      throw error;
    }

    const parsed = profileInputSchema.safeParse(input);
    if (!parsed.success) return jsonResponse({ error: "invalid_profile" }, 400);

    const repository = createPostgresProfileRepository(getDb());
    const profile = await updateProfile(repository, identity, parsed.data);
    return jsonResponse(profile);
  } catch (error) {
    return errorResponse(error);
  }
}
