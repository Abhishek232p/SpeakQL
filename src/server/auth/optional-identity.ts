import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import type { AuthenticatedIdentity } from "@/src/server/auth/types";

/**
 * Resolves the authenticated identity if present.
 * Fails open to null for public pages (landing, world, method, manifesto)
 * so that unauthenticated visitors or transient auth provider issues never
 * crash a public page into a 500 error.
 */
export async function getOptionalIdentity(): Promise<AuthenticatedIdentity | null> {
  try {
    const authProvider = createSupabaseAuthProvider();
    return await authProvider.getIdentity();
  } catch {
    return null;
  }
}
