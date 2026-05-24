# AI-Powered Sitar Transcription App

## PRIMARY GOAL

Build an AI-powered web app that converts any uploaded song into detailed, playable Sitar notation for musicians.

The app should:

1. Accept an uploaded audio file
2. Analyze the melody
3. Extract the dominant melodic line
4. Convert the melody into detailed Sitar notes
5. Generate practical, physically playable Sitar notation
6. Provide ornamentation and fingering guidance
7. Allow practice playback and export

The output should feel like a real Sitar teacher transcribed the song for a student.

---

# SUPPORTED INPUTS

## Audio formats
- mp3
- wav
- m4a
- flac

## Optional user inputs
- Song title
- Artist
- Language
- Preferred raga or scale
- Beginner / intermediate / advanced mode
- Practice tempo
- Preferred notation style:
  - Indian swaras
  - Western notes
  - Hybrid notation
- Song difficulty target

---

# CORE FEATURES

## 1. AUDIO ANALYSIS

The app should:

- Detect tempo (BPM)
- Detect key/scale
- Detect pitch contours
- Separate melody from percussion and harmony
- Prioritize lead vocal or lead instrument melody
- Segment song into sections:
  - intro
  - verse
  - chorus
  - bridge
  - outro

---

## 2. MELODY TRANSCRIPTION

The app should:

- Convert melody into note sequences
- Detect sustained notes
- Detect slides and transitions
- Detect ornamentation patterns
- Estimate note timing and duration
- Handle polyphonic audio as best as possible

---

## 3. SITAR ADAPTATION

The generated notation must be optimized specifically for Sitar performance, not generic music transcription.

The app should:

- Prefer idiomatic Sitar phrasing
- Suggest realistic finger movement
- Avoid impossible fret jumps
- Use meend wherever musically appropriate
- Maintain resonance and sustain
- Preserve emotional expression of the original song

---

## 4. OUTPUT GENERATION

For every musical phrase generate:

- Indian swaras
- Western notes
- String number
- Fret position
- Ornamentation
- Stroke direction
- Fingering suggestion
- Timing information
- Practice guidance

---

## 5. INTERACTIVE FEATURES

The app should support:

- Section playback
- Slow practice playback
- Loop playback
- Manual note editing
- Export to:
  - PDF
  - MIDI
  - MusicXML
  - TXT
- Save projects
- Compare original audio with generated notation

---

# SITAR KNOWLEDGE BASE

## Instrument

Standard Hindustani classical Sitar with 18–20 frets.

## Main playing strings

- 1st string: Ma
- 2nd string: Sa
- 3rd string: Pa
- 4th string: Lower Sa

Use realistic Sitar performance rules.

---

## Notation system

Use Indian swaras:

- Sa
- Re
- Ga
- Ma
- Pa
- Dha
- Ni

Support:

- Komal swaras
- Tivra Ma
- Octave markings

---

## Octaves

- Mandra saptak
- Madhya saptak
- Taar saptak

---

# PLAYING RULES

The AI must understand:

- Meend-based transitions
- Sustained resonance
- Chikari usage
- String bending limitations
- Finger reach limitations
- Traditional phrasing styles
- Natural Sitar articulation

Prefer:

- Melodic continuity
- Efficient hand movement
- Traditional ornamentation
- Resonant open-string usage

Avoid:

- Impossible stretches
- Non-playable jumps
- Piano-like note spacing
- Unrealistic simultaneous notes

---

# ORNAMENTATION DETECTION

Recognize and annotate:

- Meend
- Gamak
- Murki
- Krintan
- Kan swaras
- Andolan

Generate explicit guidance such as:

- Light meend from Re to Ga
- Slow gamak on Dha
- Fast murki around Ma
- Sustain Pa for 2 beats

---

# MIZRAB GUIDANCE

Provide:

- Stroke direction
- Picking emphasis
- Rhythmic articulation
- Suggested plucking patterns

---

# OUTPUT FORMAT

For each section display:

- Section name
- Timestamp range
- Tempo
- Detected scale
- Suggested raga flavor if applicable

Then show:

## SWARAS

```text
Sa Re Ga Ma | Pa Ma Ga Re | Sa
```

## WESTERN NOTES

```text
C D E F | G F E D | C
```

## SITAR TAB STYLE

```text
Sa(2-0) Re(2-2) Ga(2-4 meend) Ma(1-0)
```

Where:

```text
(string-fret)
```

Then show:

- Ornamentation notes
- Fingering guidance
- Practice tips
- Suggested tempo for learning

---

# EXAMPLE OUTPUT

## Section: Verse 1

- Timestamp: 00:18 – 00:42
- Tempo: 86 BPM
- Scale: C# minor
- Suggested raga flavor: Yaman-inspired phrasing

### Swaras

```text
Sa Re Ga Ma | Pa Ma Ga Re | Sa
```

### Western notes

```text
C# D# E F# | G# F# E D# | C#
```

### Sitar notation

```text
Sa(2-0)
Re(2-2)
Ga(2-4 meend)
Ma(1-0)
```

### Performance guidance

- Begin on main playing string
- Use smooth meend from Re to Ga
- Add light murki around Ga Ma
- Sustain Sa for 2 beats
- Use chikari after phrase ending

### Practice mode

- Recommended practice tempo: 60 BPM
- Loop difficult phrase automatically

---

# AI / ML REQUIREMENTS

Use:

- Melody extraction models
- Pitch detection
- Audio source separation
- Music transcription models
- Sequence modeling for ornamentation

## Suggested libraries

- librosa
- basic-pitch
- pretty_midi
- music21
- scipy
- torchaudio

---

# TECH STACK

## Frontend

- React
- Tailwind
- Waveform visualization
- Audio playback controls

## Backend

- Python
- FastAPI

## Database

- PostgreSQL or SQLite

---

# ARCHITECTURE

The system should support:

- Modular services
- Clear transcription pipeline
- Async processing for long songs
- Queue-based analysis jobs

---

# USER EXPERIENCE

The UI should include:

1. Upload screen
2. Audio waveform visualization
3. Analysis progress indicator
4. Generated notation viewer
5. Phrase-by-phrase playback
6. Practice mode
7. Export panel
8. Manual correction editor

---

# IMPORTANT CONSTRAINTS

- Do not claim perfect transcription accuracy.
- Display confidence scores.
- Warn users when audio quality is poor.
- Warn users when polyphonic complexity reduces accuracy.
- Prioritize playability over theoretical perfection.
- Keep notation understandable for real musicians.
- Generate human-readable explanations.
- Make the app useful for both beginners and advanced Sitar players.

---

# FINAL PRODUCT VISION

The final app should feel like:

> AI-assisted Sitar transcription and teaching system.
