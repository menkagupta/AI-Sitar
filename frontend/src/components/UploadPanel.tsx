import { Link, Upload } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";

import type { NotationStyle, ProjectOptions, SkillLevel } from "../types/api";

interface UploadPanelProps {
  file: File | null;
  options: ProjectOptions;
  isSubmitting: boolean;
  onFileChange: (file: File | null) => void;
  onOptionsChange: (options: ProjectOptions) => void;
  onSubmit: () => void;
}

export function UploadPanel({
  file,
  options,
  isSubmitting,
  onFileChange,
  onOptionsChange,
  onSubmit,
}: UploadPanelProps) {
  function update<K extends keyof ProjectOptions>(key: K, value: ProjectOptions[K]) {
    onOptionsChange({ ...options, [key]: value });
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white/95 p-5 shadow-soft md:p-7">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron">AI Sitar notes</p>
        <h2 className="mt-2 text-2xl font-bold">Paste a YouTube link</h2>
        <p className="mt-2 text-sm text-stone-600">
          We will extract the main melody and show playable Sitar notes below. Accuracy depends on audio quality.
        </p>
      </div>

      <label className="text-sm font-medium">
        <span className="flex items-center gap-2">
          <Link className="h-4 w-4 text-raga" />
          YouTube URL
        </span>
        <input
          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-4 text-base shadow-sm outline-none transition focus:border-raga focus:ring-4 focus:ring-raga/10"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={options.youtube_url ?? ""}
          onChange={(event) => update("youtube_url", event.target.value)}
        />
      </label>

      <button
        disabled={(!file && !options.youtube_url?.trim()) || isSubmitting}
        className="mt-4 w-full rounded-2xl bg-ink px-5 py-4 font-semibold text-white transition hover:bg-raga disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {isSubmitting ? "Generating notes..." : "Generate Sitar notes"}
      </button>

      <details className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-stone-700">Advanced options</summary>
        <div className="mt-4 grid gap-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-white p-6 text-center transition hover:border-saffron">
            <Upload className="mb-3 h-7 w-7 text-raga" />
            <span className="font-semibold">{file ? file.name : "Or upload an audio file"}</span>
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
    </form>
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
