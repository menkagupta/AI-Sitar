from __future__ import annotations

import math
import uuid
from pathlib import Path
from typing import Callable

import numpy as np

from app.schemas import AnalysisResult, LyricSegment, NoteEvent, Phrase, ProjectOptions, Section
from app.services.lyrics import estimate_lyrics_from_audio, known_lyrics_for_title
from app.services.notation import decorate_bhatkhande
from app.services.sitar_knowledge import (
    best_sitar_position,
    fingering_for_position,
    midi_to_note_name,
    note_name_without_octave,
    ornamentation_for_motion,
    raga_flavor_for_scale,
    stroke_for_index,
    swara_for_midi,
)


class AnalysisProgress:
    def __init__(self, on_update: Callable[[int, str], None] | None = None) -> None:
        self.progress = 0
        self.message = "Queued"
        self.on_update = on_update

    def update(self, progress: int, message: str) -> None:
        self.progress = progress
        self.message = message
        if self.on_update:
            self.on_update(progress, message)


def analyze_audio(file_path: Path, options: ProjectOptions, progress: AnalysisProgress) -> AnalysisResult:
    progress.update(10, "Loading audio and estimating quality")
    audio, sample_rate, duration, warnings = _load_audio(file_path)
    title = options.song_title or file_path.stem

    progress.update(25, "Detecting tempo, key, and scale")
    tempo = _estimate_tempo(audio, sample_rate)
    tonic_midi, detected_scale = _estimate_scale(audio, sample_rate, options.preferred_raga)

    progress.update(45, "Extracting dominant melodic contour")
    melody = _extract_melody(audio, sample_rate, duration, tonic_midi)
    if not melody:
        warnings.append("Could not confidently extract melody; generated a practice-oriented approximation.")
        melody = _fallback_melody(duration, tonic_midi)

    progress.update(65, "Adapting melody for playable Sitar positions")
    sections = _build_sections(melody, duration, tempo, tonic_midi, detected_scale, options)

    lyrics_text = options.lyrics
    lyric_segments = options.lyric_segments or []
    if not lyrics_text and not lyric_segments:
        lyrics_text = known_lyrics_for_title(title)
    if not lyrics_text and not lyric_segments:
        progress.update(78, "Estimating lyrics from vocals")
        lyrics_text, lyric_segments = estimate_lyrics_from_audio(file_path, options.language, title)
        if lyrics_text:
            warnings.append("Lyrics were estimated from speech-to-text and should be reviewed against the original.")
        else:
            warnings.append("Lyrics could not be confidently transcribed; lyric row omitted from this phrase.")
    _assign_lyrics(sections, lyrics_text, lyric_segments, title)

    progress.update(85, "Adding ornamentation, fingering, and practice guidance")
    confidence = _confidence_from_warnings(warnings, len(melody))
    result = AnalysisResult(
        project_id=str(uuid.uuid4()),
        title=title,
        artist=options.artist,
        duration=duration,
        tempo=tempo,
        detected_key=note_name_without_octave(tonic_midi),
        detected_scale=detected_scale,
        overall_confidence=confidence,
        warnings=warnings,
        sections=sections,
        teacher_summary=(
            "This is an AI-assisted transcription optimized for Sitar playability. "
            "Treat the swaras and frets as a strong starting point, then refine meend length "
            "and ornament intensity by listening phrase-by-phrase."
        ),
    )
    progress.update(100, "Analysis complete")
    return result


def _load_audio(file_path: Path) -> tuple[np.ndarray, int, float, list[str]]:
    warnings: list[str] = []
    try:
        import librosa

        audio, sample_rate = librosa.load(file_path, sr=22050, mono=True)
        duration = float(librosa.get_duration(y=audio, sr=sample_rate))
    except Exception as exc:
        sample_rate = 22050
        duration = 48.0
        audio = np.zeros(sample_rate * int(duration), dtype=np.float32)
        warnings.append(
            f"Audio ML libraries could not decode this file ({exc.__class__.__name__}); showing a structured demo transcription."
        )

    if duration > 0 and np.max(np.abs(audio)) < 0.02:
        warnings.append("Audio level is very low; pitch confidence may be reduced.")
    if duration > 480:
        warnings.append("Long songs take more review; section boundaries are approximate.")
    return audio, sample_rate, max(duration, 1.0), warnings


def _estimate_tempo(audio: np.ndarray, sample_rate: int) -> float:
    try:
        import librosa

        tempo, _ = librosa.beat.beat_track(y=audio, sr=sample_rate)
        return float(np.asarray(tempo).mean() or 86.0)
    except Exception:
        return 86.0


