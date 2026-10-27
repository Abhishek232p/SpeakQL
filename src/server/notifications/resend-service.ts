import { getEnv } from "@/src/lib/env";
import type { PartnerInquiryRecord } from "@/src/server/partners/repository";

export type NotificationDeliveryResult =
  | { success: true; dispatchId: string; sentAt: Date; provider: "resend" }
  | { success: false; error: string; retryable: boolean; provider: "resend" | "none" };

export interface NotificationService {
  sendInquiryNotification(inquiry: PartnerInquiryRecord): Promise<NotificationDeliveryResult>;
}

export class ResendNotificationService implements NotificationService {
  private readonly apiKey?: string;
  private readonly fromEmail: string;
  private readonly toEmail: string;

  public constructor(options?: {
    apiKey?: string;
    fromEmail?: string;
    toEmail?: string;
  }) {
    const env = getEnv();
    this.apiKey = options?.apiKey ?? env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
    this.fromEmail =
      options?.fromEmail ??
      env.RESEND_FROM_EMAIL ??
      process.env.RESEND_FROM_EMAIL ??
      "SpeakQL <onboarding@resend.dev>";
    this.toEmail =
      options?.toEmail ??
      env.PARTNER_NOTIFICATION_EMAIL ??
      process.env.PARTNER_NOTIFICATION_EMAIL ??
      "Abhishek@speakql.tech";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async sendInquiryNotification(
    inquiry: PartnerInquiryRecord,
  ): Promise<NotificationDeliveryResult> {
    if (!this.isConfigured() || !this.apiKey) {
      console.warn(
        `[Resend Notification] RESEND_API_KEY not configured. Skipping email dispatch for inquiry ${inquiry.inquiryReference}.`,
      );
      return {
        success: false,
        error: "Email notification service is not configured (RESEND_API_KEY is missing).",
        retryable: true,
        provider: "none",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const subject = `[SpeakQL Inquiry] ${inquiry.organization} — ${inquiry.category}`;
      const textContent = `
New SpeakQL Strategic Partnership / Investor Inquiry
=====================================================
Inquiry Reference: ${inquiry.inquiryReference}
Received At: ${inquiry.createdAt.toISOString()}

Contact Information:
- Name: ${inquiry.name}
- Role / Title: ${inquiry.role}
- Organization: ${inquiry.organization}
- Email: ${inquiry.email}

Partnership Details:
- Category / Pathway: ${inquiry.category}
- Scale / Scope: ${inquiry.stageOrScale || "Not specified"}

Message:
${inquiry.message}

Reply Directly to Partner: mailto:${inquiry.email}
Official SpeakQL Founder Contact: Abhishek@speakql.tech
      `.trim();

      const htmlContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0b1120; color: #f8fafc; border-radius: 8px;">
  <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">SpeakQL — New Strategic Partnership Inquiry</h2>
    <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">Ref: <strong>${inquiry.inquiryReference}</strong> · ${inquiry.createdAt.toISOString()}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
    <tr>
      <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Organization:</td>
      <td style="padding: 8px 0; color: #f8fafc; font-weight: 600;">${escapeHtml(inquiry.organization)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #94a3b8;">Contact Name:</td>
      <td style="padding: 8px 0; color: #f8fafc;">${escapeHtml(inquiry.name)} (${escapeHtml(inquiry.role)})</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #94a3b8;">Contact Email:</td>
      <td style="padding: 8px 0; color: #38bdf8;"><a href="mailto:${escapeHtml(inquiry.email)}" style="color: #38bdf8; text-decoration: underline;">${escapeHtml(inquiry.email)}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #94a3b8;">Pathway / Category:</td>
      <td style="padding: 8px 0; color: #a855f7; font-weight: 600;">${escapeHtml(inquiry.category)}</td>
    </tr>
    ${
      inquiry.stageOrScale
        ? `<tr>
      <td style="padding: 8px 0; color: #94a3b8;">Scale / Scope:</td>
      <td style="padding: 8px 0; color: #f8fafc;">${escapeHtml(inquiry.stageOrScale)}</td>
    </tr>`
        : ""
    }
  </table>

  <div style="background: #1e293b; border-left: 4px solid #38bdf8; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Message</p>
    <p style="margin: 0; color: #f1f5f9; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">${escapeHtml(inquiry.message)}</p>
  </div>

  <div style="border-top: 1px solid #1e293b; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
    Delivered securely by SpeakQL Server Notification Infrastructure.
    <br />
    Direct Founder Contact: <a href="mailto:Abhishek@speakql.tech" style="color: #38bdf8; text-decoration: none;">Abhishek@speakql.tech</a>
  </div>
</div>
      `.trim();

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [this.toEmail],
          reply_to: inquiry.email,
          subject,
          text: textContent,
          html: htmlContent,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorMessage = `Resend API rejected request with status ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.message) errorMessage = parsed.message;
        } catch {
          // fallback
        }
        console.error(`[Resend Notification] Error sending notification: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage,
          retryable: response.status >= 500 || response.status === 429,
          provider: "resend",
        };
      }

      const data = (await response.json()) as { id?: string };
      const dispatchId = data.id || `disp_${Date.now().toString(36)}`;
      const sentAt = new Date();

      console.info(
        `[Resend Notification] Successfully dispatched notification ${dispatchId} for inquiry ${inquiry.inquiryReference}`,
      );

      return {
        success: true,
        dispatchId,
        sentAt,
        provider: "resend",
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Resend request timed out after 8s."
            : err.message
          : "Unknown error during Resend dispatch.";
      console.error(`[Resend Notification] Dispatch failed:`, errorMessage);
      return {
        success: false,
        error: errorMessage,
        retryable: true,
        provider: "resend",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
