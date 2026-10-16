import { describe, expect, it } from "vitest";
import { submitPartnershipInquiry } from "@/app/actions/partner-inquiry";

describe("Scale With Us & Partner Inquiry Action", () => {
  it("accepts and registers valid partnership and investor inquiries", async () => {
    const result = await submitPartnershipInquiry({
      name: "Dr. Elena Rostova",
      email: "elena.rostova@tokyotech.ac.jp",
      organization: "Tokyo Institute of Technology",
      role: "Dean of International Programs",
      interest: "College & University Partnerships",
      stageOrScale: "1,200 engineering undergraduates",
      areasOfInterest: ["Campus Curriculum Integration", "Speech Recognition & Audio"],
      message: "We would like to pilot SpeakQL for our bilingual software engineering cohorts.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.inquiryId).toContain("inq_");
      expect(result.receivedAt).toBeTruthy();
      expect(result.message).toContain("Tokyo Institute of Technology");
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
    const payload = {
      name: "Marcus Vance",
      email: "marcus@enterprise.test",
      organization: "Enterprise Global",
      role: "VP of People",
      interest: "Corporate & Industry Training",
      message: "Looking for employee language training across our distributed engineering team.",
    };

    const first = await submitPartnershipInquiry(payload);
    expect(first.success).toBe(true);

    const second = await submitPartnershipInquiry(payload);
    expect(second.success).toBe(false);
    if (!second.success) {
      expect(second.error).toContain("recently received");
    }
  });
});
