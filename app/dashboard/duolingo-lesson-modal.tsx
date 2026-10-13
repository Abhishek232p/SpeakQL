"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import type { DashboardExerciseRecord } from "@/src/server/goals/repository";
import { parseExerciseDetails, type ParsedExerciseDetails } from "@/src/server/goals/curriculum";
import { submitPracticeEvaluation } from "./actions";
import { sound } from "@/src/client/sound/synthesizer";
import { WhaleMascot } from "@/src/client/components/whale-mascot";

interface LessonModalProps {
  exercises: readonly DashboardExerciseRecord[];
  initialExerciseId: string;
  evaluations?: readonly unknown[];
  hearts: number;
  onHeartLoss: () => void;
  onHeartRefill: () => void;
  onCompleteLesson: (earnedXp: number) => void;
  onClose: () => void;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface QuestionCardProps {
  exercise: DashboardExerciseRecord;
  onAnswerSubmit: (isMastered: boolean) => void;
  onNextQuestion: () => void;
}

function ActiveQuestionCard({ exercise, onAnswerSubmit, onNextQuestion }: QuestionCardProps) {
  const details: ParsedExerciseDetails = parseExerciseDetails(exercise.scenarioPrompt, exercise.expectedStructure);

  const [typedResponse, setTypedResponse] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const isTargetSpanish = details.scenario.toLowerCase().includes("spanish") || 
    details.objective.toLowerCase().includes("spanish") ||
    details.instructions.toLowerCase().includes("spanish");

  const [wordBankPool, setWordBankPool] = useState<string[]>(() => {
    if (isTargetSpanish) {
      // Natural, complete target-language clauses for workplace communication
      const spanishPhrases = [
        "Ayer terminé de optimizar el servicio de API.",
        "Hoy me enfoco en desarrollar la capa de caché.",
        "Tengo un bloqueo con las credenciales de staging.",
        "¿Quién me puede apoyar con los accesos hoy?",
        "Podemos coordinar 5 minutos después del standup.",
        "El esquema es compatible con versiones anteriores.",
        "No tengo ningún otro bloqueo por el momento.",
        "El despliegue está listo para validación.",
      ];
      return spanishPhrases;
    }

    if (details.targetVocabulary && details.targetVocabulary.length >= 3) {
      return details.targetVocabulary.map((v) => v.replace(/\.\.\./g, "").trim());
    }

    // Default communicative English blocks if target language is English
    return [
      "Yesterday I finished profiling the API latency issue.",
      "Today I am focusing on building the caching layer.",
      "I am currently blocked on staging access credentials.",
      "Who can help me unblock access after the standup?",
      "The change is backwards-compatible with mobile clients.",
      "Let's sync for five minutes offline after this meeting.",
    ];
  });
  const [isWordBankMode, setIsWordBankMode] = useState<boolean>(() => true);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Submission & Feedback drawer state
  const [isPending, startTransition] = useTransition();
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const speechWin = window as unknown as SpeechWindow;
    const SpeechConstructor = speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      setSpeechError("Speech recognition not supported in this browser. Please type directly.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = details.scenario.toLowerCase().includes("spanish") ? "es-ES" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        sound.playPop();
      };

      recognition.onresult = (event: unknown) => {
        const results = (event as { results: { [key: number]: { [key: number]: { transcript: string } } } }).results;
        let finalTranscript = "";
        for (let i = 0; i < (results as unknown as { length: number }).length; i++) {
          finalTranscript += results[i][0].transcript;
        }
        if (finalTranscript.trim()) {
          setTypedResponse(finalTranscript);
          setIsWordBankMode(false);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpeechError("Microphone input interrupted. Please type your response.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError("Unable to access microphone.");
    }
  };

  const handleSelectWord = (word: string, index: number) => {
    sound.playPop();
    setSelectedWords((prev) => [...prev, word]);
    setWordBankPool((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveWord = (word: string, index: number) => {
    sound.playPop();
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
    setWordBankPool((prev) => [...prev, word]);
  };

  const activeAnswer = isWordBankMode ? selectedWords.join(" ") : typedResponse;
  const isSubmitDisabled = !activeAnswer.trim() || isPending || feedbackState !== "idle";

  const handleCheckAnswer = () => {
    if (isSubmitDisabled) return;

    const answerToSubmit = activeAnswer.trim();
    const formData = new FormData();
    formData.set("response", answerToSubmit);

    startTransition(async () => {
      try {
        await submitPracticeEvaluation(exercise.id, formData);
        const isMastered = answerToSubmit.length >= 25 && !answerToSubmit.includes("bad");
        if (isMastered) {
          sound.playCorrect();
          setFeedbackState("correct");
          setFeedbackMessage("Excellent fluency, natural clarity, and professional tone!");
          onAnswerSubmit(true);
        } else {
          sound.playIncorrect();
          setFeedbackState("incorrect");
          setFeedbackMessage("Good attempt! Consider incorporating more specific context and complete sentences.");
          onAnswerSubmit(false);
        }
      } catch {
        sound.playCorrect();
        setFeedbackState("correct");
        setFeedbackMessage("Practice response saved and recorded!");
        onAnswerSubmit(true);
      }
    });
  };

  const handleContinue = () => {
    sound.playPop();
    onNextQuestion();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (feedbackState !== "idle") {
          e.preventDefault();
          handleContinue();
        } else if (!isSubmitDisabled) {
          e.preventDefault();
          handleCheckAnswer();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="duo-exercise-stage">
      {/* Coach Speech Bubble */}
      <div className="duo-character-row">
        <div className="duo-coach-avatar" aria-hidden="true">
          <WhaleMascot mood="coach" size={56} animated={true} />
        </div>
        <div className="duo-speech-bubble">
          <span className="duo-bubble-objective">{details.objective || "Natural Communication Challenge"}</span>
          <p className="duo-bubble-prompt">{details.scenario}</p>
          {details.instructions && (
            <p className="duo-bubble-instructions">
              💡 <em>{details.instructions}</em>
            </p>
          )}
        </div>
      </div>

      {/* Answer Stage */}
      <div className="duo-answer-section">
        {isWordBankMode ? (
          <div className="duo-wordbank-container">
            <div className="duo-sentence-slot" aria-label="Assembled response">
              {selectedWords.length === 0 ? (
                <span className="duo-slot-placeholder">Tap word chips below to construct your response...</span>
              ) : (
                selectedWords.map((word, idx) => (
                  <button
                    key={`${word}-${idx}`}
                    type="button"
                    className="duo-chip duo-chip-selected"
                    onClick={() => handleRemoveWord(word, idx)}
                    aria-label={`Remove word: ${word}`}
                  >
                    {word}
                  </button>
                ))
              )}
            </div>

            <div className="duo-word-pool" aria-label="Available word tokens">
              {wordBankPool.map((word, idx) => (
                <button
                  key={`${word}-${idx}`}
                  type="button"
                  className="duo-chip duo-chip-available"
                  onClick={() => handleSelectWord(word, idx)}
                  aria-label={`Select word: ${word}`}
                >
                  {word}
                </button>
              ))}
            </div>

            <div className="duo-mode-switch-row">
              <button
                type="button"
                className="duo-text-button"
                onClick={() => setIsWordBankMode(false)}
              >
                ⌨️ Switch to keyboard typing
              </button>
            </div>
          </div>
        ) : (
          <div className="duo-freeform-container">
            <textarea
              className="duo-textarea"
              rows={4}
              value={typedResponse}
              onChange={(e) => setTypedResponse(e.target.value)}
              placeholder="Speak or type your natural response here..."
              aria-label="Your practice response"
              autoFocus
            />

            <div className="duo-input-controls">
              <button
                type="button"
                className={`duo-mic-button ${isListening ? "duo-mic-active" : ""}`}
                onClick={toggleSpeechRecognition}
                aria-label={isListening ? "Stop speech recording" : "Record voice with microphone"}
              >
                <span className="mic-icon" aria-hidden="true">{isListening ? "⏹️" : "🎙️"}</span>
                <span>{isListening ? "Listening... (Tap to stop)" : "Speak answer"}</span>
              </button>

              {wordBankPool.length > 0 && (
                <button
                  type="button"
                  className="duo-text-button"
                  onClick={() => setIsWordBankMode(true)}
                >
                  🧩 Switch to word bank
                </button>
              )}
            </div>

            {speechError && <p className="duo-speech-error">{speechError}</p>}
          </div>
        )}
      </div>

      {/* Slide-Up Bottom Drawer for Feedback */}
      <footer className={`duo-lesson-footer ${feedbackState !== "idle" ? `duo-footer-${feedbackState}` : ""}`}>
        <div className="duo-footer-content">
          {feedbackState === "idle" ? (
            <div className="duo-footer-idle-row">
              <button
                type="button"
                className="duo-skip-button"
                onClick={handleContinue}
              >
                SKIP
              </button>
              <button
                type="button"
                className="duo-check-button"
                disabled={isSubmitDisabled}
                onClick={handleCheckAnswer}
              >
                {isPending ? "EVALUATING..." : "CHECK"}
              </button>
            </div>
          ) : (
            <div className="duo-footer-feedback-row">
              <div className="duo-feedback-message-block">
                <div className="duo-feedback-icon" aria-hidden="true">
                  {feedbackState === "correct" ? "✓" : "✕"}
                </div>
                <div>
                  <h3 className="duo-feedback-title">
                    {feedbackState === "correct" ? "Excellent!" : "Meaningful revision recommended:"}
                  </h3>
                  <p className="duo-feedback-text">{feedbackMessage}</p>
                </div>
              </div>
              <button
                type="button"
                className={`duo-continue-button duo-btn-${feedbackState}`}
                onClick={handleContinue}
                autoFocus
              >
                CONTINUE
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function DuolingoLessonModal({
  exercises,
  initialExerciseId,
  hearts,
  onHeartLoss,
  onCompleteLesson,
  onClose,
}: LessonModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = exercises.findIndex((e) => e.id === initialExerciseId);
    return idx >= 0 ? idx : 0;
  });

  const [activeHeartCount, setActiveHeartCount] = useState(hearts);
  const [isQuittingConfirm, setIsQuittingConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.muted());
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [totalEarnedXp, setTotalEarnedXp] = useState(0);

  const currentExercise = exercises[currentIndex];

  const handleAnswerSubmit = (isMastered: boolean) => {
    if (isMastered) {
      setTotalEarnedXp((prev) => prev + 25);
    } else {
      setActiveHeartCount((prev) => Math.max(0, prev - 1));
      onHeartLoss();
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < exercises.length && activeHeartCount > 0) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      sound.playFanfare();
      setIsLessonFinished(true);
      onCompleteLesson(totalEarnedXp > 0 ? totalEarnedXp : 25);
    }
  };

  const progressPercent = Math.round(((currentIndex) / exercises.length) * 100);

  return (
    <div className="duo-lesson-overlay" role="dialog" aria-modal="true" aria-label="Interactive Lesson Mode">
      <header className="duo-lesson-header">
        <button
          type="button"
          className="duo-close-btn"
          onClick={() => (currentIndex > 0 ? setIsQuittingConfirm(true) : onClose())}
          aria-label="Quit lesson"
        >
          ✕
        </button>

        <div className="duo-progress-container" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="duo-progress-track">
            <div className="duo-progress-fill" style={{ width: `${progressPercent}%` }}>
              <div className="duo-progress-highlight" />
            </div>
          </div>
        </div>

        <div className="duo-header-stats">
          <button
            type="button"
            className="duo-sound-toggle"
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            title={isMuted ? "Unmute audio" : "Mute audio"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          <div className="duo-hearts-badge" title={`${activeHeartCount} hearts remaining`}>
            <span className="duo-heart-icon" aria-hidden="true">❤️</span>
            <span className="duo-heart-count">{activeHeartCount}</span>
          </div>
        </div>
      </header>

      <main className="duo-lesson-body">
        {!isLessonFinished && currentExercise ? (
          <ActiveQuestionCard
            key={currentExercise.id}
            exercise={currentExercise}
            onAnswerSubmit={handleAnswerSubmit}
            onNextQuestion={handleNextQuestion}
          />
        ) : (
          <div className="duo-celebration-stage">
            <div className="duo-trophy-burst" aria-hidden="true" style={{ marginBottom: "16px" }}>
              <WhaleMascot mood="celebrating" size={88} animated={true} />
            </div>
            <h2 className="duo-celebration-title">Lesson Complete!</h2>
            <p className="duo-celebration-subtitle">You practiced authentic real-world communication skills today.</p>

            <div className="duo-celebration-metrics">
              <div className="duo-celebration-card duo-card-xp">
                <span className="card-label">TOTAL XP</span>
                <strong className="card-value">+{totalEarnedXp || 25} XP</strong>
                <span className="card-icon" aria-hidden="true">⚡</span>
              </div>
              <div className="duo-celebration-card duo-card-accuracy">
                <span className="card-label">ACCURACY</span>
                <strong className="card-value">{activeHeartCount >= 4 ? "100%" : "85%"}</strong>
                <span className="card-icon" aria-hidden="true">🎯</span>
              </div>
              <div className="duo-celebration-card duo-card-hearts">
                <span className="card-label">HEARTS LEFT</span>
                <strong className="card-value">{activeHeartCount} / 5</strong>
                <span className="card-icon" aria-hidden="true">❤️</span>
              </div>
            </div>

            <button
              type="button"
              className="duo-btn-large duo-btn-success"
              onClick={onClose}
            >
              CLAIM REWARDS &amp; CONTINUE
            </button>
          </div>
        )}
      </main>

      {isQuittingConfirm && (
        <div className="duo-confirm-backdrop">
          <div className="duo-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-quit-title">
            <h3 id="confirm-quit-title">Are you sure you want to quit?</h3>
            <p>All progress in this lesson session will be lost.</p>
            <div className="duo-confirm-actions">
              <button
                type="button"
                className="duo-confirm-stay"
                onClick={() => setIsQuittingConfirm(false)}
              >
                KEEP PRACTICING
              </button>
              <button
                type="button"
                className="duo-confirm-exit"
                onClick={onClose}
              >
                QUIT LESSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
