import type { ProfileInput, ProfileResponse } from "@/src/server/profiles/contract";
import type { AuthenticatedIdentity } from "@/src/server/auth/types";

export type ProfileRepository = {
  getProfile(identity: AuthenticatedIdentity): Promise<ProfileResponse | null>;
  upsertProfile(identity: AuthenticatedIdentity, input: ProfileInput): Promise<ProfileResponse>;
};

export function createMemoryProfileRepository(): ProfileRepository {
  const profiles = new Map<string, ProfileResponse>();
  return {
    async getProfile(identity) { return profiles.get(`${identity.issuer}:${identity.subject}`) ?? null; },
    async upsertProfile(identity, input) {
      const key = `${identity.issuer}:${identity.subject}`;
      const existing = profiles.get(key);
      const profile = { userId: existing?.userId ?? crypto.randomUUID(), ...input };
      profiles.set(key, profile);
      return profile;
    },
  };
}
