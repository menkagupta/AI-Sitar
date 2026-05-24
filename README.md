# AI Sitar Transcription

AI-assisted web app that converts uploaded songs into playable Sitar notation for musicians.

## Features

- Upload `mp3`, `wav`, `m4a`, or `flac`, or provide a YouTube link
- Async FastAPI analysis jobs with progress
- Tempo, scale, pitch-contour, and section estimates
- Sitar-specific swara, western-note, string/fret, ornamentation, fingering, and mizrab guidance
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

## Notes On Accuracy

This is an AI-assisted transcription and teaching tool, not a guarantee of perfect transcription. Polyphonic audio,
heavy percussion, dense harmony, poor vocal separation, or low recording quality can reduce pitch and section accuracy.
The app prioritizes practical Sitar playability over theoretical note-for-note transcription.

The backend uses `librosa` heuristics out of the box and is structured so dedicated melody extraction, source separation,
or transcription models such as Basic Pitch, Demucs, or custom ornamentation models can be plugged into
`backend/app/services/audio_pipeline.py`.

YouTube ingestion uses `yt-dlp` to download the best available audio stream before analysis. Availability can depend on
network access, the video provider, and whether `yt-dlp` can access that URL.
