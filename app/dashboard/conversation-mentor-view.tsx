"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WhaleMascot } from "@/src/client/components/whale-mascot";
import { sound } from "@/src/client/sound/synthesizer";
import {
  CALL_SIMULATION_SCENARIOS,
  type CallSimulationScenario,
} from "@/src/client/data/tatoeba-corpus";

export interface ConversationTurn {
  id: string;
  speaker: "coach" | "learner";
  message: string;
  hindiTranslation?: string;
  feedback?: string;
  timestamp: string;
}

export type CallDurationMode = "15_min" | "30_min" | "freeform";

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

function speakUtterance(text: string, locale: string = "en-US") {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

export interface ConversationMentorViewProps {
  activeGoalDescription: string;
  onLaunchExercise?: (exerciseId: string) => void;
  availableExerciseId?: string;
}

export default function ConversationMentorView({
  activeGoalDescription,
  onLaunchExercise,
  availableExerciseId,
}: ConversationMentorViewProps) {
  // Mode: 15-minute call, 30-minute call, or freeform mentor dialogue
  const [callMode, setCallMode] = useState<CallDurationMode>("15_min");

  // Selected simulation scenario
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("call_de_standup");
  const scenario =
    CALL_SIMULATION_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    CALL_SIMULATION_SCENARIOS[0];

  // Call state: "briefing" -> "in_call" -> "debrief"
  const [callState, setCallState] = useState<"briefing" | "in_call" | "debrief">("briefing");

  // Call timer (seconds remaining)
  const defaultSeconds = callMode === "30_min" ? 30 * 60 : 15 * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(defaultSeconds);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Active Teleprompter / Hint Drawer visibility
  const [showTeleprompter, setShowTeleprompter] = useState<boolean>(true);

  // Input & Audio state
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Conversation turns
  const [turns, setTurns] = useState<ConversationTurn[]>([]);

  // Teleprompter step index
  const [teleprompterStep, setTeleprompterStep] = useState<number>(0);

  // Debrief stats
  const [debriefStats, setDebriefStats] = useState({
    communicativeScore: 92,
    technicalClarity: "Mastered",
    culturalEtiquette: "Exceptional",
    turnsCount: 0,
    earnedXp: 35,
    earnedGems: 20,
  });

  // Reference for dialogue bottom scroll
  const dialogueEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize turns whenever scenario changes or call starts
  const initializeCall = (scen: CallSimulationScenario) => {
    const initialTurn: ConversationTurn = {
      id: "turn_init",
      speaker: "coach",
      message: scen.aiPersona.greetingText,
      hindiTranslation: scen.aiPersona.greetingHindi,
      timestamp: "Just now",
    };
    setTurns([initialTurn]);
    setTeleprompterStep(0);
    setSecondsRemaining(callMode === "30_min" ? 30 * 60 : 15 * 60);
    speakUtterance(scen.aiPersona.greetingText, scen.localeCode);
  };

  const endCallAndDebrief = useCallback(() => {
    sound.playFanfare();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const userTurns = turns.filter((t) => t.speaker === "learner").length;
    setDebriefStats({
      communicativeScore: Math.min(98, 80 + userTurns * 4),
      technicalClarity: userTurns >= 2 ? "Mastered" : "Needs Reinforcement",
      culturalEtiquette: "Calibrated to Workplace Standards",
      turnsCount: turns.length,
      earnedXp: Math.max(25, userTurns * 10),
      earnedGems: Math.max(15, userTurns * 5),
    });
    setCallState("debrief");
  }, [turns]);

  // Timer countdown hook
  useEffect(() => {
    if (callState !== "in_call" || isTimerPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endCallAndDebrief();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [callState, isTimerPaused, endCallAndDebrief]);

  // Auto-scroll on new turn
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const startCall = () => {
    sound.playCorrect();
    initializeCall(scenario);
    setCallState("in_call");
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Speech Recognition Hook
  const handleVoiceToggle = () => {
    sound.playPop();
    setSpeechError(null);

    if (typeof window === "undefined") return;
    const speechWin = window as unknown as SpeechWindow;
    const SpeechRecognitionClass = speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError("Speech recognition is not supported in this browser. You can type your response.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = scenario.localeCode;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setSpeechError(
          "Microphone access blocked or unavailable. Click the lock/permission icon in your browser address bar to allow microphone access, or switch to typing mode below."
        );
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setSpeechError(
        "Could not access microphone. Ensure your browser has microphone permission enabled, or type your response below."
      );
      setIsRecording(false);
    }
  };

  // Evaluate and reply in the selected scenario's language
  const handleSendResponse = () => {
    if (!inputText.trim()) return;

    sound.playPop();
    const userMessage = inputText.trim();
    setInputText("");

    const newTurn: ConversationTurn = {
      id: `turn_${Date.now()}`,
      speaker: "learner",
      message: userMessage,
      timestamp: "Just now",
    };

    const nextStep = teleprompterStep + 1;
    setTeleprompterStep(nextStep);

    // Pick contextual response
    let aiReplyText = "";
    let aiHindiTranslation = "";
    let turnFeedback = "";

    if (scenario.targetLanguage === "de") {
      aiReplyText = "Verstanden. Danke für das präzise Update. Wie ist der voraussichtliche Zeitplan für den Fix?";
      aiHindiTranslation = "समझ गया। सटीक अपडेट के लिए धन्यवाद। समाधान के लिए अनुमानित समय (ETA) क्या है?";
      turnFeedback = "Ausgezeichnete Sachlichkeit! Guter technischer Fokus ohne ausschweifende Entschuldigungen.";
    } else if (scenario.targetLanguage === "ja") {
      aiReplyText = "ご報告ありがとうございます。状況を把握いたしました。キャッシュの反映について、技術チームへ相談を進めていただけますでしょうか？";
      aiHindiTranslation = "रिपोर्ट के लिए धन्यवाद। स्थिति समझ में आ गई। क्या आप तकनीकी टीम से परामर्श आगे बढ़ा सकते हैं?";
      turnFeedback = "素晴らしい報連相（ほうれんそう）です。敬語と丁寧な報告スタイルが適切です。";
    } else {
      aiReplyText = "Quantifiable and well-framed. What is the minimal viable compromise that protects our launch date?";
      aiHindiTranslation = "सटीक और तथ्यात्मक। वह कौन सा न्यूनतम समाधान है जो लॉन्च की तारीख को सुरक्षित रखेगा?";
      turnFeedback = "High executive presence. Framing technical debt in terms of revenue risk resonated well.";
    }

    const aiTurn: ConversationTurn = {
      id: `turn_${Date.now() + 1}`,
      speaker: "coach",
      message: aiReplyText,
      hindiTranslation: aiHindiTranslation,
      feedback: turnFeedback,
      timestamp: "Just now",
    };

    setTurns((prev) => [...prev, newTurn, aiTurn]);
    speakUtterance(aiReplyText, scenario.localeCode);
  };

  return (
    <div className="conversation-mentor-container">
      {/* 1. Header Bar: Mode & Scenario Selectors */}
      <div
        className="duo-command-center"
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          borderRadius: "20px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#38bdf8",
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  padding: "3px 10px",
                  borderRadius: "99px",
                  textTransform: "uppercase",
                }}
              >
                REAL-TIME AI VOICE CALL SIMULATOR
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Powered by Open Speech & Multilingual Bridge (हिंदी / English)
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: "6px 0 2px" }}>
              Workplace Immersion Call: {scenario.title}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
              {scenario.subtitle} · Active Context: {activeGoalDescription}
            </p>
          </div>

          {/* Mode Tabs (15-min / 30-min / Freeform) */}
          <div style={{ display: "flex", gap: "8px", background: "rgba(15, 23, 42, 0.8)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setCallMode("15_min");
              }}
              style={{
                background: callMode === "15_min" ? "linear-gradient(135deg, #a855f7, #6366f1)" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📞 15-Min Standup
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setCallMode("30_min");
              }}
              style={{
                background: callMode === "30_min" ? "linear-gradient(135deg, #a855f7, #6366f1)" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📞 30-Min Executive
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setCallMode("freeform");
              }}
              style={{
                background: callMode === "freeform" ? "linear-gradient(135deg, #a855f7, #6366f1)" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              💬 Free Dialogue
            </button>
          </div>
        </div>

        {/* Scenario Switcher Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>CHOOSE SCENARIO:</span>
          {CALL_SIMULATION_SCENARIOS.map((scen) => (
            <button
              key={scen.id}
              type="button"
              onClick={() => {
                sound.playPop();
                setSelectedScenarioId(scen.id);
                setCallState("briefing");
              }}
              style={{
                background: selectedScenarioId === scen.id ? "rgba(168, 85, 247, 0.25)" : "rgba(30, 41, 59, 0.6)",
                border: `1px solid ${selectedScenarioId === scen.id ? "#a855f7" : "rgba(255, 255, 255, 0.1)"}`,
                color: selectedScenarioId === scen.id ? "#f8fafc" : "#94a3b8",
                padding: "6px 12px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {scen.targetLanguage === "de" ? "🇩🇪 German" : scen.targetLanguage === "ja" ? "🇯🇵 Japanese" : "🌐 Global English"} · {scen.aiPersona.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. STATE A: Pre-Call Briefing Room */}
      {callState === "briefing" && (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "2px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 16px 36px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
              <span style={{ fontSize: "52px" }}>{scenario.aiPersona.avatarEmoji}</span>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                  AI INTERLOCUTOR & PERSONA
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "2px 0 4px" }}>
                  {scenario.aiPersona.name}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
                  {scenario.aiPersona.role}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="button button-primary"
              onClick={startCall}
              style={{
                padding: "14px 28px",
                fontSize: "16px",
                fontWeight: 800,
                borderRadius: "14px",
                boxShadow: "0 8px 24px rgba(168, 85, 247, 0.5)",
              }}
            >
              🚀 START SIMULATED {callMode === "30_min" ? "30-MIN" : "15-MIN"} CALL
            </button>
          </div>

          {/* Context & Mission in English + Hindi */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px 20px", borderRadius: "14px" }}>
              <strong style={{ color: "#38bdf8", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                📋 SCENARIO CONTEXT (परिदृश्य संदर्भ)
              </strong>
              <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#f8fafc", lineHeight: 1.5 }}>
                {scenario.briefing.context}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                🇮🇳 {scenario.briefing.contextHindi}
              </p>
            </div>

            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px 20px", borderRadius: "14px" }}>
              <strong style={{ color: "#4ade80", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                🎯 MISSION OBJECTIVE (मिशन का उद्देश्य)
              </strong>
              <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#f8fafc", lineHeight: 1.5 }}>
                {scenario.briefing.objective}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                🇮🇳 {scenario.briefing.objectiveHindi}
              </p>
            </div>
          </div>

          {/* Key Phrases in Target Language with Transliteration & Hindi Meaning */}
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", marginBottom: "12px", textTransform: "uppercase" }}>
              🔑 ESSENTIAL KEY PHRASES (महत्वपूर्ण वाक्य)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              {scenario.briefing.keyPhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <strong style={{ color: "#c084fc", fontSize: "14px" }}>{phrase.phrase}</strong>
                    <button
                      type="button"
                      onClick={() => speakUtterance(phrase.phrase, scenario.localeCode)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px" }}
                      title="Listen audio"
                    >
                      🔊
                    </button>
                  </div>
                  {phrase.transliteration && (
                    <div style={{ fontSize: "11px", color: "#38bdf8", marginTop: "2px", fontStyle: "italic" }}>
                      Romaji: {phrase.transliteration}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#e2e8f0", marginTop: "6px" }}>
                    🇮🇳 <strong>Hindi:</strong> {phrase.meaningHindi}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                    🇬🇧 <strong>English:</strong> {phrase.meaningEnglish}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cultural Etiquette Coach */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.9))",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "14px",
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>🌏</span>
              <div>
                <strong style={{ color: "#fcd34d", fontSize: "13px", display: "block" }}>
                  WORKPLACE CULTURAL ETIQUETTE (कार्यस्थल शिष्टाचार)
                </strong>
                <p style={{ margin: "2px 0 4px", fontSize: "13px", color: "#f8fafc" }}>
                  {scenario.briefing.culturalEtiquette}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#fef3c7" }}>
                  🇮🇳 {scenario.briefing.culturalEtiquetteHindi}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. STATE B: Active Phone Call Simulation */}
      {callState === "in_call" && (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.98)",
            border: "2px solid rgba(168, 85, 247, 0.5)",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Active Call Status Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              paddingBottom: "18px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "99px",
                  background: "#4ade80",
                  boxShadow: "0 0 12px #4ade80",
                  animation: "pulse 2s infinite",
                }}
              />
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#4ade80", textTransform: "uppercase" }}>
                  CONNECTED · {scenario.aiPersona.role}
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  {scenario.aiPersona.name} ({scenario.targetLanguage.toUpperCase()})
                </h3>
              </div>
            </div>

            {/* Countdown Timer & Teleprompter Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontFamily: "monospace",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: secondsRemaining <= 60 ? "#ef4444" : "#f8fafc",
                }}
              >
                ⏱️ {formatTimer(secondsRemaining)}
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setIsTimerPaused((prev) => !prev);
                }}
                style={{
                  background: isTimerPaused ? "rgba(239, 68, 68, 0.25)" : "rgba(30, 41, 59, 0.6)",
                  border: `1px solid ${isTimerPaused ? "#ef4444" : "rgba(255, 255, 255, 0.1)"}`,
                  color: "#ffffff",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                title={isTimerPaused ? "Resume call timer" : "Pause call timer"}
              >
                {isTimerPaused ? "▶️ Resume" : "⏸️ Pause"}
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setShowTeleprompter((prev) => !prev);
                }}
                style={{
                  background: showTeleprompter ? "rgba(56, 189, 248, 0.25)" : "rgba(30, 41, 59, 0.6)",
                  border: `1px solid ${showTeleprompter ? "#38bdf8" : "rgba(255, 255, 255, 0.1)"}`,
                  color: "#ffffff",
                  padding: "6px 14px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                💡 {showTeleprompter ? "Hide Teleprompter" : "Show Teleprompter"}
              </button>

              <button
                type="button"
                onClick={endCallAndDebrief}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "none",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🔴 END CALL
              </button>
            </div>
          </div>

          {/* Active Call Dialogue Viewport */}
          <div
            style={{
              maxHeight: "340px",
              overflowY: "auto",
              padding: "16px",
              background: "rgba(10, 15, 30, 0.6)",
              borderRadius: "16px",
              marginBottom: "16px",
            }}
          >
            {turns.map((turn) => {
              const isAi = turn.speaker === "coach";
              return (
                <div
                  key={turn.id}
                  style={{
                    display: "flex",
                    justifyContent: isAi ? "flex-start" : "flex-end",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      background: isAi ? "rgba(30, 41, 59, 0.9)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      border: isAi ? "1px solid rgba(168, 85, 247, 0.3)" : "none",
                      borderRadius: "18px",
                      padding: "14px 18px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px", color: isAi ? "#c084fc" : "#a5f3fc" }}>
                        {isAi ? `${scenario.aiPersona.avatarEmoji} ${scenario.aiPersona.name}` : "👤 You"}
                      </strong>
                      {isAi && (
                        <button
                          type="button"
                          onClick={() => speakUtterance(turn.message, scenario.localeCode)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "14px" }}
                          title="Replay Audio"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: "14px", color: "#ffffff", lineHeight: 1.5 }}>{turn.message}</div>

                    {/* Native Hindi bridge translation for AI turn */}
                    {turn.hindiTranslation && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          marginTop: "6px",
                          paddingTop: "6px",
                          borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        🇮🇳 <em>{turn.hindiTranslation}</em>
                      </div>
                    )}

                    {turn.feedback && (
                      <div style={{ fontSize: "11px", color: "#38bdf8", marginTop: "6px", fontWeight: 700 }}>
                        ✨ Feedback: {turn.feedback}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={dialogueEndRef} />
          </div>

          {/* Teleprompter & Live Hints in Target Language + Hindi */}
          {showTeleprompter && scenario.sampleDialogueTurns[teleprompterStep] && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                borderRadius: "14px",
                padding: "12px 18px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <WhaleMascot mood="coach" size={28} />
                <strong style={{ color: "#38bdf8", fontSize: "12px", textTransform: "uppercase" }}>
                  💡 LIVE TELEPROMPTER & HINT (हिंदी / English)
                </strong>
              </div>
              {scenario.sampleDialogueTurns[teleprompterStep].hindiHint && (
                <div style={{ fontSize: "13px", color: "#f8fafc" }}>
                  🇮🇳 {scenario.sampleDialogueTurns[teleprompterStep].hindiHint}
                </div>
              )}
              {scenario.sampleDialogueTurns[teleprompterStep].englishHint && (
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                  🇬🇧 {scenario.sampleDialogueTurns[teleprompterStep].englishHint}
                </div>
              )}
            </div>
          )}

          {/* Speech Error Banner if any */}
          {speechError && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                padding: "10px 16px",
                borderRadius: "12px",
                color: "#fca5a5",
                fontSize: "13px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
              role="alert"
            >
              <span>⚠️ {speechError}</span>
              <button
                type="button"
                onClick={handleVoiceToggle}
                style={{
                  background: "rgba(239, 68, 68, 0.3)",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Retry Mic ↺
              </button>
            </div>
          )}

          {/* Live Audio Input & Response Controls */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleVoiceToggle}
              style={{
                background: isRecording ? "linear-gradient(135deg, #ef4444, #dc2626)" : "rgba(30, 41, 59, 0.8)",
                border: `1px solid ${isRecording ? "#ef4444" : "rgba(168, 85, 247, 0.4)"}`,
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isRecording ? "🔴 RECORDING..." : "🎙️ SPEAK"}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendResponse();
              }}
              placeholder={`Respond in ${scenario.targetLanguage.toUpperCase()} (or speak aloud)...`}
              style={{
                flex: 1,
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "14px",
                padding: "12px 18px",
                fontSize: "14px",
                color: "#ffffff",
                outline: "none",
              }}
            />

            <button
              type="button"
              className="button button-primary"
              onClick={handleSendResponse}
              disabled={!inputText.trim()}
              style={{
                padding: "12px 22px",
                fontSize: "14px",
                fontWeight: 800,
                borderRadius: "14px",
              }}
            >
              SEND ▶
            </button>
          </div>
        </div>
      )}

      {/* 4. STATE C: Post-Call Diagnostic Debriefing */}
      {callState === "debrief" && (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "2px solid rgba(74, 222, 128, 0.4)",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
            <WhaleMascot mood="celebrating" size={72} animated={true} />
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#4ade80",
                  background: "rgba(74, 222, 128, 0.12)",
                  border: "1px solid rgba(74, 222, 128, 0.3)",
                  padding: "3px 10px",
                  borderRadius: "99px",
                  textTransform: "uppercase",
                }}
              >
                CALL COMPLETED · DIAGNOSTIC DEBRIEF
              </span>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "6px 0 4px" }}>
                Workplace Call Evaluation: {scenario.title}
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#cbd5e1" }}>
                Completed {debriefStats.turnsCount} conversational turns with {scenario.aiPersona.name}.
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px 20px", borderRadius: "14px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                Communicative Impact
              </span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#4ade80", marginTop: "4px" }}>
                {debriefStats.communicativeScore}%
              </div>
            </div>

            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px 20px", borderRadius: "14px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                Technical Clarity
              </span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#38bdf8", marginTop: "6px" }}>
                {debriefStats.technicalClarity}
              </div>
            </div>

            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px 20px", borderRadius: "14px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                Cultural Etiquette
              </span>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#c084fc", marginTop: "8px" }}>
                {debriefStats.culturalEtiquette}
              </div>
            </div>

            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "16px 20px", borderRadius: "14px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                Earned Rewards
              </span>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#facc15", marginTop: "6px" }}>
                +{debriefStats.earnedXp} XP · +{debriefStats.earnedGems} 💎
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                sound.playPop();
                setCallState("briefing");
              }}
              style={{ padding: "12px 24px", fontSize: "14px", fontWeight: 800, borderRadius: "12px" }}
            >
              🔄 PRACTICE ANOTHER CALL
            </button>

            {onLaunchExercise && availableExerciseId && (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onLaunchExercise(availableExerciseId);
                }}
                style={{
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  color: "#ffffff",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 800,
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                🎯 REINFORCE KEY EXPRESSIONS IN LAB
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
