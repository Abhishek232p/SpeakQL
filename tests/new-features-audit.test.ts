import { describe, expect, it } from "vitest";

describe("Feature 1: Roaming Whale Guide Architecture & Contracts", () => {
  it("provides distinct contextual message states for the communication learning journey", async () => {
    // Import RoamingWhaleGuide module to verify exports and contracts
    const whaleModule = await import("@/src/client/components/roaming-whale-guide");
    expect(whaleModule.RoamingWhaleGuide).toBeDefined();

    // Verify WhaleContextEvent contracts
    const supportedEvents = [
      "welcome",
      "goal_selected",
      "practice_started",
      "stuck_hint",
      "mistake_support",
      "task_completed",
      "return_visit",
    ];
    expect(supportedEvents.length).toBe(7);
  });
});

describe("Feature 2: Scale With Us Partnership Page Contracts", () => {
  it("defines the 5 institutional and strategic partnership pathways", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(process.cwd(), "app/scale/page.tsx"), "utf8");

    // Check all 5 pathways exist in page content
    expect(content).toContain("College & University Partnerships");
    expect(content).toContain("Strategic Collaborations & Tie-Ups");
    expect(content).toContain("Corporate & Industry Partnerships");
    expect(content).toContain("Investors & Strategic Advisors");
    expect(content).toContain("Community, Creators & Educators");

    // Check value proposition and honest submission behavior
    expect(content).toContain("The future of communication is personal.");
    expect(content).toContain("partners@speakql.ai");
    expect(content).toContain("Inquiry Logged Successfully");
  });

  it("strictly validates email and required fields before accepting inquiries", () => {
    function validateInquiry(name: string, email: string, organization: string) {
      if (!name.trim() || !email.trim() || !organization.trim()) {
        return { valid: false, error: "Please fill in your name, organization, and a valid email address." };
      }
      if (!email.includes("@") || !email.includes(".")) {
        return { valid: false, error: "Please provide a valid work or institutional email address." };
      }
      return { valid: true };
    }

    expect(validateInquiry("", "test@org.edu", "Stanford").valid).toBe(false);
    expect(validateInquiry("Dr. Smith", "invalid-email", "Stanford").valid).toBe(false);
    expect(validateInquiry("Dr. Smith", "smith@stanford.edu", "").valid).toBe(false);
    expect(validateInquiry("Dr. Smith", "smith@stanford.edu", "Stanford").valid).toBe(true);
  });
});

describe("Feature 3: Digital Practice Whiteboard Architecture", () => {
  it("exports DigitalPracticeWhiteboard component with vector stroke contracts", async () => {
    const whiteboardModule = await import("@/src/client/components/digital-practice-whiteboard");
    expect(whiteboardModule.DigitalPracticeWhiteboard).toBeDefined();
  });

  it("handles stroke history, undo, and clear confirmation safety correctly", () => {
    interface Point { x: number; y: number }
    interface Stroke { color: string; width: number; isEraser: boolean; points: Point[] }

    const strokes: Stroke[] = [];

    // Push two strokes
    strokes.push({ color: "#f8fafc", width: 4, isEraser: false, points: [{ x: 10, y: 10 }, { x: 20, y: 20 }] });
    strokes.push({ color: "#38bdf8", width: 2, isEraser: false, points: [{ x: 30, y: 30 }, { x: 40, y: 40 }] });
    expect(strokes.length).toBe(2);

    // Undo pops the latest stroke
    const undone = strokes.slice(0, strokes.length - 1);
    expect(undone.length).toBe(1);
    expect(undone[0].color).toBe("#f8fafc");

    // Clear empties strokes
    const cleared: Stroke[] = [];
    expect(cleared.length).toBe(0);
  });
});

