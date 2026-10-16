"use client";

import { useState } from "react";
import { WhaleMascot } from "@/src/client/components/whale-mascot";
import { sound } from "@/src/client/sound/synthesizer";

interface ConversationTurn {
  id: string;
  speaker: "coach" | "learner";
  message: string;
  feedback?: string;
  timestamp: string;
}

function evaluateAndReply(learnerText: string): { reply: string; feedback: string } {
  const lower = learnerText.toLowerCase();

  const mentionsPast = lower.includes("ayer") || lower.includes("terminé") || lower.includes("termine") || lower.includes("completé") || lower.includes("complete") || lower.includes("hice") || lower.includes("resolví") || lower.includes("optimiz");
  const mentionsPresent = lower.includes("hoy") || lower.includes("trabajo") || lower.includes("enfoco") || lower.includes("voy a") || lower.includes("empez");
  const mentionsBlocker = lower.includes("bloqueo") || lower.includes("credencial") || lower.includes("acceso") || lower.includes("staging") || lower.includes("ayuda") || lower.includes("dependencia");

  let reply = "";
  let feedback = "";

  if (mentionsPast && mentionsPresent && mentionsBlocker) {
    reply = "¡Excelente reporte de standup! Cubriste trabajo terminado, foco actual y el bloqueo con claridad. Respecto al acceso a staging: ¿ya creaste el ticket con infraestructura o necesitas que lo revise contigo después del sync?";
    feedback = "Estructura ejemplar de 3 partes (avance, prioridad actual, bloqueo). Registro profesional y directo.";
  } else if (mentionsBlocker) {
    reply = "Comprendo el bloqueo con staging. Los accesos son prioritarios para validar la integración. ¿Quién es el lead de DevOps en este sprint para etiquetarlo de inmediato?";
    feedback = "Muy buena identificación del bloqueo. Para la próxima actualización, añade también un breve estado de tu trabajo completado ayer.";
  } else if (mentionsPresent) {
    reply = "Suena como una excelente prioridad técnica para hoy. ¿Tienes todo lo necesario para avanzar o prevés alguna dependencia con otros servicios?";
    feedback = "Buen foco en la meta de hoy. Recuerda mencionar siempre si tienes algún impedimento técnico en el standup.";
  } else if (mentionsPast) {
    reply = "Gran avance técnico con el servicio. ¿En qué componente te enfocarás hoy y hay algún bloqueo que el equipo deba conocer?";
    feedback = "Trabajo previo comunicado con éxito. Agrega tu plan para el día de hoy para dar visibilidad completa al equipo.";
  } else {
    reply = "Entendido tu mensaje. Para estructurarlo con el formato profesional de standup: ¿puedes resumir qué terminaste ayer, en qué trabajas hoy y si tienes algún bloqueo?";
    feedback = "Respuesta recibida. Sugerencia práctica: utiliza conectores como 'Ayer terminé...', 'Hoy me enfoco en...' y 'Tengo un bloqueo con...' para máxima fluidez.";
  }

  return { reply, feedback };
}

