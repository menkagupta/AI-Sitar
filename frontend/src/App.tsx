import { useEffect, useState } from "react";

import { ExportPanel } from "./components/ExportPanel";
import { NotationViewer } from "./components/NotationViewer";
import { PracticePanel } from "./components/PracticePanel";
import { ProgressPanel } from "./components/ProgressPanel";
import { UploadPanel } from "./components/UploadPanel";
import { WaveformPlayer } from "./components/WaveformPlayer";
import { getJob, getProject, submitAnalysis } from "./lib/api";
import type { AnalysisJob, AnalysisResult, ProjectOptions } from "./types/api";

const defaultOptions: ProjectOptions = {
  skill_level: "intermediate",
  practice_tempo: 60,
  notation_style: "hybrid",
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ProjectOptions>(defaultOptions);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePhraseKey, setActivePhraseKey] = useState<string | null>(null);
  const [practiceTempo, setPracticeTempo] = useState(60);
  const [playbackRate, setPlaybackRate] = useState(0.75);

  const isSubmitting = job?.status === "queued" || job?.status === "processing";

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const nextJob = await getJob(job.job_id);
        setJob(nextJob);
        if (nextJob.status === "completed" && nextJob.project_id) {
          const project = await getProject(nextJob.project_id);
          setResult(project);
          setPracticeTempo(options.practice_tempo);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not fetch analysis status.");
      }
    }, 1200);

    return () => window.clearInterval(interval);
  }, [job, options.practice_tempo]);

  async function handleSubmit() {
    if (!file && !options.youtube_url?.trim()) {
      return;
    }
    setError(null);
    setResult(null);
    setActivePhraseKey(null);
    try {
      const nextJob = await submitAnalysis(file, options);
      setJob(nextJob);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not submit audio.");
    }
  }

  function handlePhraseEdit(key: string, swaras: string) {
    setResult((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        sections: current.sections.map((section) => ({
          ...section,
          phrases: section.phrases.map((phrase) => {
            const phraseKey = `${section.name}-${phrase.label}-${phrase.start}`;
            return phraseKey === key ? { ...phrase, swaras } : phrase;
          }),
        })),
      };
    });
  }

  return (
    <main className="min-h-screen bg-[#fff8ec] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-saffron">AI Sitar notes</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight text-ink md:text-6xl">
            YouTube to Sitar notation.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-stone-700 md:text-lg">
            Paste a song link. Get readable Sitar notes, swaras, fret guidance, ornaments, and practice tips.
          </p>
        </header>

        <div className="space-y-5">
          <UploadPanel
            file={file}
            options={options}
            isSubmitting={isSubmitting}
            onFileChange={setFile}
            onOptionsChange={setOptions}
            onSubmit={handleSubmit}
          />
          {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <ProgressPanel job={job} />

          {result ? (
            <>
              <ExportPanel result={result} />
              <details className="rounded-[2rem] bg-white/90 p-5 shadow-soft md:p-7">
                <summary className="cursor-pointer text-sm font-semibold text-stone-700">
                  Detailed notation editor and practice tools
                </summary>
                <div className="mt-5 space-y-5">
                  <WaveformPlayer file={file} playbackRate={playbackRate} />
                  <PracticePanel
                    practiceTempo={practiceTempo}
                    playbackRate={playbackRate}
                    activePhraseKey={activePhraseKey}
                    onTempoChange={setPracticeTempo}
                    onPlaybackRateChange={setPlaybackRate}
                  />
                  <NotationViewer
                    result={result}
                    activePhraseKey={activePhraseKey}
                    onPhraseSelect={setActivePhraseKey}
                    onPhraseEdit={handlePhraseEdit}
                  />
                </div>
              </details>
            </>
          ) : (
            <section className="rounded-[2rem] border border-dashed border-amber-300 bg-white/60 p-8 text-center shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron">No notes yet</p>
              <h2 className="mt-3 text-2xl font-bold">Paste a YouTube link to begin</h2>
              <p className="mx-auto mt-2 max-w-xl text-stone-600">
                The generated notes will appear here inline. Exports and detailed editing stay tucked away.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
