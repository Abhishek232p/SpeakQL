'use server';

import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().trim().min(1, "Please provide your full name.").max(100),
  email: z.string().trim().email("Please provide a valid work or institutional email address.").max(100),
  organization: z.string().trim().min(1, "Please provide your organization or firm name.").max(100),
  role: z.string().trim().min(1, "Please provide your role or title.").max(100),
  interest: z.string().trim().min(1, "Please select an area of interest."),
  stageOrScale: z.string().trim().max(100).optional(),
  areasOfInterest: z.array(z.string()).max(10).optional(),
  message: z.string().trim().min(5, "Please provide a brief message or description of your interest.").max(3000),
});

export type PartnershipInquiryInput = z.infer<typeof inquirySchema>;

export type PartnershipInquiryResult =
  | { success: true; inquiryId: string; receivedAt: string; message: string }
  | { success: false; error: string };

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

export async function submitPartnershipInquiry(rawInput: unknown): Promise<PartnershipInquiryResult> {
  try {
    const parseResult = inquirySchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid inquiry data provided.";
      return { success: false, error: firstError };
    }

    const data = parseResult.data;
    cleanRecentSubmissions();

    // Check duplicate submissions within 60s
    const dedupeKey = `${data.email.toLowerCase()}:${data.interest}`;
    const lastSubmission = recentSubmissions.get(dedupeKey);
    const now = Date.now();

    if (lastSubmission && now - lastSubmission < 30_000) {
      return {
        success: false,
        error: "An inquiry for this email and pathway was recently received. Please allow a few moments before resubmitting.",
      };
    }

    recentSubmissions.set(dedupeKey, now);

    const inquiryId = `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const receivedAt = new Date().toISOString();

    // Structured logging for operations
    console.info(`[Partnership Inquiry] Registered inquiry ${inquiryId} from ${data.organization} (${data.interest})`);

    return {
      success: true,
      inquiryId,
      receivedAt,
      message: `Thank you, ${data.name}. Your inquiry for ${data.organization} has been registered. Our partnership leadership will review and follow up within 2 business days.`,
    };
  } catch (err) {
    console.error("[Partnership Inquiry] Processing error:", err);
    return {
      success: false,
      error: "Unable to submit your inquiry at this time. Please email partners@speakql.ai directly.",
    };
  }
}
