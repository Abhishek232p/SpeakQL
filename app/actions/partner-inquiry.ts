'use server';

import { z } from "zod";
import { getDb } from "@/src/server/db/client";
import {
  createPartnerInquiriesRepository,
  type PartnerInquiriesRepository,
} from "@/src/server/partners/repository";
import {
  ResendNotificationService,
  type NotificationService,
} from "@/src/server/notifications/resend-service";

const inquirySchema = z.object({
  name: z.string().trim().min(1, "Please provide your full name.").max(100),
  email: z.string().trim().email("Please provide a valid work or institutional email address.").max(100),
  organization: z.string().trim().min(1, "Please provide your organization or firm name.").max(100),
  role: z.string().trim().min(1, "Please provide your role or title.").max(100),
  interest: z.string().trim().min(1, "Please select an area of interest."),
  stageOrScale: z.string().trim().max(100).optional(),
  areasOfInterest: z.array(z.string()).max(10).optional(),
  message: z.string().trim().min(5, "Please provide a brief message or description of your interest.").max(3000),
  idempotencyKey: z.string().max(128).optional(),
});

export type PartnershipInquiryInput = z.infer<typeof inquirySchema>;

export type PartnershipInquiryResult =
  | {
      success: true;
      inquiryId: string;
      receivedAt: string;
      message: string;
      durable: boolean;
      notificationStatus: "sent" | "failed" | "not_configured" | "pending";
      dispatchId?: string;
      canRetryNotification?: boolean;
    }
  | { success: false; error: string; canRetryNotification?: boolean };

// In-memory anti-spam rate limiting & duplicate suppression (60-second window)
const recentSubmissions = new Map<string, number>();

function cleanRecentSubmissions() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60_000) {
      recentSubmissions.delete(key);
    }
  }
}

export interface InquiryDependencies {
  repository?: PartnerInquiriesRepository;
  notificationService?: NotificationService;
}

