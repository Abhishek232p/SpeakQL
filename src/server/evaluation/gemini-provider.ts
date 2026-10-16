import type { EvaluationProvider, EvaluationRequest } from "./contracts";
import { EVALUATION_SCHEMA_VERSION } from "./contracts";

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

const DEFAULT_MODEL = "gemini-flash-latest";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Gemini Evaluation Provider Adapter.
 * 
 * Communicates with Google Gemini via standard fetch. Does not import external
 * heavyweight SDKs. Bounded by AbortSignal from the evaluation boundary.
 * Never throws uncaught errors to the application layer.
 */
export class GeminiEvaluationProvider implements EvaluationProvider {
  public readonly id = "google-gemini";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  public constructor(options: GeminiProviderOptions = {}) {
    this.apiKey = options.apiKey !== undefined
      ? options.apiKey.trim()
      : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    this.model = options.model?.trim() || DEFAULT_MODEL;
    this.baseUrl = options.baseUrl || `${GEMINI_API_URL}/${this.model}:generateContent`;
  }

  public isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  public async evaluate(request: EvaluationRequest, signal: AbortSignal): Promise<unknown> {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key is not configured.");
    }

    const systemPrompt = `You are the SpeakQL AI Communication Evaluator.
Evaluate the learner's communication practice response against the provided scenario prompt and expected structure.
Assess according to three criteria:
1. context: Did the response engage the scenario context and key terminology?
2. structure: Did the response use clear communication structure, punctuation, and phrasing?
3. specificity: Did the response provide concrete detail and actionable substance?

CRITICAL: Score MUST be "mastered" if all 3 criteria passed. Score MUST be "needs_work" if ANY criterion failed.
Never assign arbitrary scores.

Output valid JSON matching this schema:
{
  "schemaVersion": "${EVALUATION_SCHEMA_VERSION}",
  "score": "mastered" | "needs_work",
  "feedback": "Concise summary feedback (max 2000 chars)",
  "criteria": [
    { "id": "context", "label": "Context signal", "passed": boolean, "evidence": "short explanation" },
    { "id": "structure", "label": "Clear structure", "passed": boolean, "evidence": "short explanation" },
    { "id": "specificity", "label": "Specific detail", "passed": boolean, "evidence": "short explanation" }
  ],
  "mistakes": ["specific mistake if any"],
  "nextAction": "Concrete next pedagogical step",
  "usage": {
    "inputTokens": number,
    "outputTokens": number,
    "costUsd": number
  }
}`;

    const userContent = `Scenario: ${request.scenarioPrompt}
Expected Structure: ${request.expectedStructure}
Learner Response: ${request.response}`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userContent }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    };

    const url = `${this.baseUrl}?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      throw new Error(`Gemini API HTTP ${response.status}: ${errorText.slice(0, 120)}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini response contained no candidate text.");
    }

    const parsed = JSON.parse(text);

    // Ensure usage fields exist if provider omitted them
    if (!parsed.usage || typeof parsed.usage !== "object") {
      const inTokens = data.usageMetadata?.promptTokenCount ?? Math.ceil(userContent.length / 4);
      const outTokens = data.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
      parsed.usage = {
        inputTokens: inTokens,
        outputTokens: outTokens,
        costUsd: (inTokens * 0.075 + outTokens * 0.3) / 1_000_000,
      };
    }

    return parsed;
  }
}

/**
 * Creates an evaluation provider from environment variables if present.
 * Fails closed and returns undefined if credentials are not configured.
 */
export function createConfiguredEvaluationProvider(): EvaluationProvider | undefined {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey?.trim()) return undefined;
  return new GeminiEvaluationProvider({ apiKey: apiKey.trim() });
}