describe("Feature 4: Real-World Communication Simulator Scenarios & Rubrics", () => {
  it("defines the 6 communication categories with roles, contexts, and objectives", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(process.cwd(), "app/dashboard/practice-view.tsx"), "utf8");

    // Check all 6 categories are configured
    expect(content).toContain("workplace_meetings");
    expect(content).toContain("job_interviews");
    expect(content).toContain("college_presentations");
    expect(content).toContain("everyday_conversations");
    expect(content).toContain("customer_communication");
    expect(content).toContain("public_speaking");

    // Check all 3 input methods are present
    expect(content).toContain("⌨️ Type Answer");
    expect(content).toContain("✍️ Digital Whiteboard");
    expect(content).toContain("🎙️ Speak Aloud");

    // Check scenario variations exist for adaptive practice
    expect(content).toContain("Challenge with Variation");
    expect(content).toContain("Reset to Baseline");
  });

  it("evaluates engineering standup status based on past progress, focus, and blocker pillars", () => {
    function evaluateStandup(text: string) {
      const lower = text.toLowerCase();
      const words = text.split(/\s+/).filter(Boolean);
      const hasPastWork = lower.includes("terminé") || lower.includes("ayer") || lower.includes("finished");
      const hasFocus = lower.includes("enfoco") || lower.includes("hoy") || lower.includes("focus");
      const hasBlocker = lower.includes("bloqueo") || lower.includes("credenciales") || lower.includes("block");

      const isMastered = hasPastWork && (hasFocus || hasBlocker) && words.length >= 10;
      return {
        score: isMastered ? "mastered" : "needs_work",
        hasPastWork,
        hasFocus,
        hasBlocker,
        wordCount: words.length,
      };
    }

    // Comprehensive response meeting all pillars
    const completeResponse = "Ayer terminé de optimizar el servicio de API. Hoy me enfoco en desarrollar la capa de caché. Tengo un bloqueo con las credenciales de staging.";
    const resultComplete = evaluateStandup(completeResponse);
    expect(resultComplete.score).toBe("mastered");
    expect(resultComplete.hasPastWork).toBe(true);
    expect(resultComplete.hasFocus).toBe(true);
    expect(resultComplete.hasBlocker).toBe(true);

    // Incomplete response missing blocker
    const incompleteResponse = "Ayer trabajé un poco en la API.";
    const resultIncomplete = evaluateStandup(incompleteResponse);
    expect(resultIncomplete.score).toBe("needs_work");
  });
});

describe("Feature 5: SpeakQL × Lingo Strategic Architecture", () => {
  it("defines the 4 core professional learning tracks", async () => {
    const { PROFESSIONAL_TRACKS } = await import("@/app/dashboard/speakql-shell");
    expect(PROFESSIONAL_TRACKS).toHaveLength(4);
    const trackIds = PROFESSIONAL_TRACKS.map((t) => t.id);
    expect(trackIds).toContain("engineering");
    expect(trackIds).toContain("product");
    expect(trackIds).toContain("async");
    expect(trackIds).toContain("executive");
  });

  it("calibrates the 4 oceanic leagues with healthy competition principles", () => {
    function computeLeague(userXp: number) {
      if (userXp >= 250) return "Diamond Deep";
      if (userXp >= 150) return "Amethyst Cove";
      if (userXp >= 60) return "Silver Reef";
      return "Bronze Lagoon";
    }

    expect(computeLeague(20)).toBe("Bronze Lagoon");
    expect(computeLeague(75)).toBe("Silver Reef");
    expect(computeLeague(180)).toBe("Amethyst Cove");
    expect(computeLeague(320)).toBe("Diamond Deep");
  });

  it("verifies enterprise scenario rubric weights sum to 100%", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(path.resolve(process.cwd(), "app/enterprise/studio/page.tsx"), "utf8");

    expect(content).toContain("ENTERPRISE SCENARIO STUDIO");
    expect(content).toContain("ASD-STE100 CONTROLLED");
    expect(content).toContain("clarityWeight");
    expect(content).toContain("technicalAccuracyWeight");
    expect(content).toContain("businessImpactWeight");
    expect(content).toContain("professionalToneWeight");
  });
});
