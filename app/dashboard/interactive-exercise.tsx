"use client";

import { useState, useRef, useTransition } from "react";
import type { DashboardEvaluationRecord, DashboardExerciseRecord } from "@/src/server/goals/repository";
import { parseExerciseDetails, type ParsedExerciseDetails } from "@/src/server/goals/curriculum";
import { parseStoredEvaluationFeedback } from "@/src/server/evaluation/boundary";
import { submitPracticeEvaluation } from "./actions";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

function scoreStatus(score: string): "mastered" | "needs_work" | "unclassified" {
  const normalized = score.trim().toLowerCase();
  if (normalized === "mastered") return "mastered";
  if (normalized === "needs_work") return "needs_work";
  return "unclassified";
}

function scoreLabel(score: string): string {
  return score.replaceAll("_", " ");
}

export default function InteractiveExerciseCard({
  exercise,
  index,
  evaluations,
}: {
  exercise: DashboardExerciseRecord;
  index: number;
  evaluations: DashboardEvaluationRecord[];
}) {
  const details: ParsedExerciseDetails = parseExerciseDetails(exercise.scenarioPrompt, exercise.expectedStructure);
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceToggle = () => {
    if (typeof window === "undefined") return;

    const speechWin = window as unknown as SpeechWindow;
    const SpeechRecognition = speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please type your response directly.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = details.scenario.includes("Spanish") || details.instructions.includes("Spanish") ? "es-ES" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setResponse((prev) => {
          if (!prev.trim()) return transcript;
          return `${prev.trim()} ${transcript}`.trim();
        });
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError("Microphone access was denied. Please allow microphone permissions or type your response directly.");
        } else if (event.error !== "no-speech") {
          setSpeechError(`Speech recognition notice: ${event.error}. You can type directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError("Unable to initiate speech recognition. Please type your response directly.");
    }
  };

  const insertChip = (text: string) => {
    setResponse((prev) => (prev ? `${prev} ${text}` : text));
    textareaRef.current?.focus();
  };

  const loadDraft = () => {
    if (details.draftToRefine) {
      setResponse(details.draftToRefine);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!response.trim() || isPending) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const formData = new FormData();
    formData.append("response", response.trim());

    startTransition(async () => {
      try {
        await submitPracticeEvaluation(exercise.id, formData);
        setResponse("");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to submit response.";
        setSpeechError(message);
      }
    });
  };

  return (
    <article className="dashboard-card exercise-card" id={`exercise-${exercise.id}`}>
      {/* Exercise Header */}
      <div className="exercise-badge-row">
        <span className="exercise-number-pill">Exercise {index + 1}</span>
        <span className="exercise-objective-pill">{details.objective}</span>
        <span className="exercise-difficulty-pill">{details.difficulty} &middot; {details.estimatedMinutes} min</span>
      </div>

      <div className="exercise-spec">
        <div className="exercise-spec-item">
          <span className="spec-label">Real-world context</span>
          <p className="spec-text">{details.context}</p>
        </div>

        {/* Dialogue Card for Conversation Practice */}
        {details.dialogueHistory && details.dialogueHistory.length > 0 && (
          <div className="dialogue-card" aria-label="Simulated conversational counterpart">
            <span className="spec-label">Teammate / Counterpart</span>
            <div className="dialogue-bubbles">
              {details.dialogueHistory.map((d, dIdx) => (
                <div key={dIdx} className="dialogue-bubble">
                  <strong className="speaker-name">{d.speaker}:</strong>
                  <p className="speaker-text">&ldquo;{d.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="exercise-spec-item">
          <span className="spec-label">Scenario / Prompt</span>
          <h3 className="spec-scenario">{details.scenario}</h3>
        </div>

        <div className="exercise-spec-item">
          <span className="spec-label">Instructions</span>
          <p className="spec-text">{details.instructions}</p>
        </div>

        {/* Refinement Draft Box */}
        {details.draftToRefine && (
          <div className="refinement-box">
            <div className="refinement-header">
              <span className="spec-label">Rough Draft to Refine</span>
              <button type="button" onClick={loadDraft} className="button button-small button-secondary">
                📋 Load draft into editor
              </button>
            </div>
            <blockquote className="draft-quote">&ldquo;{details.draftToRefine}&rdquo;</blockquote>
          </div>
        )}

        {/* Target Vocabulary / Phrase Chips */}
        {details.targetVocabulary && details.targetVocabulary.length > 0 && (
          <div className="vocabulary-chips-container">
            <span className="spec-label">Suggested Phrasing &amp; Concepts (Click to insert):</span>
            <div className="vocabulary-chips">
              {details.targetVocabulary.map((chip, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  className="vocab-chip-button"
                  onClick={() => insertChip(chip)}
                  title={`Insert "${chip}" into your response`}
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="exercise-spec-row">
          <div className="exercise-spec-item">
            <span className="spec-label">Expected response type</span>
            <p className="spec-text">{details.expectedResponseType}</p>
          </div>
          <div className="exercise-spec-item">
            <span className="spec-label">Evaluation criteria</span>
            <p className="spec-text">{details.evaluationCriteria}</p>
          </div>
        </div>
      </div>

      {/* Interactive Response Form */}
      <form onSubmit={handleSubmit} className="practice-form">
        <div className="form-header-row">
          <label htmlFor={`response-${exercise.id}`}>Your communication response</label>
          <div className="input-tools-row">
            <button
              type="button"
              className={`voice-mic-button ${isListening ? "mic-recording" : ""}`}
              onClick={handleVoiceToggle}
              title={isListening ? "Stop voice recording" : "Record voice input via microphone"}
              aria-label={isListening ? "Stop voice recording" : "Speak response using microphone"}
            >
              <span className="mic-icon" aria-hidden="true">{isListening ? "⏹" : "🎙️"}</span>
              <span>{isListening ? "Listening... (Click to stop)" : "Speak answer (Mic)"}</span>
            </button>
          </div>
        </div>

        {speechError && (
          <div className="speech-error-notice" role="alert">
            <p>{speechError}</p>
          </div>
        )}

        {isListening && (
          <div className="listening-indicator" aria-live="assertive">
            <span className="pulsing-dot" aria-hidden="true" />
            <p>Listening to your voice... Speak naturally in the target language.</p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          id={`response-${exercise.id}`}
          name="response"
          required
          rows={4}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type or speak your response in natural language..."
          disabled={isPending}
        />

        <div className="form-actions-row">
          <span className="word-count-indicator">
            {response.trim().split(/\s+/).filter(Boolean).length} words
          </span>
          <button type="submit" className="button button-primary" disabled={isPending || !response.trim()}>
            {isPending ? "Evaluating communication..." : "Submit response for evaluation"}
          </button>
        </div>
      </form>

      {/* Recorded Evaluations */}
      <div className="recorded-evaluations" aria-live="polite">
        <h4>Recorded evaluations ({evaluations.length})</h4>
        {evaluations.length === 0 ? (
          <p className="empty-message">No evaluation recorded yet for this exercise. Submit your response to establish a baseline.</p>
        ) : (
          <div className="evaluation-list">
            {evaluations.map((evaluation) => {
              const meta = parseStoredEvaluationFeedback(evaluation.feedback || "");
              const isFallback = (evaluation.evaluationSource ?? meta.source) === "fallback";

              return (
                <div className="evaluation-card" key={evaluation.id}>
                  <div className="evaluation-header">
                    <span className={`status-pill status-${scoreStatus(evaluation.score)}`}>
                      {scoreLabel(evaluation.score)}
                    </span>
                    <span className="evaluation-source-badge">
                      {isFallback ? "Deterministic Fallback · Non-AI" : "Configured Provider"}
                    </span>
                  </div>

                  <p className="evaluation-response">&ldquo;{evaluation.userResponse}&rdquo;</p>

                  <div className="evaluation-feedback-body">
                    {meta.strengths && (
                      <div className="feedback-section feedback-strengths">
                        <strong>What you did well:</strong>
                        <p>{meta.strengths}</p>
                      </div>
                    )}

                    {meta.areasToRefine && (
                      <div className="feedback-section feedback-areas">
                        <strong>Areas to improve:</strong>
                        <p>{meta.areasToRefine}</p>
                      </div>
                    )}

                    {meta.nextAction && (
                      <div className="feedback-section feedback-action">
                        <strong>Actionable recommendation:</strong>
                        <p>{meta.nextAction}</p>
                      </div>
                    )}

                    {meta.criteriaEvidence.length > 0 && (
                      <div className="feedback-criteria">
                        <strong>Criteria breakdown:</strong>
                        <ul>
                          {meta.criteriaEvidence.map((crit, cIdx) => (
                            <li key={cIdx}>{crit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isFallback && (
                      <p className="evaluation-limitation-note">
                        <em>Note: Evaluated using deterministic communicative analysis (checks structural completeness, context relevance, and substantive detail; external AI provider is not configured).</em>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