function speakUtterance(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface ConversationMentorViewProps {
  activeGoalDescription: string;
  onLaunchExercise?: (exerciseId: string) => void;
  availableExerciseId?: string;
}

export default function ConversationMentorView({
  activeGoalDescription,
  onLaunchExercise,
  availableExerciseId,
}: ConversationMentorViewProps) {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [turns, setTurns] = useState<ConversationTurn[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("speakql_conversation_history");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // keep default
        }
      }
    }
    return [
      {
        id: "turn_1",
        speaker: "coach",
        message: `¡Hola! Bienvenido a tu sesión de conversación. Hoy practicamos para tu objetivo: "${activeGoalDescription}". ¿Cómo describirías tus prioridades y avances recientes a tu equipo?`,
        timestamp: "Just now",
      },
    ];
  });

  const handleVoiceToggle = () => {
    sound.playPop();
    setSpeechError(null);

    if (typeof window === "undefined") return;
    const speechWin = window as unknown as SpeechWindow;
    const SpeechRecognitionClass = speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "es-ES";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setSpeechError("Microphone input error. Please try again or type below.");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      setSpeechError("Unable to access microphone.");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sound.playPop();
    const userMsg = inputText.trim();
    setInputText("");

    const newLearnerTurn: ConversationTurn = {
      id: `turn_${Date.now()}`,
      speaker: "learner",
      message: userMsg,
      timestamp: "Just now",
    };

    const { reply, feedback } = evaluateAndReply(userMsg);

    const coachResponseTurn: ConversationTurn = {
      id: `turn_${Date.now() + 1}`,
      speaker: "coach",
      message: reply,
      feedback,
      timestamp: "Just now",
    };

    const updated = [...turns, newLearnerTurn, coachResponseTurn];
    setTurns(updated);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("speakql_conversation_history", JSON.stringify(updated));
    }

    speakUtterance(reply);
    sound.playCorrect();
  };

  return (
    <div className="conversation-mentor-container">
      {/* 1. Header Card with AI / Evaluation Engine Status */}
      <div className="mentor-header-card">
        <div>
          <span className="mentor-ai-badge">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", display: "inline-block" }} />
            Interactive Language Mentor · Dialogue Studio
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "10px 0 6px", color: "#ffffff" }}>
            Natural Conversation Studio
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#c4b5fd" }}>
            Real-time conversational turns tailored to your communication context.
          </p>
        </div>

        {/* Status disclosure panel */}
        <div
          style={{
            background: "rgba(10, 14, 40, 0.7)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "14px",
            padding: "12px 18px",
            fontSize: "12px",
            color: "#c4b5fd",
            maxWidth: "280px",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#ffffff", display: "block", marginBottom: 2 }}>
            Evaluation Engine Status:
          </strong>
          Configured deterministic linguistic engine active (Rule-based Standup Rubric v1). All submissions receive instant structural feedback.
        </div>
      </div>

      {/* 2. Interactive Dialogue Exchange Window */}
      <div className="conversation-chat-box">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            minHeight: "320px",
            maxHeight: "520px",
            overflowY: "auto",
            paddingRight: "8px",
          }}
        >
          {turns.map((turn) => {
            const isCoach = turn.speaker === "coach";

            return isCoach ? (
              <div key={turn.id} className="chat-bubble-agent">
                <WhaleMascot mood="coach" size={46} animated={false} />
                <div className="agent-bubble-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                      Coach Whale 🐳
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => speakUtterance(turn.message)}
                        style={{
                          background: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid rgba(56, 189, 248, 0.35)",
                          borderRadius: "6px",
                          color: "#38bdf8",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "2px 8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        aria-label="Listen to pronunciation"
                      >
                        🔊 Escuchar
                      </button>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{turn.timestamp}</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.55 }}>{turn.message}</p>
                  {turn.feedback && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: "1px solid rgba(168, 85, 247, 0.3)",
                        fontSize: "12px",
                        color: "#a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>✓</span> {turn.feedback}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={turn.id} className="chat-bubble-user">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(56, 189, 248, 0.2)",
                    border: "2px solid #38bdf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  👤
                </div>
                <div className="user-bubble-body">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#ffffff", textTransform: "uppercase" }}>
                      You
                    </span>
                    <span style={{ fontSize: "10px", color: "#e9d5ff" }}>{turn.timestamp}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.55 }}>{turn.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div
            style={{
              padding: "8px 14px",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              borderRadius: "10px",
              color: "#fb7185",
              fontSize: "12px",
            }}
          >
            {speechError}
          </div>
        )}

        {/* 3. Multi-Modal Response Composer */}
        <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your response in target language (or tap the mic)..."
              style={{
                flex: 1,
                padding: "14px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                background: "rgba(22, 28, 70, 0.8)",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`duo-mic-button ${isRecording ? "duo-mic-active" : ""}`}
              title="Voice recording (Web Speech API)"
            >
              <span>{isRecording ? "🔴" : "🎙️"}</span>
              <span style={{ fontSize: "12px" }}>{isRecording ? "Listening..." : "Speak"}</span>
            </button>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="button button-primary"
              style={{
                borderRadius: "14px",
                padding: "14px 22px",
                fontSize: "14px",
                opacity: inputText.trim() ? 1 : 0.5,
                cursor: inputText.trim() ? "pointer" : "not-allowed",
              }}
            >
              SEND ↗
            </button>
          </div>

          {availableExerciseId && onLaunchExercise && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="duo-btn-subtle"
                onClick={() => onLaunchExercise(availableExerciseId)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                PRACTICE AS FULL INTERACTIVE DRILL ▶
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
