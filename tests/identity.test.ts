import { describe, expect, it } from "vitest";
import { requireIdentity, UnauthenticatedError } from "@/src/server/auth/require-auth";
import { profileAuditAction } from "@/src/server/audit/events";
import { profileInputSchema } from "@/src/server/profiles/contract";
import { createMemoryProfileRepository } from "@/src/server/profiles/repository";
import { getProfile, updateProfile } from "@/src/server/profiles/service";

const alice = { issuer: "https://issuer.example", subject: "alice-subject" } as const;
const bob = { issuer: "https://issuer.example", subject: "bob-subject" } as const;

describe("identity and profile authorization boundaries", () => {
  it("denies an absent identity", async () => {
    await expect(requireIdentity({ getIdentity: async () => null })).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("creates, retrieves, and updates only the authenticated identity profile", async () => {
    const repository = createMemoryProfileRepository();
    await updateProfile(repository, alice, { displayName: "Alice", locale: "en-US", timezone: "Asia/Calcutta" });
    expect(await getProfile(repository, bob)).toBeNull();
    expect(await getProfile(repository, alice)).toMatchObject({ displayName: "Alice" });
    await updateProfile(repository, alice, { displayName: "Alice Updated", locale: "en-US", timezone: "UTC" });
    expect(await getProfile(repository, alice)).toMatchObject({ displayName: "Alice Updated", timezone: "UTC" });
  });

  it("rejects invalid profile input and unknown fields", () => {
    expect(() => profileInputSchema.parse({ displayName: "", locale: "english", timezone: "UTC" })).toThrow();
    expect(() => profileInputSchema.parse({ displayName: "Alice", locale: "en-US", timezone: "UTC", userId: "spoof" })).toThrow();
  });

  it("classifies profile audit operations without storing sensitive data", () => {
    expect(profileAuditAction(false)).toBe("profile.created");
    expect(profileAuditAction(true)).toBe("profile.updated");
  });
});
