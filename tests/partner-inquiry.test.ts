import { describe, expect, it, vi } from "vitest";
import { submitPartnershipInquiry, retryInquiryNotification } from "@/app/actions/partner-inquiry";
import type {
  PartnerInquiriesRepository,
  PartnerInquiryRecord,
  SaveInquiryInput,
  NotificationUpdate,
} from "@/src/server/partners/repository";
import type {
  NotificationService,
  NotificationDeliveryResult,
} from "@/src/server/notifications/resend-service";

function createMockRepository(initialRecords: PartnerInquiryRecord[] = []): PartnerInquiriesRepository {
  const records = new Map<string, PartnerInquiryRecord>(
    initialRecords.map((r) => [r.inquiryReference, { ...r }]),
  );

  return {
    async saveInquiry(input: SaveInquiryInput): Promise<PartnerInquiryRecord> {
      const record: PartnerInquiryRecord = {
        id: `uuid_${Date.now()}`,
        inquiryReference: input.inquiryReference,
        name: input.name,
        email: input.email,
        organization: input.organization,
        role: input.role,
        category: input.category,
        stageOrScale: input.stageOrScale || null,
        message: input.message,
        notificationStatus: "pending",
        notificationError: null,
        notificationDispatchId: null,
        notificationSentAt: null,
        idempotencyKey: input.idempotencyKey || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      records.set(input.inquiryReference, record);
      return record;
    },
    async getInquiryByReference(reference: string): Promise<PartnerInquiryRecord | null> {
      return records.get(reference) || null;
    },
    async findRecentDuplicate(email: string, category: string): Promise<PartnerInquiryRecord | null> {
      for (const record of records.values()) {
        if (record.email === email.toLowerCase() && record.category === category) {
          return record;
        }
      }
      return null;
    },
    async updateNotificationStatus(reference: string, update: NotificationUpdate): Promise<PartnerInquiryRecord> {
      const record = records.get(reference);
      if (!record) throw new Error("Not found");
      record.notificationStatus = update.status;
      record.notificationDispatchId = update.dispatchId || null;
      record.notificationError = update.error || null;
      record.notificationSentAt = update.sentAt || null;
      record.updatedAt = new Date();
      return record;
    },
  };
}

describe("Scale With Us & Partner Inquiry Action", () => {
  it("accepts and durably registers valid partnership and investor inquiries", async () => {
    const mockRepo = createMockRepository();
    const mockNotifier: NotificationService = {
      sendInquiryNotification: vi.fn().mockResolvedValue({
        success: true,
        dispatchId: "disp_test_123",
        sentAt: new Date(),
        provider: "resend",
      } satisfies NotificationDeliveryResult),
    };

    const result = await submitPartnershipInquiry(
      {
        name: "Dr. Elena Rostova",
        email: "elena.rostova@tokyotech.ac.jp",
        organization: "Tokyo Institute of Technology",
        role: "Dean of International Programs",
        interest: "College & University Partnerships",
        stageOrScale: "1,200 engineering undergraduates",
        areasOfInterest: ["Campus Curriculum Integration", "Speech Recognition & Audio"],
        message: "We would like to pilot SpeakQL for our bilingual software engineering cohorts.",
      },
      { repository: mockRepo, notificationService: mockNotifier },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.inquiryId).toContain("inq_");
      expect(result.receivedAt).toBeTruthy();
      expect(result.durable).toBe(true);
      expect(result.notificationStatus).toBe("sent");
      expect(result.dispatchId).toBe("disp_test_123");
      expect(result.message).toContain("Abhishek@speakql.tech");

      // Verify stored in repository
      const stored = await mockRepo.getInquiryByReference(result.inquiryId);
      expect(stored).toBeTruthy();
      expect(stored?.notificationStatus).toBe("sent");
      expect(stored?.notificationDispatchId).toBe("disp_test_123");
    }
  });

  it("rejects inquiries with invalid email formats", async () => {
    const result = await submitPartnershipInquiry({
      name: "Alex Chen",
      email: "invalid-email-format",
      organization: "Horizon Ventures",
      role: "General Partner",
      interest: "Investment & Funding",
      message: "Interested in the seed investment opportunity.",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("valid work or institutional email");
    }
  });

  it("rejects inquiries missing required organization or role", async () => {
    const result = await submitPartnershipInquiry({
      name: "Alex Chen",
      email: "alex@horizon.vc",
      organization: "",
      role: "",
      interest: "Investment & Funding",
      message: "Interested in the seed investment opportunity.",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("rejects inquiries with messages that are too short", async () => {
    const result = await submitPartnershipInquiry({
      name: "Alex Chen",
      email: "alex@horizon.vc",
      organization: "Horizon Ventures",
      role: "General Partner",
      interest: "Investment & Funding",
      message: "Hi",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("brief message");
    }
  });

  it("throttles rapid duplicate submissions from the same email and pathway", async () => {
    const mockRepo = createMockRepository();
    const payload = {
      name: "Marcus Vance",
      email: "marcus@enterprise.test",
      organization: "Enterprise Global",
      role: "VP of People",
      interest: "Corporate & Industry Training",
      message: "Looking for employee language training across our distributed engineering team.",
    };

    const first = await submitPartnershipInquiry(payload, { repository: mockRepo });
    expect(first.success).toBe(true);

    const second = await submitPartnershipInquiry(payload, { repository: mockRepo });
    expect(second.success).toBe(false);
    if (!second.success) {
      expect(second.error).toContain("recently received");
    }
  });

  it("handles database persistence failure safely and does not report success", async () => {
    const failingRepo: PartnerInquiriesRepository = {
      saveInquiry: vi.fn().mockRejectedValue(new Error("Connection terminated unexpectedly")),
      getInquiryByReference: vi.fn(),
      findRecentDuplicate: vi.fn().mockResolvedValue(null),
      updateNotificationStatus: vi.fn(),
    };

    const result = await submitPartnershipInquiry(
      {
        name: "Sarah Jenkins",
        email: "sarah@stanford.edu",
        organization: "Stanford University",
        role: "Director",
        interest: "Academic Collaboration",
        message: "Exploring institutional trial for engineering students.",
      },
      { repository: failingRepo },
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Abhishek@speakql.tech");
    }
  });

  it("safely retains inquiry when email notification delivery fails and offers retry", async () => {
    const mockRepo = createMockRepository();
    const failingNotifier: NotificationService = {
      sendInquiryNotification: vi.fn().mockResolvedValue({
        success: false,
        error: "Resend API 429: Too Many Requests",
        retryable: true,
        provider: "resend",
      } satisfies NotificationDeliveryResult),
    };

    const result = await submitPartnershipInquiry(
      {
        name: "Kenji Sato",
        email: "kenji@global-corp.jp",
        organization: "Global Corp Japan",
        role: "Managing Director",
        interest: "Enterprise & Scale",
        message: "Requesting presentation for 500 corporate learners.",
      },
      { repository: mockRepo, notificationService: failingNotifier },
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.durable).toBe(true);
      expect(result.notificationStatus).toBe("failed");
      expect(result.canRetryNotification).toBe(true);
      expect(result.message).toContain("securely saved in the SpeakQL database");

      // Verify the record was still stored with failed notification status
      const stored = await mockRepo.getInquiryByReference(result.inquiryId);
      expect(stored).toBeTruthy();
      expect(stored?.notificationStatus).toBe("failed");
      expect(stored?.notificationError).toContain("429");
    }
  });

  it("allows retrying a failed notification successfully", async () => {
    const mockRepo = createMockRepository();
    const failingNotifier: NotificationService = {
      sendInquiryNotification: vi.fn().mockResolvedValue({
        success: false,
        error: "Network timeout",
        retryable: true,
        provider: "resend",
      }),
    };

    const submitResult = await submitPartnershipInquiry(
      {
        name: "Maria Silva",
        email: "maria@rio-tech.br",
        organization: "Rio Tech Ventures",
        role: "Partner",
        interest: "Investment & Strategic Backing",
        message: "Seed funding inquiry regarding Latin America expansion.",
      },
      { repository: mockRepo, notificationService: failingNotifier },
    );

    expect(submitResult.success).toBe(true);
    if (!submitResult.success) return;

    // Now notifier succeeds on retry
    const workingNotifier: NotificationService = {
      sendInquiryNotification: vi.fn().mockResolvedValue({
        success: true,
        dispatchId: "disp_retry_999",
        sentAt: new Date(),
        provider: "resend",
      }),
    };

    const retryResult = await retryInquiryNotification(submitResult.inquiryId, {
      repository: mockRepo,
      notificationService: workingNotifier,
    });

    expect(retryResult.success).toBe(true);
    if (retryResult.success) {
      expect(retryResult.notificationStatus).toBe("sent");
      expect(retryResult.dispatchId).toBe("disp_retry_999");
    }

    // Retrying an already sent notification returns success without re-dispatching
    const idempotentRetry = await retryInquiryNotification(submitResult.inquiryId, {
      repository: mockRepo,
      notificationService: workingNotifier,
    });

    expect(idempotentRetry.success).toBe(true);
    expect(workingNotifier.sendInquiryNotification).toHaveBeenCalledTimes(1); // not called again
  });
});
