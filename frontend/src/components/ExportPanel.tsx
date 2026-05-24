import { Copy, Download } from "lucide-react";
import { useMemo, useState } from "react";

import { exportUrl } from "../lib/api";
import type { AnalysisResult } from "../types/api";

export function ExportPanel({ result }: { result: AnalysisResult }) {
  const [showInlineNotes, setShowInlineNotes] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copy notes");
  const inlineNotes = useMemo(() => formatInlineNotes(result), [result]);
  const exports = [
    { label: "PDF", format: "pdf" },
    { label: "MIDI", format: "midi" },
    { label: "MusicXML", format: "musicxml" },
    { label: "TXT", format: "txt" },
  ] as const;

  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-soft md:p-7">
      <div className="rounded-2xl border border-stone-200 bg-stone-50">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron">Notes</p>
            <h3 className="mt-1 text-2xl font-bold">Simple Sitar notation</h3>
            <p className="text-sm text-stone-600">Bhajan-style notes first. Downloads and detailed tables are optional.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowInlineNotes((value) => !value)}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            >
              {showInlineNotes ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(inlineNotes);
                setCopyLabel("Copied");
                window.setTimeout(() => setCopyLabel("Copy notes"), 1400);
              }}
              className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              <Copy className="h-4 w-4" />
              {copyLabel}
            </button>
          </div>
        </div>
        {showInlineNotes && (
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-stone-800 md:p-5">
            {inlineNotes}
          </pre>
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-stone-700">Download or export</summary>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {exports.map((item) => (
            <a
              key={item.format}
              href={exportUrl(result.project_id, item.format)}
              className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-sandal px-4 py-3 font-semibold text-raga hover:border-saffron"
            >
              <Download className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </div>
      </details>
    </section>
  );
}

function formatInlineNotes(result: AnalysisResult): string {
  const lines = [
    result.title.toUpperCase(),
    result.artist ? `Artist: ${result.artist}` : "",
    `Scale: ${result.detected_scale}   Tempo: ${Math.round(result.tempo)} BPM   Confidence: ${Math.round(
      result.overall_confidence * 100,
    )}%`,
    "Notation: - = sustain, ~ = meend, ~~ = andolan, ^ = kan swara, () = murki",
    "",
  ];

  let phraseNumber = 1;
  for (const section of result.sections) {
    lines.push(`${section.name} (${formatTime(section.start)} - ${formatTime(section.end)})`);

    for (const phrase of section.phrases) {
      const simple = formatPhrase(phrase);
      const phraseLines = [`${phraseNumber}.`];
      if (phrase.lyrics) {
        phraseLines.push(`   ${phrase.lyrics}`);
      }
      phraseLines.push(`   ${simple.swaras}`, `   ${simple.strokes}`, "");
      lines.push(...phraseLines);
      phraseNumber += 1;
    }
  }

  return lines.join("\n");
}

function formatPhrase(phrase: AnalysisResult["sections"][number]["phrases"][number]) {
  const swaraTokens: string[] = [];
  const strokeTokens: string[] = [];

  phrase.notes.forEach((note, index) => {
    if (index > 0 && index % 4 === 0) {
      swaraTokens.push("|");
      strokeTokens.push("|");
    }

    const swara = decorateSwara(note.swara, note.ornamentation);
    swaraTokens.push(swara, ...sustainMarks(note.duration));
    strokeTokens.push(note.stroke.replace(", sustain", ""), ...sustainMarks(note.duration));
  });

  return {
    swaras: swaraTokens.join(" "),
    strokes: strokeTokens.join(" "),
  };
}

function decorateSwara(swara: string, ornamentation?: string): string {
  if (ornamentation === "meend") {
    return `${swara}~`;
  }
  if (ornamentation === "andolan") {
    return `${swara}~~`;
  }
  if (ornamentation === "kan swara") {
    return `^${swara}`;
  }
  if (ornamentation === "murki") {
    return `(${swara})`;
  }
  return swara;
}

function sustainMarks(duration: number): string[] {
  if (duration >= 1.2) {
    return ["-", "-"];
  }
  if (duration >= 0.65) {
    return ["-"];
  }
  return [];
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}
