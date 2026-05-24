# AI Sitar Transcription

AI-assisted web app that turns any YouTube song into playable Sitar notation for musicians.
Paste a link, get a Bhatkhande-style transcription with lyrics, ornamentation, fingering, and
practice tools. Direct audio uploads (`mp3`, `wav`, `m4a`, `flac`) are also supported when you
already have a local file.

## Design Philosophy &mdash; One Input, Real Notation

The interface is deliberately minimalist. There is exactly **one thing to do on the home
screen**: paste a YouTube URL and press a single button. Everything else &mdash; file upload,
manual title or artist, raga hint, skill level, manual lyrics, notation style &mdash; lives
inside a single collapsed **Advanced options** disclosure for the times you need it. No
sidebars, no multi-step wizard, no settings carousel.

The output mirrors that philosophy. When the analysis finishes the app shows a single
scrollable column of bhajan-style notation:

```
1.
   Shri Ram Chandra Kripalu Bhajman
   Ṣ  Ṙ̲  G̣  Ṃ̍  | P̣‿  Ḋ̲  Ṅ̲  Ṡ
   Da Ra Da Ra | Da   Ra Da  Da
```

Lyrics on top (when known), Bhatkhande swaras in the middle, and the mizrab strokes
underneath &mdash; the same way a Sitar teacher writes a phrase in a student's notebook. The
waveform player, the detailed per-note table, practice loop controls, and the export
formats are all available, but each lives behind its own disclosure so the default view
stays uncluttered.

## Bhatkhande Notation, On Purpose

We render notes in **Bhatkhande short notation**, the system standardized by
[Vishnu Narayan Bhatkhande](https://en.wikipedia.org/wiki/Vishnu_Narayan_Bhatkhande) in the
early 20th century and the de facto written form for Hindustani classical music. It is
compact, language-agnostic, and the form most Indian classical students already read.

| Symbol | Meaning |
| --- | --- |
| `S R G M P D N` | shuddha (natural) swaras Sa Re Ga Ma Pa Dha Ni |
| `R̲  G̲  D̲  N̲` | komal (flat) Re Ga Dha Ni &mdash; underline below |
| `M̍` | tivra (sharp) Ma &mdash; vertical bar above |
| `Ṣ  Ṛ  Ḡ  Ṃ  Ṗ  Ḍ  Ṇ` | mandra saptak (lower octave) &mdash; dot below |
| `Ṡ  Ṙ  Ġ  Ṁ  Ṕ  Ḋ  Ṅ` | taar saptak (upper octave) &mdash; dot above |
| `‿` | meend &mdash; slide into the next note |
| `∿` | andolan &mdash; slow oscillation around the pitch |
| `ᵏ` | kan swara &mdash; grace note prefix |
| `( ... )` | murki &mdash; fast ornament cluster |
| `—` | sustain |
| `|` | vibhag (beat-group) boundary |

Why this instead of Western staff or a long verbose form like `komal Dha. tivra Ma.`?

- **Half the visual width**, so a full phrase fits on one line.
- **No language barrier** &mdash; the same glyphs work whether you read Devanagari, Gurmukhi,
  Tamil, or only Roman.
- **Ornament-aware** &mdash; meend, kan swara, murki, and andolan are first-class marks rather
  than parenthetical notes.
- **Already the de facto standard** in published bhajan books, classical institutions, and
  most Indian music teachers' notebooks.

The descriptive form (`Sa.`, `tivra Ma.`, `komal Dha.`) is still stored under the hood for
exports like MIDI and MusicXML, and the original verbose spelling shows up as a tooltip on
the detailed per-note table.

## Features

- **YouTube-first ingestion** &mdash; paste a video URL and the app fetches the best audio
  stream, title, artist, and (when available) captions automatically via `yt-dlp`
- Optional direct upload of `mp3`, `wav`, `m4a`, or `flac` files
- Async FastAPI analysis jobs with live progress
- Tempo, scale, pitch-contour, and section estimates
- Bhatkhande short-form swara notation with komal / tivra / saptak markings and
  meend / andolan / kan swara / murki ornaments inline
- Sitar-specific string/fret placement, fingering, and mizrab guidance per phrase
- Lyric extraction pipeline: manual input &rarr; known-song templates &rarr; YouTube captions
  &rarr; local Whisper speech-to-text, with script-mismatch and metadata filters to avoid
  garbled output
- Confidence scores and warnings for low-quality or complex audio
- Waveform playback, slow practice controls, phrase focus, and manual swara editing
- Export to `PDF`, `MIDI`, `MusicXML`, and `TXT`
- SQLite project persistence

## Run Locally

```bash
npm run install:all
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8000`

Open the frontend, paste a YouTube URL into the main input, and hit **Generate Sitar notes**.
For local audio, expand **Advanced options** and use the file picker.

## Sample Notations

Reference outputs (TXT, PDF, MIDI, MusicXML, JSON) live in [`samples/`](samples/). Generate a
transcription you like, hit "Download or export", and drop the file there using the naming
convention in `samples/README.md` to grow the collection.

## Notes On Accuracy

This is an AI-assisted transcription and teaching tool, not a guarantee of perfect
transcription. Polyphonic audio, heavy percussion, dense harmony, poor vocal separation, or
low recording quality can reduce pitch and section accuracy. The app prioritizes practical
Sitar playability over theoretical note-for-note transcription.

The backend uses `librosa` heuristics out of the box and is structured so dedicated melody
extraction, source separation, or transcription models such as Basic Pitch, Demucs, or custom
ornamentation models can be plugged into `backend/app/services/audio_pipeline.py`.

YouTube ingestion uses `yt-dlp` to download the best available audio stream. Availability
depends on network access, the video provider, and whether `yt-dlp` can reach that URL. The
caption fetcher is intentionally best-effort and limited to a small set of preferred
languages so it does not trigger YouTube's subtitle rate limits.