def _estimate_scale(audio: np.ndarray, sample_rate: int, preferred_raga: str | None) -> tuple[int, str]:
    if preferred_raga:
        return 61, f"{preferred_raga} user preference"
    try:
        import librosa

        chroma = librosa.feature.chroma_cqt(y=audio, sr=sample_rate)
        pitch_class = int(np.argmax(np.mean(chroma, axis=1)))
        tonic_midi = 60 + pitch_class
        major_score = sum(np.mean(chroma, axis=1)[i % 12] for i in [pitch_class, pitch_class + 4, pitch_class + 7])
        minor_score = sum(np.mean(chroma, axis=1)[i % 12] for i in [pitch_class, pitch_class + 3, pitch_class + 7])
        mode = "minor" if minor_score > major_score else "major"
        return tonic_midi, f"{note_name_without_octave(tonic_midi)} {mode}"
    except Exception:
        return 61, "C# minor"


def _extract_melody(
    audio: np.ndarray,
    sample_rate: int,
    duration: float,
    tonic_midi: int,
) -> list[tuple[float, float, int, float]]:
    try:
        import librosa

        f0, voiced_flag, voiced_prob = librosa.pyin(
            audio,
            fmin=librosa.note_to_hz("C3"),
            fmax=librosa.note_to_hz("C6"),
            sr=sample_rate,
        )
        times = librosa.times_like(f0, sr=sample_rate)
        notes: list[tuple[float, float, int, float]] = []
        current_note: int | None = None
        start = 0.0
        probabilities: list[float] = []

        for time, frequency, voiced, probability in zip(times, f0, voiced_flag, voiced_prob, strict=False):
            if not voiced or frequency is None or math.isnan(float(frequency)):
                if current_note is not None and time - start > 0.12:
                    notes.append((start, float(time - start), current_note, float(np.mean(probabilities) or 0.45)))
                current_note = None
                probabilities = []
                continue
            midi = int(round(librosa.hz_to_midi(float(frequency))))
            if current_note is None:
                current_note = midi
                start = float(time)
                probabilities = [float(probability)]
            elif abs(midi - current_note) <= 1:
                probabilities.append(float(probability))
            else:
                if time - start > 0.12:
                    notes.append((start, float(time - start), current_note, float(np.mean(probabilities) or 0.5)))
                current_note = midi
                start = float(time)
                probabilities = [float(probability)]

        if current_note is not None:
            notes.append((start, max(0.2, duration - start), current_note, float(np.mean(probabilities) or 0.5)))
        return _thin_notes(notes)
    except Exception:
        return _fallback_melody(duration, tonic_midi)


def _thin_notes(notes: list[tuple[float, float, int, float]]) -> list[tuple[float, float, int, float]]:
    thinned: list[tuple[float, float, int, float]] = []
    for note in notes:
        if thinned and thinned[-1][2] == note[2] and note[0] - (thinned[-1][0] + thinned[-1][1]) < 0.15:
            previous = thinned.pop()
            thinned.append((previous[0], previous[1] + note[1], previous[2], max(previous[3], note[3])))
        else:
            thinned.append(note)
    return thinned[:160]


