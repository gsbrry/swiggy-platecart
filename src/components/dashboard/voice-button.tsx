"use client";

import { Loader2, Mic } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type VoiceState = "idle" | "listening" | "processing" | "result" | "error";

// Minimal shape for the Web Speech API — DOM lib omits it in TS.
type SpeechRecognitionResult = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionResult) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

/** Voice CTA — Web Speech API → /api/voice/parse. */
export function VoiceButton() {
  const [state, setState] = useState<VoiceState>("idle");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const handleClick = useCallback(async () => {
    if (state === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    // Web Speech API is browser-only; guard for SSR + unsupported browsers.
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) {
      setState("error");
      setLastResult("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setState("processing");
      void fetch("/api/voice/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
        .then((r) => r.json())
        .then((data: { dish?: string; error?: string }) => {
          setState("result");
          setLastResult(data.dish ?? data.error ?? transcript);
          // eslint-disable-next-line no-console
          console.info("voice:parse", { transcript, response: data });
        })
        .catch((err: unknown) => {
          setState("error");
          setLastResult(err instanceof Error ? err.message : "Voice parse failed");
        });
    };
    recognition.onerror = () => {
      setState("error");
      setLastResult("Microphone error — check permissions.");
    };
    recognition.onend = () => {
      setState((prev) => (prev === "listening" ? "idle" : prev));
    };

    setState("listening");
    recognition.start();
  }, [state]);

  const label = state === "listening" ? "Listening…" : state === "processing" ? "Processing…" : "Voice Order";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="button"
        aria-label="Voice order — say a dish name"
        onClick={handleClick}
        disabled={state === "processing"}
        className="flex items-center gap-2.5 whitespace-nowrap rounded-lg bg-appetite px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        <span
          className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-white/20 ${
            state === "listening" ? "animate-pulse" : ""
          }`}
        >
          {state === "processing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </span>
        {label}
      </button>
      {lastResult && state !== "listening" && (
        <p className="max-w-[240px] truncate text-[11px] text-[var(--sw-muted)]">
          {state === "error" ? "⚠ " : "✓ "}
          {lastResult}
        </p>
      )}
    </div>
  );
}
