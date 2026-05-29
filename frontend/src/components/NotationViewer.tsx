import { Music2 } from "lucide-react";

import { sitarGlyph } from "../lib/notation";
import type { AnalysisResult, Phrase } from "../types/api";

interface NotationViewerProps {
  result: AnalysisResult;
  activePhraseKey: string | null;
  onPhraseSelect: (key: string) => void;
  onPhraseEdit: (key: string, swaras: string) => void;
}

export function NotationViewer({ result, activePhraseKey, onPhraseSelect, onPhraseEdit }: NotationViewerProps) {
  return (
    <section className="rounded-3xl bg-white/95 p-6 shadow-soft">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron">Generated notation</p>
          <h2 className="mt-1 text-3xl font-bold">{result.title}</h2>
          <p className="mt-2 text-sm text-stone-600">{result.teacher_summary}</p>
        </div>
        <div className="rounded-2xl bg-sandal p-4 text-sm">
          <p>
            <strong>Tempo:</strong> {Math.round(result.tempo)} BPM
          </p>
          <p>
            <strong>Scale:</strong> {result.detected_scale}
          </p>
          <p>
            <strong>Confidence:</strong> {Math.round(result.overall_confidence * 100)}%
          </p>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-stone-700">
          <strong>Review notes:</strong>
          <ul className="mt-2 list-disc pl-5">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        {result.sections.map((section) => (
          <article key={`${section.name}-${section.start}`} className="rounded-3xl border border-stone-200 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold">{section.name}</h3>
                <p className="text-sm text-stone-500">
                  {formatTime(section.start)} - {formatTime(section.end)} · {Math.round(section.tempo)} BPM ·{" "}
                  {section.detected_scale}
                </p>
              </div>
              <span className="rounded-full bg-raga/10 px-3 py-1 text-sm font-semibold text-raga">
                {Math.round(section.confidence * 100)}% confidence
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-600">Suggested raga flavor: {section.suggested_raga_flavor}</p>

            <div className="mt-4 space-y-4">
              {section.phrases.map((phrase) => {
                const key = `${section.name}-${phrase.label}-${phrase.start}`;
                return (
                  <PhraseCard
                    key={key}
                    phrase={phrase}
                    isActive={activePhraseKey === key}
                    onSelect={() => onPhraseSelect(key)}
                    onEdit={(swaras) => onPhraseEdit(key, swaras)}
                  />
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PhraseCard({
  phrase,
  isActive,
  onSelect,
  onEdit,
}: {
  phrase: Phrase;
  isActive: boolean;
  onSelect: () => void;
  onEdit: (swaras: string) => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${isActive ? "border-raga bg-sandal/80" : "border-stone-200 bg-white"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button type="button" onClick={onSelect} className="flex items-center gap-2 text-left font-bold text-raga">
          <Music2 className="h-4 w-4" />
          {phrase.label} · {formatTime(phrase.start)} - {formatTime(phrase.end)}
        </button>
        <span className="text-xs text-stone-500">Click phrase for loop focus</span>
      </div>

      <div className="mt-4 grid gap-3">
        {phrase.lyrics ? <NotationBlock label="Lyrics" value={phrase.lyrics} /> : null}
        <NotationBlock label="Swaras" value={phrase.swaras} editable onEdit={onEdit} />
        <NotationBlock label="Western notes" value={phrase.western_notes} />
        <NotationBlock label="Sitar tab style" value={phrase.sitar_tab} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <GuidanceList title="Ornamentation" items={phrase.ornamentation_notes} />
        <GuidanceList title="Fingering" items={phrase.fingering_guidance} />
        <GuidanceList title="Practice" items={phrase.practice_tips} />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="py-2">Swara</th>
              <th>Western</th>
              <th>String-Fret</th>
              <th>Ornament</th>
              <th>Stroke</th>
              <th>Fingering</th>
              <th>Timing</th>
              <th>Conf.</th>
            </tr>
          </thead>
          <tbody>
            {phrase.notes.map((note, index) => (
              <tr key={`${note.start}-${note.swara}-${index}`} className="border-t border-stone-100">
                <td className="py-2 font-semibold" title={note.swara}>
                  {sitarGlyph(note.swara)}
                </td>
                <td>{note.western}</td>
                <td>
                  {note.string}-{note.fret}
                </td>
                <td>{note.ornamentation ?? "clean"}</td>
                <td>{note.stroke}</td>
                <td>{note.fingering}</td>
                <td>
                  {note.start.toFixed(2)}s / {note.duration.toFixed(2)}s
                </td>
                <td>{Math.round(note.confidence * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotationBlock({
  label,
  value,
  editable,
  onEdit,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onEdit?: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="font-semibold text-stone-600">{label}</span>
      {editable ? (
        <textarea
          className="mt-1 min-h-16 w-full rounded-xl border border-stone-200 bg-sandal/40 p-3 font-mono text-sm"
          value={value}
          onChange={(event) => onEdit?.(event.target.value)}
        />
      ) : (
        <div className="mt-1 rounded-xl bg-stone-50 p-3 font-mono text-sm">{value}</div>
      )}
    </label>
  );
}

function GuidanceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3 text-sm">
      <h4 className="font-bold">{title}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-stone-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}
