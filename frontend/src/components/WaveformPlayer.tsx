import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformPlayerProps {
  file: File | null;
  playbackRate: number;
}

export function WaveformPlayer({ file, playbackRate }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !file) {
      return;
    }

    const url = URL.createObjectURL(file);
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#f2c078",
      progressColor: "#8b3a1c",
      cursorColor: "#18120f",
      barWidth: 2,
      height: 90,
    });
    wavesurfer.load(url);
    wavesurfer.on("finish", () => setIsPlaying(false));
    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
      URL.revokeObjectURL(url);
      wavesurferRef.current = null;
    };
  }, [file]);

  useEffect(() => {
    wavesurferRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  function togglePlayback() {
    wavesurferRef.current?.playPause();
    setIsPlaying((value) => !value);
  }

  if (!file) {
    return null;
  }

  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-saffron">Waveform</p>
          <h3 className="text-xl font-bold">Original audio comparison</h3>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
      <div ref={containerRef} />
    </section>
  );
}