def _fallback_melody(duration: float, tonic_midi: int) -> list[tuple[float, float, int, float]]:
    pattern = [0, 2, 3, 5, 7, 5, 3, 2, 0, 7, 8, 7, 5, 3, 2, 0]
    beat = max(0.45, min(0.85, duration / 64))
    notes = []
    for index, interval in enumerate(pattern * max(2, int(duration // (beat * len(pattern))) + 1)):
        start = index * beat
        if start >= duration:
            break
        notes.append((start, min(beat * 0.92, duration - start), tonic_midi + interval, 0.42))
    return notes


def _build_sections(
    melody: list[tuple[float, float, int, float]],
    duration: float,
    tempo: float,
    tonic_midi: int,
    detected_scale: str,
    options: ProjectOptions,
) -> list[Section]:
    names = ["Intro", "Verse", "Chorus", "Bridge", "Outro"]
    count = min(len(names), max(1, int(duration // 24) + 1))
    section_length = duration / count
    sections: list[Section] = []

    for section_index in range(count):
        start = section_index * section_length
        end = duration if section_index == count - 1 else (section_index + 1) * section_length
        section_notes = [note for note in melody if start <= note[0] < end]
        phrases = _build_phrases(section_notes, start, end, tonic_midi, options)
        sections.append(
            Section(
                name=names[section_index],
                start=start,
                end=end,
                tempo=tempo,
                detected_scale=detected_scale,
                suggested_raga_flavor=raga_flavor_for_scale(detected_scale, options.preferred_raga),
                confidence=max(0.35, min(0.92, float(np.mean([note[3] for note in section_notes])) if section_notes else 0.4)),
                phrases=phrases,
            )
        )
    return sections


def _assign_lyrics(
    sections: list[Section],
    lyrics: str | None,
    lyric_segments: list[LyricSegment] | None = None,
    title: str | None = None,
) -> None:
    phrases = [phrase for section in sections for phrase in section.phrases]
    if not phrases:
        return

    if lyric_segments:
        for phrase in phrases:
            overlapping = [
                segment.text
                for segment in lyric_segments
                if _overlaps(segment.start, segment.end, phrase.start, phrase.end)
            ]
            phrase.lyrics = " ".join(overlapping).strip() or None
        return

    lyric_lines = [line.strip() for line in (lyrics or "").splitlines() if line.strip()]
    if lyric_lines:
        for index, phrase in enumerate(phrases):
            phrase.lyrics = lyric_lines[index] if index < len(lyric_lines) else None
        return

    words = [word.strip() for word in (lyrics or "").replace("\n", " ").split() if word.strip()]
    if not words:
        for phrase in phrases:
            phrase.lyrics = None
        return

    words_per_phrase = max(1, math.ceil(len(words) / len(phrases)))
    for index, phrase in enumerate(phrases):
        start = index * words_per_phrase
        end = start + words_per_phrase
        phrase.lyrics = " ".join(words[start:end]) or None


def _overlaps(segment_start: float, segment_end: float, phrase_start: float, phrase_end: float) -> bool:
    if segment_end <= segment_start:
        return phrase_start <= segment_start <= phrase_end
    return max(segment_start, phrase_start) < min(segment_end, phrase_end)


def _build_phrases(
    notes: list[tuple[float, float, int, float]],
    start: float,
    end: float,
    tonic_midi: int,
    options: ProjectOptions,
) -> list[Phrase]:
    if not notes:
        return []

    phrase_size = 8 if options.skill_level == "beginner" else 12 if options.skill_level == "intermediate" else 16
    phrases: list[Phrase] = []
    previous_position: tuple[int, int] | None = None
    previous_midi: int | None = None

    for phrase_index in range(0, len(notes), phrase_size):
        chunk = notes[phrase_index : phrase_index + phrase_size]
        events: list[NoteEvent] = []
        ornament_guidance: list[str] = []
        fingering_guidance: list[str] = []
        practice_tips: list[str] = []

        for index, (note_start, duration, midi_note, confidence) in enumerate(chunk):
            string, fret = best_sitar_position(midi_note, previous_position)
            ornamentation = ornamentation_for_motion(previous_midi, midi_note, duration)
            swara = swara_for_midi(midi_note, tonic_midi)
            western = midi_to_note_name(midi_note)
            stroke = stroke_for_index(index, ornamentation)
            fingering = fingering_for_position(string, fret, ornamentation)
            event = NoteEvent(
                swara=swara,
                western=western,
                string=string,
                fret=fret,
                start=round(note_start, 3),
                duration=round(duration, 3),
                ornamentation=ornamentation,
                stroke=stroke,
                fingering=fingering,
                confidence=max(0.2, min(0.98, confidence)),
            )
            events.append(event)
            if ornamentation == "meend":
                ornament_guidance.append(f"Light meend into {swara} on string {string}.")
            elif ornamentation == "andolan":
                ornament_guidance.append(f"Slow andolan on {swara}; keep the pitch centered.")
            elif ornamentation == "murki":
                ornament_guidance.append(f"Fast murki around {swara}; keep it light.")
            elif ornamentation == "kan swara":
                ornament_guidance.append(f"Use a quick kan swara before landing on {swara}.")

            if fret > 14:
                fingering_guidance.append(f"Prepare the left hand early for high fret {fret}.")
            previous_position = (string, fret)
            previous_midi = midi_note

        if any(event.duration > 0.85 for event in events):
            practice_tips.append("Let sustained notes ring fully before the next stroke.")
        if any(event.ornamentation == "meend" for event in events):
            practice_tips.append("Practice meend slowly first, then add rhythmic pulse.")
        practice_tips.append(f"Start at {options.practice_tempo} BPM and loop this phrase until motion feels relaxed.")

        phrases.append(
            Phrase(
                label=f"Phrase {len(phrases) + 1}",
                start=round(chunk[0][0], 3),
                end=round(min(end, chunk[-1][0] + chunk[-1][1]), 3),
                swaras=" ".join(decorate_bhatkhande(event.swara, event.ornamentation) for event in events),
                western_notes=" ".join(event.western for event in events),
                sitar_tab=" ".join(
                    f"{decorate_bhatkhande(event.swara, event.ornamentation)}({event.string}-{event.fret})"
                    for event in events
                ),
                notes=events,
                ornamentation_notes=ornament_guidance or ["Play cleanly first; add ornamentation after the phrase is stable."],
                fingering_guidance=fingering_guidance or ["Keep the left hand close to the frets and avoid lifting fingers too high."],
                practice_tips=practice_tips,
            )
        )
    return phrases


def _confidence_from_warnings(warnings: list[str], note_count: int) -> float:
    confidence = 0.82
    confidence -= min(0.3, len(warnings) * 0.12)
    if note_count < 8:
        confidence -= 0.18
    return max(0.25, min(0.94, confidence))
