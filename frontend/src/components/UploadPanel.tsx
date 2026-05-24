import { Settings2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

import type { NotationStyle, ProjectOptions, SkillLevel } from "../types/api";

interface UploadPanelProps {
  file: File | null;
  options: ProjectOptions;
  onFileChange: (file: File | null) => void;
  onOptionsChange: (options: ProjectOptions) => void;
}

export function UploadPanel({ file, options, onFileChange, onOptionsChange }: UploadPanelProps) {
  function update<K extends keyof ProjectOptions>(key: K, value: ProjectOptions[K]) {
    onOptionsChange({ ...options, [key]: value });
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <details className="group relative overflow-hidden rounded-[2rem] bg-white/95 p-5 shadow-soft md:p-7">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl"
            style={{ background: "rgba(217, 119, 6, 0.12)" }}
          >
            <Settings2 className="h-4 w-4" style={{ color: "#8b3a1c" }} />
          </span>
          <span>
            <span className="block text-[0.7rem] font-bold uppercase tracking-[0.24em] text-saffron">
              Optional
            </span>
            <span
              className="block text-lg font-bold text-stone-900"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Advanced options
            </span>
          </span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 group-open:hidden">
          Show
        </span>
        <span className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 group-open:inline">
          Hide
        </span>
      </summary>

      <p className="mt-3 text-sm text-stone-600">
        Skip this for a quick YouTube generation. Use these for a local audio file, manual lyrics,
        or to bias the analysis with raga, skill level, or notation preferences.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-white p-6 text-center transition hover:border-saffron">
          <Upload className="mb-3 h-7 w-7 text-raga" />
          <span className="font-semibold">{file ? file.name : "Upload an audio file instead"}</span>
          <span className="mt-1 text-xs text-stone-500">MP3, WAV, M4A, or FLAC</span>
          <input className="hidden" type="file" accept=".mp3,.wav,.m4a,.flac,audio/*" onChange={handleFile} />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Song title" value={options.song_title ?? ""} onChange={(value) => update("song_title", value)} />
          <TextField label="Artist" value={options.artist ?? ""} onChange={(value) => update("artist", value)} />
          <TextField label="Language" value={options.language ?? ""} onChange={(value) => update("language", value)} />
          <label className="text-sm font-medium md:col-span-2">
            Lyrics
            <textarea
              className="mt-1 min-h-28 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              placeholder="Optional. Paste lyrics here for better lyric-to-note display."
              value={options.lyrics ?? ""}
              onChange={(event) => update("lyrics", event.target.value)}
            />
          </label>
          <TextField
            label="Preferred raga or scale"
            value={options.preferred_raga ?? ""}
            onChange={(value) => update("preferred_raga", value)}
          />
          <SelectField
            label="Skill level"
            value={options.skill_level}
            values={["beginner", "intermediate", "advanced"]}
            onChange={(value) => update("skill_level", value as SkillLevel)}
          />
          <SelectField
            label="Notation style"
            value={options.notation_style}
            values={["swaras", "western", "hybrid"]}
            onChange={(value) => update("notation_style", value as NotationStyle)}
          />
          <TextField
            label="Difficulty target"
            value={options.difficulty_target ?? ""}
            onChange={(value) => update("difficulty_target", value)}
          />
          <label className="text-sm font-medium">
            Practice tempo
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
              type="number"
              min={30}
              max={180}
              value={options.practice_tempo}
              onChange={(event) => update("practice_tempo", Number(event.target.value))}
            />
          </label>
        </div>
      </div>
    </details>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 capitalize"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
