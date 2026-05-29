# AI Sitar Transcription

AI-assisted web app that turns any YouTube song into playable Sitar notation for musicians.
Paste a link, get a sitar bhajan transcription with lyrics, ornamentation, fingering, and
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
   Shri Ram Chan dra | Kri pa lu Bhaj man
   S    R   G   m   | P‿   d  n  Ṡ   —  —
   Da   Ra  Da  Ra  | Da   Ra Da Da  —  —
```

Lyrics on top (when known), sitar swaras in the middle, and the mizraab strokes underneath
&mdash; the same way a sitar teacher writes a phrase in a student's notebook. The waveform
player, the detailed per-note table, practice loop controls, and the export formats are all
available, but each lives behind its own disclosure so the default view stays uncluttered.

## Sitar Bhajan Notation, On Purpose

We follow the **sitar-adapted notation** documented at
[sitarbhajans.org](https://www.sitarbhajans.org/notation/), which itself builds on Bhatkhande
and Ravi Shankar with modifications specifically for the sitar &mdash; especially for
gamakas, meends, and mizraab strokes. It is compact, language-agnostic, and reads naturally
to anyone who plays Hindustani sitar.

| Symbol | Meaning |
| --- | --- |
| `S R G M P D N` | shuddha (natural) swaras Sa Re Ga Ma Pa Dha Ni |
| `r g d n` | komal (flat) Re Ga Dha Ni &mdash; lowercase |
| `m` | tivra (sharp) Ma &mdash; lowercase |
| `Ṣ ṛ g̣ ṃ ṗ ḍ ṇ` | mandra saptak (lower octave) &mdash; dot below |
| `Ṡ ṙ ġ ṁ ṗ ḋ ṅ` | taar saptak (upper octave) &mdash; dot above |
| `Da` / `Ra` | mizraab strokes, rendered on the row beneath each swara |
| `Da Ra` (adjacent) | **Diri** &mdash; rapid Da-Ra combination, in sitarbhajans.org terms |
| `‿` | meend &mdash; slide into the next note |
| `∿` | andolan &mdash; slow oscillation around the pitch |
| `ᵏ` | kan swara &mdash; grace note prefix |
| `( ... )` | murki &mdash; fast ornament cluster |
| `—` | sustain |
| `\|` | vibhag (beat-group) boundary |

Why this instead of Western staff, generic Bhatkhande, or a verbose form like
`komal Dha. tivra Ma.`?

- **Case carries the variant.** `r g d n m` for komal and tivra is half the visual width of
  combining underlines and bars, and far easier to read in plain text and on mobile.
- **Sitar-specific.** The sitarbhajans.org spec defines mizraab strokes (Da, Ra, Diri) and
  sitar-specific ornaments (meend, ghaseet, ched, aaghaata, krintan, gamak); generic
  Bhatkhande does not.
- **Ornament-aware.** Meend, kan swara, murki, and andolan are first-class inline marks
  rather than parenthetical asides.
- **Already the convention** in published sitar bhajan books and in most teachers' notebooks.

The descriptive form (`Sa.`, `tivra Ma.`, `komal Dha.`) is still stored under the hood for
exports like MIDI and MusicXML, and the original verbose spelling shows up as a tooltip on
the detailed per-note table.

> The analyzer currently emits **meend**, **andolan**, **kan swara**, and **murki**. Other
> sitarbhajans.org symbols &mdash; ghaseet, ched, aaghaata, krintan, gamak, adhaar svara,
> sankeerna meend, emphasized Da/Ra &mdash; are part of the notation system but not yet
> auto-detected by the analyzer.

## Features

- **YouTube-first ingestion** &mdash; paste a video URL and the app fetches the best audio
  stream, title, artist, and (when available) captions automatically via `yt-dlp`
- Optional direct upload of `mp3`, `wav`, `m4a`, or `flac` files
- Async FastAPI analysis jobs with live progress
- Tempo, scale, pitch-contour, and section estimates
- Sitar bhajan short-form swara notation with komal / tivra / saptak markings and
  meend / andolan / kan swara / murki ornaments inline
- Sitar-specific string/fret placement, fingering, and mizraab guidance per phrase
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
