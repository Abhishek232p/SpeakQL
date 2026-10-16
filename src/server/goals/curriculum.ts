export type ExerciseType =
  | "contextual_response"
  | "comprehension"
  | "sentence_construction"
  | "vocabulary_in_context"
  | "communication_refinement"
  | "conversation_practice"
  | "error_correction"
  | "speaking_practice";

export type ParsedExerciseOption = {
  id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
};

export type StructuredExercise = {
  scenarioPrompt: string;
  expectedStructure: string;
};

export type StructuredCompetencyPlan = {
  competencyDescription: string;
  exercises: StructuredExercise[];
};

export type ParsedExerciseDetails = {
  exerciseType: ExerciseType;
  objective: string;
  context: string;
  scenario: string;
  instructions: string;
  expectedResponseType: string;
  evaluationCriteria: string;
  estimatedMinutes: number;
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  options?: ParsedExerciseOption[];
  draftToRefine?: string;
  targetVocabulary?: string[];
  dialogueHistory?: Array<{ speaker: string; text: string }>;
  speechPrompt?: string;
};

function detectTargetLanguage(goal: string): string {
  const lower = goal.toLowerCase();
  if (lower.includes("japanese") || lower.includes("日本語") || lower.includes("nihongo") || lower.includes("tokyo")) return "Japanese";
  if (lower.includes("hindi") || lower.includes("हिंदी") || lower.includes("devanagari")) return "Hindi";
  if (lower.includes("spanish") || lower.includes("español")) return "Spanish";
  if (lower.includes("french") || lower.includes("français")) return "French";
  if (lower.includes("german") || lower.includes("deutsch")) return "German";
  if (lower.includes("mandarin") || lower.includes("chinese")) return "Mandarin";
  if (lower.includes("italian") || lower.includes("italiano")) return "Italian";
  if (lower.includes("portuguese") || lower.includes("português")) return "Portuguese";
  return "English";
}

function encodePrompt(details: ParsedExerciseDetails): string {
  return JSON.stringify(details);
}

export function parseExerciseDetails(
  scenarioPrompt: string,
  expectedStructure: string
): ParsedExerciseDetails {
  if (scenarioPrompt.startsWith("{") && scenarioPrompt.endsWith("}")) {
    try {
      const parsed = JSON.parse(scenarioPrompt);
      if (
        typeof parsed.scenario === "string" &&
        typeof parsed.instructions === "string"
      ) {
        // Infer exerciseType if legacy or unspecified
        let inferredType: ExerciseType = "contextual_response";
        if (parsed.exerciseType) {
          inferredType = parsed.exerciseType;
        } else if (Array.isArray(parsed.options) && parsed.options.length > 0) {
          inferredType = "comprehension";
        } else if (parsed.draftToRefine) {
          inferredType = "communication_refinement";
        } else if (Array.isArray(parsed.dialogueHistory) && parsed.dialogueHistory.length > 0) {
          inferredType = "conversation_practice";
        } else if (parsed.scenario.toLowerCase().includes("asks") || parsed.scenario.toLowerCase().includes("teammate")) {
          inferredType = "conversation_practice";
        }

        // Add dialogueHistory if it's a teammate question scenario but lacks explicit dialogueHistory
        let dialogueHistory = parsed.dialogueHistory;
        if (!dialogueHistory && inferredType === "conversation_practice") {
          dialogueHistory = [
            {
              speaker: "Mateo (Tech Lead)",
              text: "¿Los cambios en la capa de caché afectarán el esquema del cliente móvil en producción?",
            },
          ];
        }

        return {
          exerciseType: inferredType,
          objective: typeof parsed.objective === "string" ? parsed.objective : "Effective communication in context",
          context: typeof parsed.context === "string" ? parsed.context : "Professional workplace scenario",
          scenario: parsed.scenario,
          instructions: parsed.instructions,
          expectedResponseType: typeof parsed.expectedResponseType === "string" ? parsed.expectedResponseType : expectedStructure,
          evaluationCriteria: typeof parsed.evaluationCriteria === "string" ? parsed.evaluationCriteria : "Context relevance, message clarity, and tone",
          estimatedMinutes: typeof parsed.estimatedMinutes === "number" ? parsed.estimatedMinutes : 3,
          difficulty: parsed.difficulty === "Foundational" || parsed.difficulty === "Advanced" ? parsed.difficulty : "Intermediate",
          options: parsed.options,
          draftToRefine: parsed.draftToRefine,
          targetVocabulary: parsed.targetVocabulary ?? (inferredType === "contextual_response" ? ["Ayer terminé...", "Hoy me enfoco en...", "Tengo un bloqueo con..."] : undefined),
          dialogueHistory,
          speechPrompt: parsed.speechPrompt ?? "Deliver your response clearly and naturally in the target language.",
        };
      }
    } catch {
      // Fall through to plain text parsing
    }
  }

  // Graceful fallback for legacy plain text prompt records
  return {
    exerciseType: "contextual_response",
    objective: "Communicate clearly and appropriately in the target situation",
    context: "Professional workplace communication scenario",
    scenario: scenarioPrompt,
    instructions: "Respond directly to the situation with clarity and appropriate professional tone.",
    expectedResponseType: expectedStructure || "Clear, professional response (2-4 sentences)",
    evaluationCriteria: "Communicative purpose, situational relevance, and clear structure",
    estimatedMinutes: 3,
    difficulty: "Foundational",
    speechPrompt: "Practice delivering your response conversationally.",
  };
}

export type LearnerStartingLevel = "fresher" | "intermediate" | "advanced";

export interface CurriculumGenerationOptions {
  startingLevel?: LearnerStartingLevel;
  targetLanguage?: string;
}

