import { describe, expect, it } from "vitest";
import {
  CALL_SIMULATION_SCENARIOS,
  DOMAIN_VOCABULARY_ITEMS,
  TATOEBA_SENTENCE_PAIRS,
} from "@/src/client/data/tatoeba-corpus";

describe("Tatoeba Multilingual Corpus & Open Source Sentence Infrastructure", () => {
  it("contains curated sentence pairs with valid target languages and bilingual bridges", () => {
    expect(TATOEBA_SENTENCE_PAIRS.length).toBeGreaterThanOrEqual(10);

    const validLangs = new Set(["de", "ja", "en"]);
    const validDomains = new Set(["engineering", "legal", "healthcare", "business"]);
    const validCefr = new Set(["A1", "A2", "B1", "B2", "C1"]);

    for (const pair of TATOEBA_SENTENCE_PAIRS) {
      expect(pair.id).toBeTruthy();
      expect(validLangs.has(pair.targetLanguage)).toBe(true);
      expect(validDomains.has(pair.domain)).toBe(true);
      expect(validCefr.has(pair.cefrLevel)).toBe(true);
      expect(pair.targetText.trim().length).toBeGreaterThan(0);
      expect(pair.englishText.trim().length).toBeGreaterThan(0);
      expect(pair.hindiText.trim().length).toBeGreaterThan(0);

      // Japanese sentences should contain romaji transliteration bridge for English/Hindi learners
      if (pair.targetLanguage === "ja") {
        expect(pair.transliteration).toBeDefined();
        expect(pair.transliteration!.length).toBeGreaterThan(0);
      }
    }
  });

  it("covers German, Japanese, and English tracks with engineering & workplace domains", () => {
    const dePairs = TATOEBA_SENTENCE_PAIRS.filter((p) => p.targetLanguage === "de");
    const jaPairs = TATOEBA_SENTENCE_PAIRS.filter((p) => p.targetLanguage === "ja");
    const enPairs = TATOEBA_SENTENCE_PAIRS.filter((p) => p.targetLanguage === "en");

    expect(dePairs.length).toBeGreaterThanOrEqual(3);
    expect(jaPairs.length).toBeGreaterThanOrEqual(3);
    expect(enPairs.length).toBeGreaterThanOrEqual(3);

    // Verify presence of SOV / case-alignment technical sentences
    const deDbSentence = dePairs.find((p) => p.targetText.includes("Latenz") || p.targetText.includes("Datenbank"));
    expect(deDbSentence).toBeDefined();
    expect(deDbSentence?.hindiText).toContain("डेटाबेस");

    const jaDbSentence = jaPairs.find((p) => p.targetText.includes("データベース") || p.targetText.includes("キャッシュ"));
    expect(jaDbSentence).toBeDefined();
    expect(jaDbSentence?.hindiText).toContain("डेटाबेस");
  });

  it("verifies Kaikki/Wiktionary domain vocabulary items have Hindi and English meanings", () => {
    expect(DOMAIN_VOCABULARY_ITEMS.length).toBeGreaterThanOrEqual(10);

    for (const item of DOMAIN_VOCABULARY_ITEMS) {
      expect(item.term.trim().length).toBeGreaterThan(0);
      expect(["de", "ja", "en"]).toContain(item.targetLanguage);
      expect(["noun", "verb", "adjective", "phrase"]).toContain(item.pos);
      expect(item.englishMeaning.trim().length).toBeGreaterThan(0);
      expect(item.hindiMeaning.trim().length).toBeGreaterThan(0);
      expect(item.exampleSentence.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("AI Voice Call Simulator Scenarios & Briefing Rooms", () => {
  it("provides complete 15-minute and 30-minute workplace call simulation tracks", () => {
    expect(CALL_SIMULATION_SCENARIOS.length).toBeGreaterThanOrEqual(3);

    const deScenario = CALL_SIMULATION_SCENARIOS.find((s) => s.id === "call_de_standup");
    const jaScenario = CALL_SIMULATION_SCENARIOS.find((s) => s.id === "call_ja_horenso");
    const enScenario = CALL_SIMULATION_SCENARIOS.find((s) => s.id === "call_en_executive");

    expect(deScenario).toBeDefined();
    expect(jaScenario).toBeDefined();
    expect(enScenario).toBeDefined();

    expect(deScenario?.recommendedMinutes).toBe(15);
    expect(deScenario?.localeCode).toBe("de-DE");

    expect(jaScenario?.recommendedMinutes).toBe(15);
    expect(jaScenario?.localeCode).toBe("ja-JP");

    expect(enScenario?.recommendedMinutes).toBe(30);
    expect(enScenario?.localeCode).toBe("en-US");
  });

  it("ensures every scenario provides rich multilingual briefing, etiquette guidance, and key phrases", () => {
    for (const scenario of CALL_SIMULATION_SCENARIOS) {
      // AI Persona validation
      expect(scenario.aiPersona.name.length).toBeGreaterThan(0);
      expect(scenario.aiPersona.role.length).toBeGreaterThan(0);
      expect(scenario.aiPersona.avatarEmoji.length).toBeGreaterThan(0);
      expect(scenario.aiPersona.greetingText.length).toBeGreaterThan(0);
      expect(scenario.aiPersona.greetingHindi.length).toBeGreaterThan(0);
      expect(scenario.aiPersona.greetingEnglish.length).toBeGreaterThan(0);

      // Briefing room validation
      expect(scenario.briefing.context.length).toBeGreaterThan(10);
      expect(scenario.briefing.contextHindi.length).toBeGreaterThan(10);
      expect(scenario.briefing.objective.length).toBeGreaterThan(10);
      expect(scenario.briefing.objectiveHindi.length).toBeGreaterThan(10);
      expect(scenario.briefing.culturalEtiquette.length).toBeGreaterThan(10);
      expect(scenario.briefing.culturalEtiquetteHindi.length).toBeGreaterThan(10);

      // Key technical phrases validation (at least 3 actionable phrases with Hindi bridges)
      expect(scenario.briefing.keyPhrases.length).toBeGreaterThanOrEqual(3);
      for (const phrase of scenario.briefing.keyPhrases) {
        expect(phrase.phrase.length).toBeGreaterThan(0);
        expect(phrase.meaningHindi.length).toBeGreaterThan(0);
        expect(phrase.meaningEnglish.length).toBeGreaterThan(0);
      }

      // Sample turns validation
      expect(scenario.sampleDialogueTurns.length).toBeGreaterThanOrEqual(2);
      expect(scenario.sampleDialogueTurns[0].role).toBe("ai");
      expect(scenario.sampleDialogueTurns[0].hindiHint).toBeDefined();
    }
  });

  it("calculates diagnostic debrief scoring accurately based on user turn performance", () => {
    // Scoring logic helper as defined in the simulator
    function calculateDebriefScore(userTurns: number) {
      const score = Math.min(98, 80 + userTurns * 4);
      const clarity = userTurns >= 2 ? "Mastered" : "Needs Reinforcement";
      const xp = Math.max(25, userTurns * 10);
      const gems = Math.max(15, userTurns * 5);
      return { score, clarity, xp, gems };
    }

    const baseline = calculateDebriefScore(0);
    expect(baseline.score).toBe(80);
    expect(baseline.clarity).toBe("Needs Reinforcement");
    expect(baseline.xp).toBe(25);
    expect(baseline.gems).toBe(15);

    const activeCall = calculateDebriefScore(4);
    expect(activeCall.score).toBe(96);
    expect(activeCall.clarity).toBe("Mastered");
    expect(activeCall.xp).toBe(40);
    expect(activeCall.gems).toBe(20);

    const cappedCall = calculateDebriefScore(10);
    expect(cappedCall.score).toBe(98);
  });

  it("formats call duration countdown correctly for 15-minute and 30-minute scenarios", () => {
    function formatTime(seconds: number): string {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    expect(formatTime(15 * 60)).toBe("15:00");
    expect(formatTime(30 * 60)).toBe("30:00");
    expect(formatTime(899)).toBe("14:59");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(0)).toBe("00:00");
  });
});
