import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/src/lib/env";

const SAFE_AUTH_ERROR = "Unable to verify your session.";

function isMissingSessionError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AuthSessionMissingError";
}

/**
 * Refreshes Supabase's cookie session before a Server Component renders.
 * Server Components cannot emit Set-Cookie headers themselves, so this must
 * run in Next's request proxy and return the response it builds.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  try {
    const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getEnv();
    if (!url || !key) return response;

    const client = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items, headers) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          if (headers && typeof headers === "object") {
            Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
          }
        },
      },
    });

    const { error } = await client.auth.getClaims();
    if (error && !isMissingSessionError(error)) throw new Error(SAFE_AUTH_ERROR);
    return response;
  } catch {
    throw new Error(SAFE_AUTH_ERROR);
  }
}