export function generateGoalCurriculum(
  rawGoal: string,
  startingLevelOrOptions: LearnerStartingLevel | CurriculumGenerationOptions = "fresher",
): StructuredCompetencyPlan[] {
  const options: CurriculumGenerationOptions =
    typeof startingLevelOrOptions === "string"
      ? { startingLevel: startingLevelOrOptions }
      : (startingLevelOrOptions ?? {});
  const startingLevel = options.startingLevel ?? "fresher";
  const goal = rawGoal.trim();
  const lower = goal.toLowerCase();
  const language = options.targetLanguage || detectTargetLanguage(goal);
  const isSpanish = language === "Spanish";

  const isTechOrStandup =
    lower.includes("standup") ||
    lower.includes("stand up") ||
    lower.includes("engineering") ||
    lower.includes("computer science") ||
    lower.includes("sprint") ||
    lower.includes("scrum") ||
    lower.includes("developer");

  const isNegotiation =
    lower.includes("negotiat") ||
    lower.includes("contract") ||
    lower.includes("deal") ||
    lower.includes("pricing") ||
    lower.includes("client");

  const isPresentation =
    lower.includes("present") ||
    lower.includes("executive") ||
    lower.includes("brief") ||
    lower.includes("stakeholder") ||
    lower.includes("leadership");

  if (language === "Japanese") {
    if (startingLevel === "fresher") {
      return [
        {
          competencyDescription: "Hiragana, Katakana & Script Foundations (日本語の文字と発音)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "contextual_response",
                objective: "Master foundational vowels (A-I-U-E-O) and stroke order in Hiragana & Katakana",
                context: "Foundational Japanese script and pronunciation training.",
                scenario: "Practice writing and recognizing the foundational vowels 'あ, い, う, え, お' using the digital practice whiteboard or keyboard.",
                instructions: "Write or type the five basic vowels: a, i, u, e, o (あ, い, う, え, お). Focus on stroke balance and clean character form.",
                expectedResponseType: "Hiragana vowels: あ い う え お",
                evaluationCriteria: "Accurate character production and phonetic recognition",
                estimatedMinutes: 3,
                difficulty: "Foundational",
                targetVocabulary: ["あ (a)", "い (i)", "う (u)", "え (e)", "お (o)"],
                speechPrompt: "Pronounce each vowel clearly: A (あ), I (い), U (う), E (え), O (お).",
              }),
              expectedStructure: "Accurate script production of あ, い, う, え, お.",
            },
          ],
        },
        {
          competencyDescription: "Essential Workplace Japanese and Standup Reporting (ビジネス日本語)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Deliver daily engineering standup update in polite Japanese (です/ます form)",
                context: "Daily morning standup sync (Asakai) with Tokyo engineering colleagues.",
                scenario: "It is your turn in the morning standup. Greet your teammates politely, report that you completed profiling yesterday, and state that today you are implementing the caching service.",
                instructions: "Greet the team with 'お疲れ様です', state yesterday's completed work, and explain today's task in polite form (です/ます).",
                expectedResponseType: "Polite Japanese standup update (2-3 sentences).",
                evaluationCriteria: "Polite register (です/ます), clear status progression, and natural workplace flow.",
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: "Kenji (Tech Lead)",
                    text: "次、アビシェックさん、昨日の進捗と今日の予定をお願いします。",
                  },
                ],
                targetVocabulary: ["お疲れ様です", "昨日はAPIの最適化を完了しました", "本日はキャッシュ層の実装を進めます"],
                speechPrompt: "Speak your morning standup update aloud in polite Japanese.",
              }),
              expectedStructure: "Polite greeting, yesterday's progress, today's focus, and collaborative closing in Japanese.",
            },
          ],
        },
      ];
    } else if (startingLevel === "intermediate") {
      return [
        {
          competencyDescription: "Diagnostic Assessment: Intermediate Workplace Japanese (中間診断テスト)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Diagnostic Assessment: Deliver daily standup and articulate progress in polite Japanese (です/ます)",
                context: "Intermediate diagnostic assessment to evaluate Japanese workplace communication competency.",
                scenario: "Your lead asks for your daily status during morning asakai. Report yesterday's completed task, explain today's focus, and mention any dependency using polite Japanese.",
                instructions: "Demonstrate intermediate sentence construction in polite Japanese (です/ます). Greet with 'お疲れ様です', report progress, and invite team coordination.",
                expectedResponseType: "Polite Japanese standup response (2-3 sentences).",
                evaluationCriteria: "Accurate te-form/masu-form conjugation, situational clarity, and natural professional tone.",
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: "Kenji (Tech Lead)",
                    text: "次、アビシェックさん、昨日の進捗と今日の予定をお願いします。",
                  },
                ],
                targetVocabulary: ["お疲れ様です", "昨日はAPIの最適化を完了しました", "本日はキャッシュ層の実装を進めます"],
                speechPrompt: "Speak your diagnostic morning standup update aloud in polite Japanese.",
              }),
              expectedStructure: "Polite greeting, yesterday's progress, today's focus, and collaborative closing in Japanese.",
            },
          ],
        },
        {
          competencyDescription: "Technical Discussion & Dependency Coordination in Japanese (技術相談・依存関係調整)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Clarify technical dependencies and suggest follow-up sync in Japanese",
                context: "Cross-functional team coordination with Tokyo colleagues.",
                scenario: "A colleague asks if caching changes affect the mobile app. Reassure them of backwards compatibility and suggest a short follow-up meeting.",
                instructions: "Explain technical compatibility politely and propose next action.",
                expectedResponseType: "Professional collaborative response (2-3 sentences).",
                evaluationCriteria: "Technical clarity, polite phrasing, and constructive collaboration.",
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: "Kenji (Tech Lead)",
                    text: "キャッシュ層の変更でモバイルアプリに影響は出ませんか？",
                  },
                ],
                targetVocabulary: ["後方互換性があります", "影響はありません", "確認しましょう"],
                speechPrompt: "Deliver your technical reassurance aloud in polite Japanese.",
              }),
              expectedStructure: "Technical confirmation of compatibility and collaborative proposal in Japanese.",
            },
          ],
        },
      ];
    } else {
      return [
        {
          competencyDescription: "Diagnostic Assessment: Advanced Professional Fluency & Keigo (上級診断テスト・ビジネス敬語)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Diagnostic Assessment: Defend technical architecture trade-offs using appropriate Keigo (Sonkeigo and Kenjougo)",
                context: "High-stakes executive client presentation in Tokyo.",
                scenario: "An enterprise client questions your team's migration timeline. Acknowledge their concern respectfully using Kenjougo, explain the caching architecture benefits, and propose a phased delivery milestone with executive polish.",
                instructions: "Use advanced business Japanese with accurate honorific registers (尊敬語/謙譲語), strategic empathy, and structured negotiation.",
                expectedResponseType: "Executive business Japanese response with proper Keigo (3-4 sentences).",
                evaluationCriteria: "Sophisticated Keigo mastery (Kenjougo/Sonkeigo), strategic stakeholder composure, and persuasive negotiation.",
                estimatedMinutes: 5,
                difficulty: "Advanced",
                dialogueHistory: [
                  {
                    speaker: "Yamada (Client Executive Director)",
                    text: "本番移行のスケジュールが遅延しているようですが、貴社の方針を伺えますか。",
                  },
                ],
                targetVocabulary: ["ご心配をおかけし大変恐縮です", "検証を進めております", "ご提案申し上げます"],
                speechPrompt: "Deliver your executive response with polished professional composure and Keigo.",
              }),
              expectedStructure: "Respectful acknowledgment (Kenjougo), strategic rationale, and phased proposal with executive Keigo.",
            },
          ],
        },
        {
          competencyDescription: "Executive Stakeholder Negotiation & Commercial Strategy (戦略的ビジネス交渉)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "communication_refinement",
                objective: "Navigate high-stakes commercial scope and contract alignment in advanced Japanese",
                context: "Strategic multi-party executive steering committee.",
                scenario: "Negotiate phased deliverables under contract deadline pressure while preserving trust.",
                instructions: "Structure your counter-proposal with executive deference and firmness.",
                expectedResponseType: "Strategic executive counter-proposal (3-4 sentences).",
                evaluationCriteria: "Diplomatic precision, executive Keigo, and proactive commercial closure.",
                estimatedMinutes: 5,
                difficulty: "Advanced",
                draftToRefine: "できません。スコープの変更は無理です。",
                targetVocabulary: ["ご要望を承知いたしました", "段階的なリリース", "合意を形成いたしたく存じます"],
                speechPrompt: "Deliver your refined strategic counter-proposal calmly and persuasively.",
              }),
              expectedStructure: "Strategic Keigo counter-proposal with phased milestone roadmap.",
            },
          ],
        },
      ];
    }
  }

  if (language === "Hindi") {
    if (startingLevel === "fresher") {
      return [
        {
          competencyDescription: "Devanagari Script Foundations & Matras (देवनागरी लिपि और मात्राएँ)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "contextual_response",
                objective: "Recognize and write foundational Devanagari characters and matras",
                context: "Hindi script and phonetic foundations.",
                scenario: "Practice writing basic Devanagari characters and vowel signs (मात्राएँ) on the whiteboard or keyboard.",
                instructions: "Write or type foundational characters (अ, आ, इ, ई, क, ख, ग, घ) with appropriate matras.",
                expectedResponseType: "Devanagari characters: अ, आ, इ, ई, क, ख, ग, घ",
                evaluationCriteria: "Script recognition, correct matra association, and pronunciation",
                estimatedMinutes: 3,
                difficulty: "Foundational",
                targetVocabulary: ["अ (a)", "आ (aa)", "इ (i)", "ई (ee)", "क (ka)", "ख (kha)"],
                speechPrompt: "Pronounce each character with pure phonetic clarity.",
              }),
              expectedStructure: "Clear script production of foundational Devanagari characters and matras.",
            },
          ],
        },
        {
          competencyDescription: "Workplace Status Reporting and Collaborative Discussion in Hindi",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Provide a concise standup update and coordinate dependencies in formal Hindi",
                context: "Daily team sync with bilingual engineering team.",
                scenario: "During the daily sync, give your update: yesterday you fixed the API latency issue, today you are working on the caching service, and you need staging access from your lead.",
                instructions: "Deliver your update in professional Hindi using respectful honorifics (आप/जी).",
                expectedResponseType: "Professional Hindi standup update (2-3 sentences).",
                evaluationCriteria: "Respectful tone, clear blocker explanation, and natural collaborative Hindi.",
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: "Rahul (Engineering Manager)",
                    text: "आज का स्टेटस क्या है और क्या कोई ब्लॉकर है?",
                  },
                ],
                targetVocabulary: ["कल मैंने पूरा किया...", "आज मैं काम कर रहा हूँ...", "स्टेजिंग एक्सेस की ज़रूरत है"],
                speechPrompt: "Deliver your standup status update aloud in Hindi.",
              }),
              expectedStructure: "Clear 3-part update in formal Hindi: completed, today's focus, and blocker.",
            },
          ],
        },
      ];
    } else if (startingLevel === "intermediate") {
      return [
        {
          competencyDescription: "Diagnostic Assessment: Intermediate Workplace Hindi (मध्यवर्ती मूल्यांकन)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Diagnostic Assessment: Deliver concise standup status and coordinate dependencies in formal Hindi",
                context: "Intermediate diagnostic assessment for workplace Hindi communication.",
                scenario: "During team sync, report completed progress, current development focus, and any staging dependencies using respectful formal Hindi.",
                instructions: "Demonstrate intermediate workplace Hindi with appropriate honorifics (आप/जी) and clear status progression.",
                expectedResponseType: "Professional Hindi standup update (2-3 sentences).",
                evaluationCriteria: "Respectful tone, clear blocker articulation, and fluent workplace Hindi phrasing.",
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: "Rahul (Engineering Manager)",
                    text: "आज का स्टेटस क्या है और क्या कोई ब्लॉकर है?",
                  },
                ],
                targetVocabulary: ["कल मैंने पूरा किया...", "आज मैं काम कर रहा हूँ...", "स्टेजिंग एक्सेस की ज़रूरत है"],
                speechPrompt: "Deliver your diagnostic standup update aloud in formal Hindi.",
              }),
              expectedStructure: "Clear 3-part update in formal Hindi: completed, today's focus, and blocker.",
            },
          ],
        },
        {
          competencyDescription: "Technical Discussion & Cross-Team Dependency Coordination in Hindi (तकनीकी समन्वय)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Clarify API contracts and reassure teammates on backwards compatibility in Hindi",
                context: "Technical architecture review with Indian engineering colleagues.",
                scenario: "A teammate asks if caching updates will break mobile API clients. Reassure them respectfully in Hindi and suggest a quick follow-up meeting.",
                instructions: "Explain technical safety in clear professional Hindi and propose next steps.",
                expectedResponseType: "Professional collaborative technical response (2-3 sentences).",
                evaluationCriteria: "Technical clarity, respectful register, and constructive collaboration.",
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: "Priya (Senior Developer)",
                    text: "क्या इस बदलाव से प्रोडक्शन मोबाइल ऐप पर कोई असर पड़ेगा?",
                  },
                ],
                targetVocabulary: ["पूरी तरह सुरक्षित है", "कोई रुकावट नहीं होगी", "हम समीक्षा कर सकते हैं"],
                speechPrompt: "Deliver your technical reassurance aloud in Hindi.",
              }),
              expectedStructure: "Technical reassurance and constructive coordination in formal Hindi.",
            },
          ],
        },
      ];
    } else {
      return [
        {
          competencyDescription: "Diagnostic Assessment: Advanced Formal Hindi & Strategic Stakeholder Discussion (उच्च स्तरीय व्यावसायिक संवाद)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: "Diagnostic Assessment: Navigate high-stakes stakeholder debate and strategic negotiation in formal Hindi",
                context: "Executive stakeholder meeting with leadership team.",
                scenario: "An enterprise client questions your project delivery timeline. Respond with executive composure in formal Hindi, explain architectural safety, and negotiate a phased milestone release.",
                instructions: "Use sophisticated formal Hindi with diplomatic precision, clear rationale, and persuasive negotiation.",
                expectedResponseType: "Executive formal Hindi negotiation response (3-4 sentences).",
                evaluationCriteria: "High-register vocabulary, strategic composure, and persuasive negotiation in Hindi.",
                estimatedMinutes: 5,
                difficulty: "Advanced",
                dialogueHistory: [
                  {
                    speaker: "Sharma Ji (Client Executive Director)",
                    text: "परियोजना की समयसीमा में यह विलंब हमारे लिए चिंता का विषय है। आपकी क्या योजना है?",
                  },
                ],
                targetVocabulary: ["आपकी चिंता स्वाभाविक है", "गुणवत्ता और सुरक्षा सुनिश्चित करना", "चरणबद्ध योजना"],
                speechPrompt: "Deliver your executive negotiation response with authority and diplomatic composure.",
              }),
              expectedStructure: "Diplomatic validation, strategic rationale, and phased roadmap in formal Hindi.",
            },
          ],
        },
        {
          competencyDescription: "Strategic Conflict Resolution & Executive Leadership in Hindi (रणनीतिक नेतृत्व)",
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "communication_refinement",
                objective: "Resolve executive pushback and close high-stakes scope agreements in formal Hindi",
                context: "Steering committee negotiation under contract pressure.",
                scenario: "Refine a defensive counter-response into a poised, assertive executive proposal.",
                instructions: "Transform rough confrontation into diplomatic leadership and clear milestone boundaries.",
                expectedResponseType: "Poised executive counter-proposal (3-4 sentences).",
                evaluationCriteria: "Diplomatic boundary setting, executive presence, and constructive closure.",
                estimatedMinutes: 5,
                difficulty: "Advanced",
                draftToRefine: "नहीं, हम यह नहीं कर सकते। यह हमारे अनुबंध में नहीं है।",
                targetVocabulary: ["व्यावहारिक समाधान", "प्राथमिकताओं का संतुलन", "सहमति बनाना"],
                speechPrompt: "Deliver your refined leadership counter-proposal with executive clarity.",
              }),
              expectedStructure: "Diplomatic boundary, shared value reinforcement, and proactive alternative milestone.",
            },
          ],
        },
      ];
    }
  }

  if (isTechOrStandup) {
    const langSuffix = isSpanish ? " in Spanish" : ` in ${language}`;

    if (startingLevel === "fresher") {
      return [
        {
          competencyDescription: `Status reporting and blocker articulation${langSuffix}`,
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "contextual_response",
                objective: `Deliver a concise, professional 30-to-60 second standup status report${langSuffix}`,
                context: `Daily morning engineering sprint standup with your cross-functional teammates${isSpanish ? " conducted in Spanish" : ""}.`,
                scenario: `You are in your morning standup. Yesterday you completed profiling and fixing an API latency issue. Today you are starting on the caching layer, but you need staging credentials to test it. State your status update to the team.`,
                instructions: `Give your 30-second standup update${langSuffix}. Clearly cover: 1) What was finished yesterday, 2) What you will work on today, and 3) The staging access blocker and who you need help from.`,
                expectedResponseType: `Spoken or written standup update${langSuffix} (2-4 concise sentences).`,
                evaluationCriteria: `Clarity of progress, appropriate natural workplace phrasing${langSuffix}, and clear identification of the blocker.`,
                estimatedMinutes: 3,
                difficulty: "Foundational",
                targetVocabulary: isSpanish
                  ? ["Ayer completé...", "Hoy voy a trabajar en...", "Tengo un bloqueo con las credenciales..."]
                  : ["Yesterday I finished...", "Today I am focusing on...", "I am blocked on..."],
                speechPrompt: `Deliver your 30-second standup status report out loud${langSuffix}. Focus on natural pacing and clarity.`,
              }),
              expectedStructure: `A concise 3-part standup update: completed yesterday, planned for today, and blocker identified${langSuffix}.`,
            },
          ],
        },
        {
          competencyDescription: `Technical discussion, questions, and team coordination${langSuffix}`,
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: `Articulate a technical dependency clearly and coordinate an unblocking sync${langSuffix}`,
                context: `Sprint standup discussion regarding inter-team dependencies and API contracts.`,
                scenario: `Your teammate asks in the standup if the caching changes will affect the mobile client schema. Reassure them that the response contract is backwards-compatible, and suggest a 5-minute sync right after the meeting to review the payload together.`,
                instructions: `Respond clearly and collaboratively${langSuffix}. Confirm backwards compatibility, explain why mobile clients will be unaffected, and invite a quick post-standup sync.`,
                expectedResponseType: `Collaborative technical response${langSuffix} (2-3 sentences).`,
                evaluationCriteria: `Empathetic tone, technical clarity${langSuffix}, and explicit call-to-action for collaboration.`,
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: isSpanish ? "Mateo (Líder Técnico)" : "Mateo (Tech Lead)",
                    text: isSpanish
                      ? "¿Los cambios en la capa de caché van a romper la compatibilidad con la app móvil en producción?"
                      : "Will the changes in the caching layer break backwards-compatibility with the production mobile app?",
                  },
                ],
                targetVocabulary: isSpanish
                  ? ["Totalmente retrocompatible", "No habrá impacto", "Podemos revisarlo en 5 minutos"]
                  : ["Fully backwards-compatible", "Zero disruption", "Quick 5-minute sync"],
                speechPrompt: `Answer Mateo's technical question aloud${langSuffix} with confidence and collaborative clarity.`,
              }),
              expectedStructure: `A reassuring, professional response with confirmation of compatibility and a follow-up action step${langSuffix}.`,
            },
          ],
        },
      ];
    } else if (startingLevel === "intermediate") {
      return [
        {
          competencyDescription: `Diagnostic Assessment: Intermediate Technical Communication${langSuffix}`,
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "contextual_response",
                objective: `Diagnostic Assessment: Deliver concise standup update and identify architecture dependencies${langSuffix}`,
                context: `Intermediate diagnostic assessment for technical standup and sprint communication${isSpanish ? " in Spanish" : ""}.`,
                scenario: `You are in your morning standup. Yesterday you completed profiling and fixing an API latency issue. Today you are starting on the caching layer, but you need staging credentials to test it. State your status update to the team.`,
                instructions: `Deliver your 30-second standup update${langSuffix}. Cover what was finished yesterday, planned work today, and the staging credential blocker.`,
                expectedResponseType: `Structured technical status report${langSuffix} (2-4 sentences).`,
                evaluationCriteria: `Clear status progression, natural technical vocabulary${langSuffix}, and crisp blocker articulation.`,
                estimatedMinutes: 3,
                difficulty: "Intermediate",
                targetVocabulary: isSpanish
                  ? ["Ayer completé el análisis de latencia", "Hoy implemento la capa de caché", "Requiero credenciales de staging"]
                  : ["Completed profiling yesterday", "Developing caching layer today", "Blocked on staging credentials"],
                speechPrompt: `Deliver your diagnostic standup report aloud${langSuffix}.`,
              }),
              expectedStructure: `Concise 3-part technical status: completed yesterday, today's focus, and dependency identified${langSuffix}.`,
            },
          ],
        },
        {
          competencyDescription: `Technical discussion, questions, and team coordination${langSuffix}`,
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: `Articulate a technical dependency clearly and coordinate an unblocking sync${langSuffix}`,
                context: `Sprint standup discussion regarding inter-team dependencies and API contracts.`,
                scenario: `Your teammate asks in the standup if the caching changes will affect the mobile client schema. Reassure them that the response contract is backwards-compatible, and suggest a 5-minute sync right after the meeting to review the payload together.`,
                instructions: `Respond clearly and collaboratively${langSuffix}. Confirm backwards compatibility, explain why mobile clients will be unaffected, and invite a quick post-standup sync.`,
                expectedResponseType: `Collaborative technical response${langSuffix} (2-3 sentences).`,
                evaluationCriteria: `Empathetic tone, technical clarity${langSuffix}, and explicit call-to-action for collaboration.`,
                estimatedMinutes: 4,
                difficulty: "Intermediate",
                dialogueHistory: [
                  {
                    speaker: isSpanish ? "Mateo (Líder Técnico)" : "Mateo (Tech Lead)",
                    text: isSpanish
                      ? "¿Los cambios en la capa de caché van a romper la compatibilidad con la app móvil en producción?"
                      : "Will the changes in the caching layer break backwards-compatibility with the production mobile app?",
                  },
                ],
                targetVocabulary: isSpanish
                  ? ["Totalmente retrocompatible", "No habrá impacto", "Podemos revisarlo en 5 minutos"]
                  : ["Fully backwards-compatible", "Zero disruption", "Quick 5-minute sync"],
                speechPrompt: `Answer Mateo's technical question aloud${langSuffix} with confidence and collaborative clarity.`,
              }),
              expectedStructure: `A reassuring, professional response with confirmation of compatibility and a follow-up action step${langSuffix}.`,
            },
          ],
        },
      ];
    } else {
      return [
        {
          competencyDescription: `Diagnostic Assessment: Advanced Technical Leadership & Architecture Defense${langSuffix}`,
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "conversation_practice",
                objective: `Diagnostic Assessment: Defend architectural trade-offs and negotiate milestone adjustments under pushback${langSuffix}`,
                context: `Executive sprint review and architecture council${isSpanish ? " conducted in Spanish" : ""}.`,
                scenario: `A lead architect challenges your caching implementation, arguing it introduces data staleness risks. Defend your design trade-offs, explain cache invalidation safeguards, and propose an observability dashboard to track consistency metrics.`,
                instructions: `Respond with technical authority and professional poise${langSuffix}. Validate the concern, explain the TTL/invalidation strategy, and propose concrete observability metrics.`,
                expectedResponseType: `Advanced technical defense and strategic alignment response${langSuffix} (3-4 sentences).`,
                evaluationCriteria: `Architectural precision, executive composure${langSuffix}, and proactive observability proposal.`,
                estimatedMinutes: 5,
                difficulty: "Advanced",
                dialogueHistory: [
                  {
                    speaker: isSpanish ? "Mateo (Arquitecto Principal)" : "Mateo (Principal Architect)",
                    text: isSpanish
                      ? "¿Cómo garantizamos que la capa de caché no sirva datos obsoletos a clientes financieros en tiempo real?"
                      : "How do we guarantee that the caching layer will not serve stale data to real-time financial clients?",
                  },
                ],
                targetVocabulary: isSpanish
                  ? ["Estrategia de invalidación activa", "Consistencia eventual controlada", "Métricas de observabilidad"]
                  : ["Active invalidation strategy", "Controlled eventual consistency", "Real-time consistency telemetry"],
                speechPrompt: `Deliver your architectural defense aloud${langSuffix} with authority and poise.`,
              }),
              expectedStructure: `Technical validation, architectural safeguard defense, and concrete monitoring solution${langSuffix}.`,
            },
          ],
        },
        {
          competencyDescription: `Strategic Executive Negotiation & Cross-Functional Alignment${langSuffix}`,
          exercises: [
            {
              scenarioPrompt: encodePrompt({
                exerciseType: "communication_refinement",
                objective: `Align cross-functional leads on delivery timelines without compromising security or architectural integrity${langSuffix}`,
                context: `High-stakes release steering committee meeting.`,
                scenario: `Product management wants to release ahead of schedule by bypassing final stress testing. Refine a confrontational refusal into an assertive, risk-focused executive rationale.`,
                instructions: `Set the quality boundary firmly without hostility${langSuffix}, articulate customer impact of unverified releases, and propose a phased canary release.`,
                expectedResponseType: `Executive boundary and alignment response${langSuffix} (3-4 sentences).`,
                evaluationCriteria: `Risk articulation, diplomatic firmness${langSuffix}, and actionable compromise proposal.`,
                estimatedMinutes: 5,
                difficulty: "Advanced",
                draftToRefine: isSpanish
                  ? "No podemos lanzar antes. Es peligroso y no lo voy a aprobar."
                  : "We cannot release early. It is dangerous and I will not sign off on it.",
                targetVocabulary: isSpanish
                  ? ["Integridad de producción", "Despliegue gradual tipo canary", "Proteger la confianza del cliente"]
                  : ["Production integrity", "Phased canary release", "Protect customer trust"],
                speechPrompt: `Deliver your executive quality alignment response aloud${langSuffix}.`,
              }),
              expectedStructure: `Risk acknowledgment, firm quality boundary, and phased canary rollout alternative${langSuffix}.`,
            },
          ],
        },
      ];
    }
  }

  if (isNegotiation) {
    return [
      {
        competencyDescription: `Position framing and value defense in commercial discussions`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "communication_refinement",
              objective: `Refine a commercial negotiation response to defend value diplomatically`,
              context: `High-stakes contract renewal meeting with an enterprise client seeking a 25% discount.`,
              scenario: `The client demands a 25% price reduction before renewing their annual contract. You cannot lower the base price by 25%, but you can offer flexible payment terms or include onboarding training. Formulate your response.`,
              instructions: `Refine the rough draft below into a composed, assertive response. Acknowledge their cost constraints, explain why the core platform value justifies the fee, and propose your alternative concession.`,
              expectedResponseType: `Diplomatic commercial negotiation response (3-4 sentences).`,
              evaluationCriteria: `Constructive assertiveness, value anchoring, and diplomatic concession framing.`,
              estimatedMinutes: 4,
              difficulty: "Intermediate",
              draftToRefine: `No, we cannot give a 25% discount. Our pricing is fixed and the budget is standard. Take it or we won't renew.`,
              targetVocabulary: ["Understand budget constraints", "Core platform ROI", "Flexible quarterly terms", "Additional training"],
              speechPrompt: `Deliver your revised commercial counter-proposal calmly and persuasively.`,
            }),
            expectedStructure: `Acknowledge constraint, re-anchor value, and present alternative concession with clear rationale.`,
          },
        ],
      },
      {
        competencyDescription: `Managing objections and closing agreements under pressure`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "conversation_practice",
              objective: `Decline an unrealistic scope demand while maintaining a collaborative relationship`,
              context: `Project kickoff discussion where a client requests immediate implementation of out-of-scope custom integrations.`,
              scenario: `The client asks to add three bespoke third-party integrations into phase one without extending the deadline. Clarify the boundary and propose scheduling them for phase two.`,
              instructions: `Set the boundary clearly without sounding defensive, outline the delivery risk to phase one, and outline a realistic phase two roadmap.`,
              expectedResponseType: `Boundary-setting response (3-4 sentences).`,
              evaluationCriteria: `Clear boundary setting, professional empathy, and proactive milestone solution.`,
              estimatedMinutes: 5,
              difficulty: "Advanced",
              dialogueHistory: [
                {
                  speaker: "David (Enterprise Client Director)",
                  text: "We really need these three additional CRM integrations delivered in Phase 1 next month, without pushing back our launch date.",
                },
              ],
              targetVocabulary: ["Phase 1 baseline stability", "Protect launch date", "Phase 2 milestone"],
              speechPrompt: `State your boundary clearly and walk through the phased timeline alternative.`,
            }),
            expectedStructure: `Clear boundary acknowledgment, risk explanation, and phased roadmap alternative.`,
          },
        ],
      },
    ];
  }

  if (isPresentation) {
    return [
      {
        competencyDescription: `Executive synthesis and core message framing`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "contextual_response",
              objective: `Deliver a high-level briefing to executive stakeholders with clear decision implications`,
              context: `Quarterly engineering update to executive leadership and department vice presidents.`,
              scenario: `You need to communicate that a critical project will launch two weeks later than scheduled due to a security hardening audit. Brief executive leadership with composure.`,
              instructions: `Lead with the core headline, provide the safety/business rationale, and share the revised timeline and mitigation plan.`,
              expectedResponseType: `Executive briefing summary (3-4 sentences).`,
              evaluationCriteria: `Concise headline delivery, executive composure, and clear ownership of the timeline.`,
              estimatedMinutes: 4,
              difficulty: "Foundational",
              targetVocabulary: ["Bottom-line up front", "Proactive security audit", "Revised target launch", "Mitigation plan"],
              speechPrompt: `Deliver your executive headline briefing aloud. Keep your delivery steady and direct.`,
            }),
            expectedStructure: `Bottom-line up front (BLUF) headline, rationale, and concrete timeline mitigation.`,
          },
        ],
      },
      {
        competencyDescription: `Handling executive pushback and high-pressure Q&A`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "conversation_practice",
              objective: `Respond calmly to challenging executive inquiry regarding resource allocation`,
              context: `Q&A session following a strategic budget and roadmap presentation.`,
              scenario: `The CFO asks whether the additional security audit was avoidable and if the delay impacts quarterly revenue. Address the concern directly and transparently.`,
              instructions: `Directly address the question, validate the fiscal concern, clarify that core revenue commitments remain intact, and invite a follow-up briefing.`,
              expectedResponseType: `Composed executive response (2-3 sentences).`,
              evaluationCriteria: `Direct answers without evasion, fiscal awareness, and professional confidence.`,
              estimatedMinutes: 5,
              difficulty: "Advanced",
              dialogueHistory: [
                {
                  speaker: "Sarah (Chief Financial Officer)",
                  text: "Was this audit delay foreseeable, and does shifting this launch by two weeks endanger our Q4 revenue target?",
                },
              ],
              targetVocabulary: ["Direct answer", "Fiscal impact analysis", "Q4 commitments remain intact"],
              speechPrompt: `Respond directly to the CFO's question with transparency and composure.`,
            }),
            expectedStructure: `Direct answer, revenue context clarification, and proactive follow-up offer.`,
          },
        ],
      },
    ];
  }

  // General natural-language communication goal
  if (startingLevel === "fresher") {
    return [
      {
        competencyDescription: `Contextual framing and intentional message delivery in ${language}`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "contextual_response",
              objective: `Express your primary idea with clarity, purpose, and appropriate register in ${language}`,
              context: `Real-world interpersonal workplace situation related to: "${goal}".`,
              scenario: `You need to communicate an important update or perspective to a colleague regarding: "${goal}". Frame your message so the listener understands the context immediately.`,
              instructions: `State your message in ${language}. Ensure you introduce the topic clearly, explain the key reason, and invite an open response.`,
              expectedResponseType: `Clear, structured communication in ${language} (2-4 sentences).`,
              evaluationCriteria: `Clarity of purpose, conversational flow, and appropriate professional tone in ${language}.`,
              estimatedMinutes: 3,
              difficulty: "Foundational",
              targetVocabulary: [`Introduction in ${language}`, `Core justification`, `Open collaborative check`],
              speechPrompt: `Deliver your message aloud in ${language}. Focus on natural flow and clarity.`,
            }),
            expectedStructure: `Context introduction, core proposition, and collaborative closing in ${language}.`,
          },
        ],
      },
      {
        competencyDescription: `Responsive dialogue and constructive resolution in ${language}`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "conversation_practice",
              objective: `Navigate follow-up discussion, clarification, and collaborative agreement in ${language}`,
              context: `Interactive dialogue requiring empathy and clear alignment around: "${goal}".`,
              scenario: `Your counterpart has asked for more detail or expressed uncertainty about the plan. Respond thoughtfully to build shared consensus.`,
              instructions: `Address their perspective directly in ${language}, offer concrete clarification, and propose a joint next step.`,
              expectedResponseType: `Thoughtful conversational response in ${language} (2-3 sentences).`,
              evaluationCriteria: `Empathetic active listening, precision of explanation, and constructive forward motion.`,
              estimatedMinutes: 4,
              difficulty: "Intermediate",
              dialogueHistory: [
                {
                  speaker: "Colleague",
                  text: `I understand the high-level intent, but how exactly are we going to execute this without conflicting with other priorities?`,
                },
              ],
              targetVocabulary: [`Acknowledge viewpoint`, `Concrete clarification`, `Joint next step`],
              speechPrompt: `Respond to your colleague aloud with empathy and practical clarity.`,
            }),
            expectedStructure: `Validation of counterpart perspective, clear clarifying detail, and shared next action.`,
          },
        ],
      },
    ];
  } else if (startingLevel === "intermediate") {
    return [
      {
        competencyDescription: `Diagnostic Assessment: Intermediate Situational Communication in ${language}`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "contextual_response",
              objective: `Diagnostic Assessment: Express your primary idea with clarity, purpose, and appropriate register in ${language}`,
              context: `Intermediate diagnostic assessment for situational communication related to: "${goal}".`,
              scenario: `Demonstrate your intermediate communication skills. Present your update clearly, justify the core rationale, and invite collaborative alignment regarding: "${goal}".`,
              instructions: `Deliver your message in ${language} with clear contextual framing, grammatical accuracy, and professional tone.`,
              expectedResponseType: `Clear, structured communication in ${language} (2-4 sentences).`,
              evaluationCriteria: `Clarity of purpose, conversational flow, and appropriate professional tone in ${language}.`,
              estimatedMinutes: 3,
              difficulty: "Intermediate",
              targetVocabulary: [`Introduction in ${language}`, `Core justification`, `Open collaborative check`],
              speechPrompt: `Deliver your diagnostic message aloud in ${language}.`,
            }),
            expectedStructure: `Context introduction, core proposition, and collaborative closing in ${language}.`,
          },
        ],
      },
      {
        competencyDescription: `Responsive dialogue and constructive resolution in ${language}`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "conversation_practice",
              objective: `Navigate follow-up discussion, clarification, and collaborative agreement in ${language}`,
              context: `Interactive dialogue requiring empathy and clear alignment around: "${goal}".`,
              scenario: `Your counterpart has asked for more detail or expressed uncertainty about the plan. Respond thoughtfully to build shared consensus.`,
              instructions: `Address their perspective directly in ${language}, offer concrete clarification, and propose a joint next step.`,
              expectedResponseType: `Thoughtful conversational response in ${language} (2-3 sentences).`,
              evaluationCriteria: `Empathetic active listening, precision of explanation, and constructive forward motion.`,
              estimatedMinutes: 4,
              difficulty: "Intermediate",
              dialogueHistory: [
                {
                  speaker: "Colleague",
                  text: `I understand the high-level intent, but how exactly are we going to execute this without conflicting with other priorities?`,
                },
              ],
              targetVocabulary: [`Acknowledge viewpoint`, `Concrete clarification`, `Joint next step`],
              speechPrompt: `Respond to your colleague aloud with empathy and practical clarity.`,
            }),
            expectedStructure: `Validation of counterpart perspective, clear clarifying detail, and shared next action.`,
          },
        ],
      },
    ];
  } else {
    return [
      {
        competencyDescription: `Diagnostic Assessment: Advanced Situational Fluency & Diplomatic Nuance in ${language}`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "conversation_practice",
              objective: `Diagnostic Assessment: Handle complex stakeholder resistance and high-stakes negotiation in ${language}`,
              context: `Advanced diagnostic assessment for strategic communication and leadership related to: "${goal}".`,
              scenario: `An executive stakeholder challenges the strategic direction of: "${goal}". Defend the core proposition with diplomatic poise, provide objective risk mitigation data, and propose an aligned consensus.`,
              instructions: `Deliver a nuanced, sophisticated response in ${language} demonstrating strategic empathy, executive presence, and persuasive clarity.`,
              expectedResponseType: `Nuanced executive strategic response in ${language} (3-4 sentences).`,
              evaluationCriteria: `Diplomatic nuance, sophisticated vocabulary, executive composure, and constructive closure.`,
              estimatedMinutes: 5,
              difficulty: "Advanced",
              dialogueHistory: [
                {
                  speaker: "Executive Stakeholder",
                  text: `This approach carries significant execution risk. Why shouldn't we revert to the conventional process?`,
                },
              ],
              targetVocabulary: [`Strategic risk mitigation`, `Durable value creation`, `Aligned milestone roadmap`],
              speechPrompt: `Deliver your executive diagnostic defense aloud in ${language} with composure and conviction.`,
            }),
            expectedStructure: `Strategic validation, objective counter-argument, and aligned milestone proposal in ${language}.`,
          },
        ],
      },
      {
        competencyDescription: `High-Stakes Leadership, Conflict Resolution & Organizational Alignment in ${language}`,
        exercises: [
          {
            scenarioPrompt: encodePrompt({
              exerciseType: "communication_refinement",
              objective: `Refine executive communication under pressure to achieve consensus in ${language}`,
              context: `High-stakes strategic council alignment.`,
              scenario: `Transform an uncooperative or defensive refusal into an assertive, risk-focused executive proposal.`,
              instructions: `Set firm boundaries while preserving executive trust and proposing actionable milestones.`,
              expectedResponseType: `Assertive, diplomatic leadership proposal in ${language} (3-4 sentences).`,
              evaluationCriteria: `Diplomatic firmness, strategic vision, and collaborative milestone resolution.`,
              estimatedMinutes: 5,
              difficulty: "Advanced",
              draftToRefine: `No, this will not work and we cannot change the schedule.`,
              targetVocabulary: [`Shared strategic objectives`, `Measured phased execution`, `Protecting institutional trust`],
              speechPrompt: `Deliver your refined executive leadership response aloud in ${language}.`,
            }),
            expectedStructure: `Executive boundary setting, shared value defense, and phased milestone roadmap in ${language}.`,
          },
        ],
      },
    ];
  }
}
