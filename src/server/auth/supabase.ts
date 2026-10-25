import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/src/lib/env";
import type { AuthProvider } from "@/src/server/auth/types";

const READ_ONLY_COOKIE_ERROR = "Cookies can only be modified in a Server Action or Route Handler.";
const SAFE_AUTH_ERROR = "Unable to verify your session.";

export class SupabaseAuthVerificationError extends Error {
  public constructor() {
    super(SAFE_AUTH_ERROR);
    this.name = "SupabaseAuthVerificationError";
  }
}

function isReadOnlyCookieError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof Error && error.message.startsWith(READ_ONLY_COOKIE_ERROR)) return true;
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  return (
    name === "ReadonlyRequestCookiesError" ||
    message.startsWith(READ_ONLY_COOKIE_ERROR) ||
    message.includes(READ_ONLY_COOKIE_ERROR) ||
    message.includes("Cookies can only be modified in a Server Action or Route Handler") ||
    message.includes("ReadonlyRequestCookiesError") ||
    message.includes("cookies() cannot be modified")
  );
}

function isMissingSessionError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AuthSessionMissingError";
}

export function createSupabaseAuthProvider(): AuthProvider {
  return {
    async getIdentity() {
      let url: string | undefined;
      let key: string | undefined;
      try {
        ({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getEnv());
      } catch {
        throw new SupabaseAuthVerificationError();
      }

      if (!url || !key) return null;

      // Leave Next's request-time/dynamic-rendering control flow untouched.
      // Converting that framework signal into an auth failure would make a
      // valid dynamic page fail during a production build.
      const cookieStore = await cookies();

      try {
        const client = createServerClient(url, key, {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (items) => {
              try {
                items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
              } catch (error) {
                // Server Components can read cookies but cannot emit Set-Cookie.
                // The request proxy owns refresh persistence; only this known
                // Next.js phase error is safe to defer.
                if (!isReadOnlyCookieError(error)) throw error;
              }
            },
          },
        });

        const { data, error } = await client.auth.getUser();
        if (error) {
          if (isMissingSessionError(error)) return null;
          throw new SupabaseAuthVerificationError();
        }

        const user = data.user;
        return user?.id ? { issuer: url, subject: user.id } : null;
      } catch (error) {
        if (error instanceof SupabaseAuthVerificationError) throw error;
        throw new SupabaseAuthVerificationError();
      }
    },
  };
}
