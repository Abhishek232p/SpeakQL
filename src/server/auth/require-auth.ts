import type { AuthenticatedIdentity, AuthProvider } from "@/src/server/auth/types";

export class UnauthenticatedError extends Error {}

export async function requireIdentity(provider: AuthProvider): Promise<AuthenticatedIdentity> {
  const identity = await provider.getIdentity();
  if (!identity) throw new UnauthenticatedError("Authentication required.");
  return identity;
}
