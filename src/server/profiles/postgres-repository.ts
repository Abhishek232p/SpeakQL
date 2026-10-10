import { eq, and, sql } from "drizzle-orm";
import type { AuthenticatedIdentity } from "@/src/server/auth/types";
import { profileAuditAction } from "@/src/server/audit/events";
import { withIdentityTransaction } from "@/src/server/db/client";
import { auditEvents, userProfiles, users } from "@/src/server/db/schema";
import type { ProfileInput, ProfileResponse } from "@/src/server/profiles/contract";
import type { ProfileRepository } from "@/src/server/profiles/repository";

type Database = ReturnType<typeof import("@/src/server/db/client").getDb>;

function toResponse(row: { userId: string; displayName: string; locale: string; timezone: string }): ProfileResponse {
  return { userId: row.userId, displayName: row.displayName, locale: row.locale, timezone: row.timezone };
}

export function createPostgresProfileRepository(db: Database): ProfileRepository {
  return {
    async getProfile(identity) {
      return withIdentityTransaction(db, identity, async (tx) => {
        const rows = await tx.select({ userId: users.id, displayName: userProfiles.displayName, locale: userProfiles.locale, timezone: userProfiles.timezone })
          .from(users).innerJoin(userProfiles, eq(userProfiles.userId, users.id))
          .where(and(eq(users.authIssuer, identity.issuer), eq(users.authSubject, identity.subject))).limit(1);
        return rows[0] ? toResponse(rows[0]) : null;
      });
    },
    async upsertProfile(identity: AuthenticatedIdentity, input: ProfileInput) {
      return withIdentityTransaction(db, identity, async (tx) => {
        // Lock before either the identity insert or existence read. READ COMMITTED
        // gives the waiter a fresh snapshot after the prior transaction commits.
        // Hash collisions only serialize unrelated identities; JSON avoids ambiguous keys.
        const lockKey = JSON.stringify(["speakql.profile", identity.issuer, identity.subject]);
        await tx.execute(sql`select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(${lockKey}, 0))`);
        await tx.insert(users).values({ authIssuer: identity.issuer, authSubject: identity.subject }).onConflictDoNothing({ target: [users.authIssuer, users.authSubject] });
        const identityRow = await tx.select({ id: users.id }).from(users).where(and(eq(users.authIssuer, identity.issuer), eq(users.authSubject, identity.subject))).limit(1);
        const user = identityRow[0];
        if (!user) throw new Error("Identity mapping could not be created.");
        const existingProfile = await tx.select({ userId: userProfiles.userId }).from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
        await tx.insert(userProfiles).values({ userId: user.id, ...input }).onConflictDoUpdate({ target: userProfiles.userId, set: { ...input, updatedAt: new Date() } });
        await tx.insert(auditEvents).values({ actorUserId: user.id, action: profileAuditAction(existingProfile.length > 0), resourceType: "user_profile", resourceId: user.id, metadata: "{}" });
        return toResponse({ userId: user.id, ...input });
      });
    },
  };
}
