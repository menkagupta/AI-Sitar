# Sample Generated Notes

A curated collection of Sitar notation outputs produced by AI Sitar. Use these as reference
material when reviewing what the analyzer can produce, when testing notation rendering, or
when demoing the project.

## What goes here

Any file the app can export, for example:

- `*.txt`        plain Bhatkhande short notation (the inline view)
- `*.pdf`        printable score
- `*.midi`       playback-ready MIDI rendering
- `*.musicxml`   editable score for MuseScore / Finale / Dorico
- `*.json`       the raw `AnalysisResult` payload (useful for re-rendering the UI without
                 re-running the pipeline)

Hand-curated reference versions are welcome too. Mark them clearly in the file header so they
are not confused with raw model output.

## Naming convention

```
<kebab-case-title>__<short-source-or-artist>.<ext>
```

Examples:

- `shri-ram-chandra-kripalu-bhajman__rambhajan-classic.txt`
- `aarti-keeje-hanuman-lala-ki__gulshan-kumar.pdf`
- `shiv-kailasho-ke-vasi__hari-om-sharan.midi`

Keep titles ASCII, lowercase, and dash-separated. The double-underscore separates the song
from the source artist or arrangement variant.

## How to add a new sample

1. Run the app on the source audio or YouTube link.
2. From the "Download or export" disclosure in the UI, export the format you want to keep
   (TXT is the most readable; MIDI is the most useful for playback verification).
3. Save the export into this directory using the naming convention above.
4. If you are committing the sample to git, prefix the file with a short comment block
   describing the source so future readers know its provenance:

   ```
   # Source: https://www.youtube.com/watch?v=...
   # Generated: 2026-05-24 by AI Sitar v0.1
   # Notes: Bhatkhande short notation. Lyrics from known-song template.
   ```

## Notation legend

All TXT and PDF samples in this directory use the project's Bhatkhande short notation:

```
underline = komal       (R̲ G̲ D̲ N̲)
M̍         = tivra Ma
dot below = mandra saptak (Ṣ Ṛ Ḡ Ṃ Ṗ Ḍ Ṇ)
dot above = taar saptak   (Ṡ Ṙ Ġ Ṁ Ṕ Ḋ Ṅ)
‿         = meend (slide into next note)
∿         = andolan (slow oscillation)
ᵏ         = kan swara (grace note prefix)
( ... )   = murki (fast ornament cluster)
—         = sustain
|         = vibhag (beat-group) boundary
```
