from __future__ import annotations

from dataclasses import dataclass


NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR_SWARAS = ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni"]
MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11]


@dataclass(frozen=True)
class SitarPosition:
    string: int
    fret: int
    open_midi: int


# Practical approximation for common C#-rooted Hindustani sitar tuning.
SITAR_STRINGS = [
    SitarPosition(string=1, fret=0, open_midi=66),  # Ma/F#
    SitarPosition(string=2, fret=0, open_midi=61),  # Sa/C#
    SitarPosition(string=3, fret=0, open_midi=56),  # Pa/G#
    SitarPosition(string=4, fret=0, open_midi=49),  # lower Sa/C#
]


def midi_to_note_name(midi_note: int) -> str:
    octave = midi_note // 12 - 1
    return f"{NOTE_NAMES[midi_note % 12]}{octave}"


def note_name_without_octave(midi_note: int) -> str:
    return NOTE_NAMES[midi_note % 12]


def swara_for_midi(midi_note: int, tonic_midi: int) -> str:
    semitone = (midi_note - tonic_midi) % 12
    octave_offset = (midi_note - tonic_midi) // 12
    if semitone in MAJOR_INTERVALS:
        swara = MAJOR_SWARAS[MAJOR_INTERVALS.index(semitone)]
    else:
        altered = {
            1: "komal Re",
            3: "komal Ga",
            6: "tivra Ma",
            8: "komal Dha",
            10: "komal Ni",
        }
        swara = altered.get(semitone, "kan swara")

    if octave_offset < 0:
        return f"{swara}."
    if octave_offset > 0:
        return f"{swara}'"
    return swara


def best_sitar_position(midi_note: int, previous: tuple[int, int] | None = None) -> tuple[int, int]:
    candidates: list[tuple[int, int, int]] = []
    for string in SITAR_STRINGS:
        fret = midi_note - string.open_midi
        if 0 <= fret <= 19:
            movement_cost = 0
            if previous:
                movement_cost = abs(previous[1] - fret) + (0 if previous[0] == string.string else 2)
            resonance_bonus = -2 if fret == 0 else 0
            candidates.append((movement_cost + abs(fret - 7) + resonance_bonus, string.string, fret))

    if not candidates:
        nearest = min(SITAR_STRINGS, key=lambda string: abs(midi_note - string.open_midi))
        return nearest.string, max(0, min(19, midi_note - nearest.open_midi))

    _, string, fret = min(candidates)
    return string, fret


def ornamentation_for_motion(previous_midi: int | None, midi_note: int, duration: float) -> str | None:
    if previous_midi is None:
        return None
    interval = midi_note - previous_midi
    if 1 <= abs(interval) <= 3 and duration >= 0.35:
        return "meend"
    if abs(interval) == 0 and duration >= 0.9:
        return "andolan"
    if abs(interval) >= 7:
        return "kan swara"
    if duration < 0.22:
        return "murki"
    return None


def stroke_for_index(index: int, ornamentation: str | None) -> str:
    if ornamentation in {"meend", "andolan"}:
        return "Da, sustain"
    return "Da" if index % 2 == 0 else "Ra"


def fingering_for_position(string: int, fret: int, ornamentation: str | None) -> str:
    if fret == 0:
        return "open string; let it resonate"
    finger = "index" if fret <= 7 else "middle" if fret <= 12 else "ring"
    if ornamentation == "meend":
        return f"{finger} finger, pull smoothly toward target pitch"
    if ornamentation == "andolan":
        return f"{finger} finger, slow controlled oscillation"
    return f"{finger} finger on string {string}, fret {fret}"


def raga_flavor_for_scale(scale: str, preferred: str | None = None) -> str:
    if preferred:
        return f"{preferred}-inspired phrasing"
    lowered = scale.lower()
    if "major" in lowered:
        return "Bilawal/Yaman-adjacent, use bright sustained nyas notes"
    if "minor" in lowered:
        return "Kafi/Asavari-adjacent, emphasize expressive komal movements"
    return "melody-led raga flavor; confirm with a teacher for classical accuracy"
