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
  if (lower.includes("spanish") || lower.includes("español")) return "Spanish";
  if (lower.includes("french") || lower.includes("français")) return "French";
  if (lower.includes("german") || lower.includes("deutsch")) return "German";
  if (lower.includes("japanese") || lower.includes("日本語")) return "Japanese";
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

export function generateGoalCurriculum(rawGoal: string): StructuredCompetencyPlan[] {
  const goal = rawGoal.trim();
  const lower = goal.toLowerCase();
  const language = detectTargetLanguage(goal);
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

  if (isTechOrStandup) {
    const langSuffix = isSpanish ? " in Spanish" : ` in ${language}`;

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
}