export async function submitPartnershipInquiry(
  rawInput: unknown,
  deps: InquiryDependencies = {},
): Promise<PartnershipInquiryResult> {
  try {
    const parseResult = inquirySchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid inquiry data provided.";
      return { success: false, error: firstError };
    }

    const data = parseResult.data;
    cleanRecentSubmissions();

    // 1. In-memory burst duplicate check (30s)
    const dedupeKey = `${data.email.toLowerCase()}:${data.interest}`;
    const lastSubmission = recentSubmissions.get(dedupeKey);
    const now = Date.now();

    if (lastSubmission && now - lastSubmission < 30_000) {
      return {
        success: false,
        error: "An inquiry for this email and pathway was recently received. Please allow a few moments before resubmitting.",
      };
    }

    // Resolve repository
    let repo = deps.repository;
    if (!repo) {
      try {
        const db = getDb();
        repo = createPartnerInquiriesRepository(db);
      } catch (dbInitErr) {
        console.error("[Partnership Inquiry] Database initialization error:", dbInitErr);
        return {
          success: false,
          error: "Database service unavailable. Your inquiry could not be saved. Please email Abhishek@speakql.tech directly.",
        };
      }
    }

    // 2. Database-backed duplicate check
    try {
      const recentDbDuplicate = await repo.findRecentDuplicate(data.email, data.interest, 30);
      if (recentDbDuplicate) {
        return {
          success: false,
          error: "An inquiry for this email and pathway was recently received. Please allow a few moments before resubmitting.",
        };
      }
    } catch (checkErr) {
      console.warn("[Partnership Inquiry] Duplicate check warning:", checkErr);
      // Proceed to save attempt
    }

    const inquiryReference = `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const idempotencyKey = data.idempotencyKey || `${dedupeKey}:${Math.floor(now / 30_000)}`;

    // 3. Durable Database Persistence (CRITICAL: Do not report success if this fails)
    let savedInquiry;
    try {
      savedInquiry = await repo.saveInquiry({
        inquiryReference,
        name: data.name,
        email: data.email,
        organization: data.organization,
        role: data.role,
        category: data.interest,
        stageOrScale: data.stageOrScale,
        message: data.message,
        idempotencyKey,
      });
      // Mark in-memory throttle only after successful database insert
      recentSubmissions.set(dedupeKey, now);
    } catch (persistErr) {
      console.error("[Partnership Inquiry] Failed to persist inquiry:", persistErr);
      return {
        success: false,
        error: "Failed to securely store your inquiry in the database. Please reach out to Abhishek@speakql.tech directly.",
      };
    }

    // 4. Server-Side Email Notification via Resend
    const notifier = deps.notificationService || new ResendNotificationService();
    const notificationResult = await notifier.sendInquiryNotification(savedInquiry);

    if (notificationResult.success) {
      try {
        await repo.updateNotificationStatus(inquiryReference, {
          status: "sent",
          dispatchId: notificationResult.dispatchId,
          sentAt: notificationResult.sentAt,
        });
      } catch (statusErr) {
        console.error("[Partnership Inquiry] Failed to update sent status:", statusErr);
      }

      return {
        success: true,
        inquiryId: inquiryReference,
        receivedAt: savedInquiry.createdAt.toISOString(),
        durable: true,
        notificationStatus: "sent",
        dispatchId: notificationResult.dispatchId,
        message: `Thank you, ${data.name}. Your inquiry for ${data.organization} has been securely stored and notification has been dispatched to Abhishek@speakql.tech.`,
      };
    }

    // 5. Notification failed or unconfigured, BUT inquiry is safely stored
    const finalNotificationStatus = notificationResult.provider === "none" ? "not_configured" : "failed";
    try {
      await repo.updateNotificationStatus(inquiryReference, {
        status: finalNotificationStatus,
        error: notificationResult.error,
      });
    } catch (statusErr) {
      console.error("[Partnership Inquiry] Failed to update failed status:", statusErr);
    }

    console.info(
      `[Partnership Inquiry] Stored inquiry ${inquiryReference} (Notification ${finalNotificationStatus}): ${notificationResult.error}`,
    );

    return {
      success: true,
      inquiryId: inquiryReference,
      receivedAt: savedInquiry.createdAt.toISOString(),
      durable: true,
      notificationStatus: finalNotificationStatus,
      message: `Thank you, ${data.name}. Your inquiry for ${data.organization} has been securely saved in the SpeakQL database. Direct notification to leadership is queued; you may also contact Abhishek@speakql.tech directly.`,
      canRetryNotification: notificationResult.retryable,
    };
  } catch (err) {
    console.error("[Partnership Inquiry] Unexpected processing error:", err);
    return {
      success: false,
      error: "Unable to submit your inquiry at this time. Please email Abhishek@speakql.tech directly.",
    };
  }
}

export async function retryInquiryNotification(
  inquiryReference: string,
  deps: InquiryDependencies = {},
): Promise<PartnershipInquiryResult> {
  if (!inquiryReference || typeof inquiryReference !== "string") {
    return { success: false, error: "Invalid inquiry reference." };
  }

  let repo = deps.repository;
  if (!repo) {
    try {
      const db = getDb();
      repo = createPartnerInquiriesRepository(db);
    } catch {
      return { success: false, error: "Database unavailable for retry." };
    }
  }

  const inquiry = await repo.getInquiryByReference(inquiryReference);
  if (!inquiry) {
    return { success: false, error: "Inquiry record not found." };
  }

  if (inquiry.notificationStatus === "sent") {
    return {
      success: true,
      inquiryId: inquiry.inquiryReference,
      receivedAt: inquiry.createdAt.toISOString(),
      durable: true,
      notificationStatus: "sent",
      dispatchId: inquiry.notificationDispatchId || undefined,
      message: "Notification for this inquiry has already been delivered to Abhishek@speakql.tech.",
    };
  }

  const notifier = deps.notificationService || new ResendNotificationService();
  const result = await notifier.sendInquiryNotification(inquiry);

  if (result.success) {
    await repo.updateNotificationStatus(inquiryReference, {
      status: "sent",
      dispatchId: result.dispatchId,
      sentAt: result.sentAt,
    });
    return {
      success: true,
      inquiryId: inquiry.inquiryReference,
      receivedAt: inquiry.createdAt.toISOString(),
      durable: true,
      notificationStatus: "sent",
      dispatchId: result.dispatchId,
      message: "Notification successfully delivered to Abhishek@speakql.tech.",
    };
  }

  await repo.updateNotificationStatus(inquiryReference, {
    status: "failed",
    error: result.error,
  });

  return {
    success: false,
    error: `Notification retry failed: ${result.error}`,
    canRetryNotification: result.retryable,
  };
}
