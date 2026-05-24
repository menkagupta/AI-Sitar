import type { AnalysisJob } from "../types/api";

export function ProgressPanel({ job }: { job: AnalysisJob | null }) {
  if (!job) {
    return null;
  }

  return (
    <section className="rounded-3xl bg-ink p-5 text-white shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Analysis</p>
          <h3 className="text-xl font-bold">{job.message}</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{job.progress}%</span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${job.progress}%` }} />
      </div>
      {job.error && <p className="mt-3 text-sm text-red-200">{job.error}</p>}
    </section>
  );
}
