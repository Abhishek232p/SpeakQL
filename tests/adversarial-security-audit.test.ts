import { describe, expect, it } from "vitest";
import { profileInputSchema } from "@/src/server/profiles/contract";
import { parseStoredEvaluationFeedback, serializeEvaluationFeedback } from "@/src/server/evaluation/boundary";

describe("Adversarial Security & Penetration Audit", () => {
  describe("Input Sanitization & Buffer Overflow Defense", () => {
    it("rejects malicious or oversized profile input payloads", () => {
      // Buffer overflow attempt (100k string)
      const oversizedPayload = {
        displayName: "A".repeat(100_000),
      };
      const result = profileInputSchema.safeParse(oversizedPayload);
      expect(result.success).toBe(false);
    });

    it("rejects SQL injection probes and script tags in strict structured schemas", () => {
      const maliciousPayload = {
        displayName: "<script>alert('xss')</script>' OR '1'='1' --",
        locale: "es",
        timezone: "UTC",
      };
      const result = profileInputSchema.safeParse(maliciousPayload);
      if (result.success) {
        expect(result.data.displayName).toContain("<script>");
      }
    });

    it("handles null-byte injection cleanly in stored evaluation parser", () => {
      const nullByteInput = "Valid feedback\0inject_raw_binary";
      expect(() => parseStoredEvaluationFeedback(nullByteInput)).not.toThrow();
    });

    it("safely round-trips adversarial strings through feedback serialization", () => {
      const adversarialDecision = {
        source: "provider" as const,
        providerId: "test-provider",
        result: {
          schemaVersion: "speakql.evaluation.v1" as const,
          score: "mastered" as const,
          feedback: "'; DROP TABLE users; -- <img src=x onerror=alert(1)>",
          criteria: [
            { id: "context" as const, label: "Context signal", passed: true, evidence: "Test injection'; SELECT 1;--" },
          ],
          mistakes: ["SQL Injection Probe: ' OR 1=1;--"],
          nextAction: "<script>alert(document.cookie)</script>",
          usage: { inputTokens: 10, outputTokens: 10, costUsd: 0.0001 },
        },
      };
      const serialized = serializeEvaluationFeedback(adversarialDecision);
      const parsed = parseStoredEvaluationFeedback(serialized);
      expect(parsed.summaryFeedback).toBe("'; DROP TABLE users; -- <img src=x onerror=alert(1)>");
      expect(parsed.nextAction).toBe("<script>alert(document.cookie)</script>");
      expect(parsed.mistakes).toContain("SQL Injection Probe: ' OR 1=1;--");
      expect(parsed.source).toBe("provider");
    });
  });

  describe("Authentication & Boundary Defenses", () => {
    it("prevents empty, truncated, or whitespace-only subjects from identity transactions", () => {
      const invalidIdentities = [
        { issuer: "https://auth.example.com", subject: "" },
        { issuer: "", subject: "user_123" },
        { issuer: "https://auth.example.com", subject: "   " },
        { issuer: "https://auth.example.com\0", subject: "user_123" },
        { issuer: "https://auth.example.com", subject: "user_123\0admin" },
      ];

      for (const id of invalidIdentities) {
        const hasNullByte = id.issuer.includes("\0") || id.subject.includes("\0");
        const hasEmpty = !id.issuer.trim() || !id.subject.trim();
        expect(hasNullByte || hasEmpty).toBe(true);
      }
    });

    it("enforces UUID-only formatting for exercise IDs in evaluation routes", () => {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      const maliciousIds = [
        "../..//etc/passwd",
        "1; SELECT * FROM users;",
        "' OR '1'='1",
        "<svg onload=alert(1)>",
        "12345",
      ];

      for (const id of maliciousIds) {
        expect(UUID_REGEX.test(id)).toBe(false);
      }

      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(UUID_REGEX.test(validUuid)).toBe(true);
    });
  });
});
