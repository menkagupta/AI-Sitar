import { ArrowUp, Music2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

  const progressRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

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
      window.requestAnimationFrame(() => {
        progressRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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

  const canSubmit = Boolean(file || options.youtube_url?.trim());

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl space-y-8 md:space-y-10">
        <Hero
          form={{
            youtubeUrl: options.youtube_url ?? "",
            onYoutubeUrlChange: (value) => setOptions({ ...options, youtube_url: value }),
            onSubmit: handleSubmit,
            isSubmitting,
            canSubmit,
          }}
        />

        <section
          id="advanced"
          aria-label="Advanced options"
          className="scroll-mt-6"
        >
          <UploadPanel
            file={file}
            options={options}
            onFileChange={setFile}
            onOptionsChange={setOptions}
          />
        </section>

        <section ref={progressRef} aria-label="Analysis progress" className="space-y-5 scroll-mt-6">
          {(job || error) && <StepHeading number={1} title="We're listening to your song" />}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <ProgressPanel job={job} />
        </section>

        <section ref={resultsRef} aria-label="Generated notes" className="scroll-mt-6 space-y-5">
          {result ? (
            <>
              <StepHeading number={2} title="Your Sitar notes" />
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
            !job && <EmptyStatePreview />
          )}
        </section>

        <footer className="flex flex-col items-center gap-4 pt-6 pb-4 text-center text-xs text-stone-500">
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/70 px-3 py-1.5 text-stone-600 transition hover:text-stone-800"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Back to top
          </a>
          <span>Built for sitar students. Bhatkhande short notation, aligned lyrics, real fret guidance.</span>
        </footer>
      </div>
    </main>
  );
}

function StepHeading({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #d97706 0%, #8b3a1c 100%)" }}
      >
        {number}
      </span>
      <h2
        className="text-xl font-bold text-stone-900 md:text-2xl"
        style={{ fontFamily: "Fraunces, Georgia, serif" }}
      >
        {title}
      </h2>
    </div>
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
            and ornaments live inline as small marks. Paste a link at the top to generate yours.
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
