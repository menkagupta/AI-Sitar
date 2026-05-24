import { Music2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ExportPanel } from "./components/ExportPanel";
import { Hero } from "./components/Hero";
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
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Hero />

        <div className="space-y-5">
          <UploadPanel
            file={file}
            options={options}
            isSubmitting={isSubmitting}
            onFileChange={setFile}
            onOptionsChange={setOptions}
            onSubmit={handleSubmit}
          />
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
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
            <EmptyStatePreview />
          )}
        </div>

        <footer className="pt-6 pb-2 text-center text-xs text-stone-500">
          Built for sitar students. Bhatkhande short notation, aligned lyrics, real fret guidance.
        </footer>
      </div>
    </main>
  );
}

function EmptyStatePreview() {
  return (
    <section className="rounded-[2rem] border border-amber-200/70 bg-white/70 p-8 shadow-soft backdrop-blur md:p-10">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-saffron/30 bg-saffron/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-raga">
            <Music2 className="h-3.5 w-3.5" />
            Sample output
          </div>
          <h2 className="font-display mt-4 text-2xl font-bold text-ink md:text-3xl">
            This is what a phrase looks like
          </h2>
          <p className="mt-2 max-w-xl text-stone-600">
            Lyrics line up directly above the swara they are sung on, sustains hold their own beat,
            and ornaments live inline as small marks. Paste a link above to generate yours.
          </p>
        </div>

        <div className="rounded-2xl bg-ink/95 p-5 font-mono text-sm leading-7 text-cream shadow-glow md:p-6">
          <div className="mb-2 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.24em] text-saffron/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-saffron" />
            Phrase 1
          </div>
          <pre className="whitespace-pre text-cream">
{`Shri Ram Chan dra | Kri pa lu Bhaj   man
Ṣ    Ṛ   G̣    Ṃ̍   | P̣‿  Ḏ̲  Ṉ̲  Ṡ    \u2014 \u2014
Da   Da  Da   Da  | Da  Da Da Da   \u2014 \u2014`}
          </pre>
        </div>
      </div>
    </section>
  );
}
