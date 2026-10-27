import { desc, eq, and, gt } from "drizzle-orm";
import { partnerInquiries } from "@/src/server/db/schema";
import type { getDb } from "@/src/server/db/client";

export type Database = ReturnType<typeof getDb>;

export type PartnerInquiryRecord = {
  id: string;
  inquiryReference: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  category: string;
  stageOrScale: string | null;
  message: string;
  notificationStatus: string;
  notificationError: string | null;
  notificationDispatchId: string | null;
  notificationSentAt: Date | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SaveInquiryInput = {
  inquiryReference: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  category: string;
  stageOrScale?: string;
  message: string;
  idempotencyKey?: string;
};

export type NotificationUpdate = {
  status: "sent" | "failed" | "not_configured" | "pending";
  dispatchId?: string;
  error?: string;
  sentAt?: Date;
};

export interface PartnerInquiriesRepository {
  saveInquiry(input: SaveInquiryInput): Promise<PartnerInquiryRecord>;
  getInquiryByReference(reference: string): Promise<PartnerInquiryRecord | null>;
  findRecentDuplicate(email: string, category: string, windowSeconds?: number): Promise<PartnerInquiryRecord | null>;
  updateNotificationStatus(reference: string, update: NotificationUpdate): Promise<PartnerInquiryRecord>;
}

export function createPartnerInquiriesRepository(db: Database): PartnerInquiriesRepository {
  return {
    async saveInquiry(input: SaveInquiryInput): Promise<PartnerInquiryRecord> {
      const [inserted] = await db
        .insert(partnerInquiries)
        .values({
          inquiryReference: input.inquiryReference,
          name: input.name,
          email: input.email.toLowerCase().trim(),
          organization: input.organization.trim(),
          role: input.role.trim(),
          category: input.category.trim(),
          stageOrScale: input.stageOrScale?.trim() || null,
          message: input.message.trim(),
          idempotencyKey: input.idempotencyKey || null,
          notificationStatus: "pending",
        })
        .returning();

      if (!inserted) {
        throw new Error("Failed to insert partnership inquiry into database.");
      }

      return inserted as PartnerInquiryRecord;
    },

    async getInquiryByReference(reference: string): Promise<PartnerInquiryRecord | null> {
      const [record] = await db
        .select()
        .from(partnerInquiries)
        .where(eq(partnerInquiries.inquiryReference, reference))
        .limit(1);

      return (record as PartnerInquiryRecord) || null;
    },

    async findRecentDuplicate(
      email: string,
      category: string,
      windowSeconds = 60,
    ): Promise<PartnerInquiryRecord | null> {
      const cutoff = new Date(Date.now() - windowSeconds * 1000);
      const [recent] = await db
        .select()
        .from(partnerInquiries)
        .where(
          and(
            eq(partnerInquiries.email, email.toLowerCase().trim()),
            eq(partnerInquiries.category, category.trim()),
            gt(partnerInquiries.createdAt, cutoff),
          ),
        )
        .orderBy(desc(partnerInquiries.createdAt))
        .limit(1);

      return (recent as PartnerInquiryRecord) || null;
    },

    async updateNotificationStatus(
      reference: string,
      update: NotificationUpdate,
    ): Promise<PartnerInquiryRecord> {
      const [updated] = await db
        .update(partnerInquiries)
        .set({
          notificationStatus: update.status,
          notificationDispatchId: update.dispatchId || null,
          notificationError: update.error || null,
          notificationSentAt: update.sentAt || null,
          updatedAt: new Date(),
        })
        .where(eq(partnerInquiries.inquiryReference, reference))
        .returning();

      if (!updated) {
        throw new Error(`Inquiry with reference ${reference} not found for status update.`);
      }

      return updated as PartnerInquiryRecord;
    },
  };
}
