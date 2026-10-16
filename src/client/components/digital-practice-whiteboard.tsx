"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { sound } from "@/src/client/sound/synthesizer";

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface WhiteboardStroke {
  color: string;
  width: number;
  isEraser: boolean;
  points: StrokePoint[];
}

export interface DigitalPracticeWhiteboardProps {
  promptText?: string;
  scenarioTitle?: string;
  onReturnToExercise?: () => void;
  className?: string;
}

const COLOR_PALETTE = [
  { label: "White", value: "#f8fafc" },
  { label: "Cyan", value: "#38bdf8" },
  { label: "Purple", value: "#c084fc" },
  { label: "Indigo", value: "#818cf8" },
  { label: "Coral", value: "#fb923c" },
];

const STROKE_WIDTHS = [
  { label: "Fine", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Broad", value: 8 },
];

export function DigitalPracticeWhiteboard({
  promptText,
  scenarioTitle = "Freehand Digital Practice Whiteboard",
  onReturnToExercise,
  className = "",
}: DigitalPracticeWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentStrokeRef = useRef<WhiteboardStroke | null>(null);

  // Drawing state
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<WhiteboardStroke | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#f8fafc");
  const [selectedWidth, setSelectedWidth] = useState<number>(4);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [hasExported, setHasExported] = useState<boolean>(false);

  // Redraw all strokes on the canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle dark slate canvas background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional faint grid lines for handwriting alignment
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    for (const stroke of allStrokes) {
      if (stroke.points.length === 0) continue;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.width;

      if (stroke.isEraser) {
        ctx.strokeStyle = "#0f172a";
      } else {
        ctx.strokeStyle = stroke.color;
      }

      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes, currentStroke]);

  // Handle canvas sizing for Retina / High-DPI screens without losing strokes
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(260, Math.floor(rect.height || 360));

    // Update physical pixel dimensions
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    redraw();
  }, [redraw]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Non-fatal if pointer capture is not supported for synthetic/touch events
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke: WhiteboardStroke = {
      color: selectedColor,
      width: selectedWidth,
      isEraser,
      points: [{ x, y, pressure: e.pressure }],
    };

    currentStrokeRef.current = newStroke;
    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStrokeRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nextStroke: WhiteboardStroke = {
      ...currentStrokeRef.current,
      points: [...currentStrokeRef.current.points, { x, y, pressure: e.pressure }],
    };
    currentStrokeRef.current = nextStroke;
    setCurrentStroke(nextStroke);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const finished = currentStrokeRef.current;
    if (!finished) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    try {
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Non-fatal
    }

    currentStrokeRef.current = null;
    setStrokes((prev) => [...prev, finished]);
    setCurrentStroke(null);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    try {
      if (canvas && e.pointerId && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Non-fatal
    }
    currentStrokeRef.current = null;
    setCurrentStroke(null);
  };

  // Toolbar actions
  const handleUndo = () => {
    sound.playPop();
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    sound.playPop();
    setStrokes([]);
    setShowClearConfirm(false);
  };

  const handleExport = () => {
    sound.playPop();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `speakql-whiteboard-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setHasExported(true);
      setTimeout(() => setHasExported(false), 3000);
    } catch (err) {
      console.error("Failed to export whiteboard canvas:", err);
    }
  };

  return (
    <div
      className={`speakql-digital-whiteboard-wrapper ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #1e293b, #0f172a)",
        border: "2px solid rgba(168, 85, 247, 0.3)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: "0 16px 36px -8px rgba(0,0,0,0.5)",
      }}
    >
      {/* Top Header / Context Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          background: "rgba(15, 23, 42, 0.7)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.2rem" }}>✍️</span>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
              {scenarioTitle}
            </h3>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#c084fc",
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                padding: "2px 8px",
                borderRadius: "99px",
                letterSpacing: "0.05em",
              }}
            >
              ACTIVE SCRIPT TRACING &amp; KINESTHETIC MEMORY
            </span>
          </div>

          <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.4 }}>
            {promptText || "Handwriting non-Latin scripts (Japanese Hiragana/Katakana, Hindi Devanagari) and diagramming sentence structure activates motor-cognitive pathways for stronger memory retention."}
          </p>

          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
            ℹ️ Freehand canvas with touch &amp; stylus support. Transcribe your notes into the response field below when ready for rubric evaluation.
          </p>
        </div>

        {onReturnToExercise && (
          <button
            type="button"
            onClick={onReturnToExercise}
            className="duo-btn-subtle"
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
          >
            ← Return to Exercise
          </button>
        )}
      </div>

      {/* Floating Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 1rem",
          background: "rgba(30, 41, 59, 0.8)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {/* Left: Mode (Pen vs Eraser) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setIsEraser(false);
            }}
            style={{
              background: !isEraser ? "rgba(168, 85, 247, 0.3)" : "transparent",
              border: !isEraser ? "1.5px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.5rem",
              padding: "0.35rem 0.65rem",
              color: !isEraser ? "#f8fafc" : "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>✏️</span>
            <span>Pen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setIsEraser(true);
            }}
            style={{
              background: isEraser ? "rgba(239, 68, 68, 0.3)" : "transparent",
              border: isEraser ? "1.5px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.5rem",
              padding: "0.35rem 0.65rem",
              color: isEraser ? "#f8fafc" : "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>🧹</span>
            <span>Eraser</span>
          </button>
        </div>

        {/* Center: Color & Width Pickers (active when not in eraser mode) */}
        {!isEraser && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
            {/* Color Swatches */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setSelectedColor(c.value);
                  }}
                  title={c.label}
                  aria-label={`Select ${c.label} ink`}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "9999px",
                    background: c.value,
                    border: selectedColor === c.value ? "2.5px solid #ffffff" : "1px solid rgba(0,0,0,0.3)",
                    boxShadow: selectedColor === c.value ? "0 0 8px " + c.value : "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>

            {/* Stroke Width Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setSelectedWidth(w.value);
                  }}
                  style={{
                    background: selectedWidth === w.value ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "0.4rem",
                    padding: "0.25rem 0.45rem",
                    color: selectedWidth === w.value ? "#ffffff" : "#94a3b8",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: Undo, Clear, Export Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Undo last stroke"
            aria-label="Undo"
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.5rem",
              padding: "0.35rem 0.6rem",
              color: strokes.length > 0 ? "#f8fafc" : "#64748b",
              cursor: strokes.length > 0 ? "pointer" : "not-allowed",
              fontSize: "0.85rem",
            }}
          >
            ↩ Undo
          </button>

          <button
            type="button"
            onClick={() => {
              if (strokes.length > 0) setShowClearConfirm(true);
            }}
            disabled={strokes.length === 0}
            title="Clear canvas"
            aria-label="Clear whiteboard"
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "0.5rem",
              padding: "0.35rem 0.6rem",
              color: strokes.length > 0 ? "#fca5a5" : "#64748b",
              cursor: strokes.length > 0 ? "pointer" : "not-allowed",
              fontSize: "0.85rem",
            }}
          >
            🗑️ Clear
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={strokes.length === 0}
            title="Download canvas as image"
            aria-label="Export PNG"
            style={{
              background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.25))",
              border: "1px solid rgba(56, 189, 248, 0.5)",
              borderRadius: "0.5rem",
              padding: "0.35rem 0.75rem",
              color: "#38bdf8",
              cursor: strokes.length > 0 ? "pointer" : "not-allowed",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            {hasExported ? "✓ Saved" : "💾 Export PNG"}
          </button>
        </div>
      </div>

      {/* Main Drawing Canvas Container */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "380px",
          background: "#0f172a",
          touchAction: "none",
          cursor: isEraser ? "crosshair" : "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='3' fill='%23a855f7'/></svg>\") 8 8, crosshair",
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
        />

        {/* Empty state hint */}
        {strokes.length === 0 && !currentStroke && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              textAlign: "center",
              color: "rgba(148, 163, 184, 0.4)",
              userSelect: "none",
            }}
          >
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>✏️</span>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>
              Draw or handwrite your response here using mouse, finger, or stylus.
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem" }}>
              High-DPI responsive canvas • Exportable as PNG
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal before Clearing */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-whiteboard-title"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "1rem",
              padding: "1.5rem",
              maxWidth: "380px",
              textAlign: "center",
              color: "#f8fafc",
            }}
          >
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>⚠️</span>
            <h4 id="clear-whiteboard-title" style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
              Clear Whiteboard?
            </h4>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "#94a3b8" }}>
              Are you sure you want to discard your current drawing and handwriting? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="duo-btn-subtle"
                style={{ padding: "0.5rem 1rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 1.25rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
