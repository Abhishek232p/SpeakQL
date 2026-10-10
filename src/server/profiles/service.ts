import type { AuthenticatedIdentity } from "@/src/server/auth/types";
import { profileInputSchema, profileResponseSchema, type ProfileInput, type ProfileResponse } from "@/src/server/profiles/contract";
import type { ProfileRepository } from "@/src/server/profiles/repository";

export async function getProfile(repository: ProfileRepository, identity: AuthenticatedIdentity): Promise<ProfileResponse | null> {
  return repository.getProfile(identity);
}

export async function updateProfile(repository: ProfileRepository, identity: AuthenticatedIdentity, input: unknown): Promise<ProfileResponse> {
  const parsed = profileInputSchema.parse(input);
  return profileResponseSchema.parse(await repository.upsertProfile(identity, parsed as ProfileInput));
}
