import { describe, expect, it } from "vitest";
import { config } from "dotenv";
import { getDb } from "@/src/server/db/client";
import { createPartnerInquiriesRepository } from "@/src/server/partners/repository";
import { partnerInquiries } from "@/src/server/db/schema";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

describe("Live PostgreSQL Database Verification: partner_inquiries", () => {
  it("durably inserts, queries, updates notification status, and verifies records in PostgreSQL", async () => {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, skipping live DB test.");
      return;
    }

    const db = getDb();
    const repo = createPartnerInquiriesRepository(db);

    const testRef = `live_verify_${Date.now()}`;
    const saved = await repo.saveInquiry({
      inquiryReference: testRef,
      name: "Abhishek Verification Agent",
      email: "abhishek-agent@speakql.tech",
      organization: "SpeakQL Systems",
      role: "System Verifier",
      category: "Strategic Collaborations & Tie-Ups",
      stageOrScale: "Production Verification",
      message: "Testing durable persistence directly in live PostgreSQL database.",
      idempotencyKey: `idemp_${testRef}`,
    });

    expect(saved.id).toBeTruthy();
    expect(saved.inquiryReference).toBe(testRef);
    expect(saved.notificationStatus).toBe("pending");

    // Query back from database
    const fetched = await repo.getInquiryByReference(testRef);
    expect(fetched).toBeTruthy();
    expect(fetched?.organization).toBe("SpeakQL Systems");

    // Update notification status
    const updated = await repo.updateNotificationStatus(testRef, {
      status: "not_configured",
      error: "RESEND_API_KEY awaiting provision in environment",
    });

    expect(updated.notificationStatus).toBe("not_configured");
    expect(updated.notificationError).toContain("RESEND_API_KEY");

    // Clean up test verification record via admin connection
    if (process.env.MIGRATION_DATABASE_URL) {
      const { Pool } = await import("pg");
      const adminPool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
      await adminPool.query("DELETE FROM partner_inquiries WHERE inquiry_reference = $1", [testRef]);
      await adminPool.end();
    }
  });
});
