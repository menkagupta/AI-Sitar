import { Repeat, SlidersHorizontal } from "lucide-react";

interface PracticePanelProps {
  practiceTempo: number;
  playbackRate: number;
  activePhraseKey: string | null;
  onTempoChange: (tempo: number) => void;
  onPlaybackRateChange: (rate: number) => void;
}

export function PracticePanel({
  practiceTempo,
  playbackRate,
  activePhraseKey,
  onTempoChange,
  onPlaybackRateChange,
}: PracticePanelProps) {
  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-sandal p-3 text-raga">
          <SlidersHorizontal className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron">Practice mode</p>
          <h3 className="text-xl font-bold">Slow, loop, refine</h3>
          <p className="mt-1 text-sm text-stone-600">
            Focused phrase: {activePhraseKey ? activePhraseKey.split("-").join(" ") : "select a phrase below"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Recommended practice tempo
          <input
            type="range"
            min={30}
            max={140}
            value={practiceTempo}
            onChange={(event) => onTempoChange(Number(event.target.value))}
            className="mt-3 w-full accent-raga"
          />
          <span className="mt-1 block text-stone-600">{practiceTempo} BPM</span>
        </label>
        <label className="text-sm font-medium">
          Original audio playback speed
          <input
            type="range"
            min={0.35}
            max={1}
            step={0.05}
            value={playbackRate}
            onChange={(event) => onPlaybackRateChange(Number(event.target.value))}
            className="mt-3 w-full accent-raga"
          />
          <span className="mt-1 block text-stone-600">{Math.round(playbackRate * 100)}%</span>
        </label>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-sandal p-3 text-sm text-raga">
        <Repeat className="h-4 w-4" />
        Loop playback can be practiced by selecting a phrase and replaying its timestamp against the waveform.
      </div>
    </section>
  );
}
