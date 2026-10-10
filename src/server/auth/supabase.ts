import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/src/lib/env";
import type { AuthProvider } from "@/src/server/auth/types";

export function createSupabaseAuthProvider(): AuthProvider {
  return {
    async getIdentity() {
      const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = getEnv();
      if (!url || !key) return null;
      const cookieStore = await cookies();
      const client = createServerClient(url, key, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (items) => items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      });
      const { data: { user } } = await client.auth.getUser();
      return user ? { issuer: url, subject: user.id } : null;
    },
  };
}
