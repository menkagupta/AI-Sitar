"""Bhatkhande short notation renderer.

Maps the descriptive swara strings produced by the analysis pipeline
("Sa", "komal Re", "tivra Ma.", "Dha'", ...) into the compact form
used in published Bhatkhande books:

  - Sa Re Ga Ma Pa Dha Ni   -> S  R  G  M  P  D  N
  - komal (flat)            -> underline below the letter   (R\u0332 G\u0332 D\u0332 N\u0332)
  - tivra Ma                -> vertical line above the M    (M\u030d)
  - mandra saptak (lower)   -> dot below the letter         (S\u0323 R\u0323 ...)
  - taar saptak (upper)     -> dot above the letter         (S\u0307 R\u0307 ...)
  - meend                   -> undertie suffix              (...\u203f)
  - andolan                 -> sine-wave suffix             (...\u223f)
  - kan swara (grace)       -> small leading marker         (\u1d4f<note>)
  - murki                   -> parenthesised cluster
  - sustain                 -> em dash                      (\u2014)
"""

from __future__ import annotations


COMBINING_LOW_LINE = "\u0332"           # komal
COMBINING_VERTICAL_LINE_ABOVE = "\u030d" # tivra Ma
COMBINING_DOT_BELOW = "\u0323"          # mandra saptak
COMBINING_DOT_ABOVE = "\u0307"          # taar saptak
UNDERTIE = "\u203f"                     # meend
SINE_WAVE = "\u223f"                    # andolan
GRACE_PREFIX = "\u1d4f"                  # small modifier letter "k" for kan swara
SUSTAIN = "\u2014"                       # em dash

_BASE_GLYPH = {
    "Sa": "S",
    "Re": "R",
    "Ga": "G",
    "Ma": "M",
    "Pa": "P",
    "Dha": "D",
    "Ni": "N",
}

NOTATION_KEY = (
    "Bhatkhande key: underline = komal, M\u030d = tivra Ma, "
    "dot below = mandra, dot above = taar, "
    "\u203f = meend, \u223f = andolan, " + GRACE_PREFIX + " = kan swara, "
    "( ) = murki, \u2014 = sustain"
)


def bhatkhande_glyph(swara_raw: str) -> str:
    """Render a single swara token in Bhatkhande short form."""

    if not swara_raw:
        return swara_raw
    token = swara_raw.strip()

    octave = ""
    if token.endswith("."):
        octave = COMBINING_DOT_BELOW
        token = token[:-1].strip()
    elif token.endswith("'"):
        octave = COMBINING_DOT_ABOVE
        token = token[:-1].strip()

    is_komal = False
    is_tivra = False
    if token.lower().startswith("komal "):
        is_komal = True
        token = token[len("komal "):].strip()
    elif token.lower().startswith("tivra "):
        is_tivra = True
        token = token[len("tivra "):].strip()

    base_glyph = _BASE_GLYPH.get(token.capitalize())
    if base_glyph is None:
        return swara_raw

    glyph = base_glyph
    if is_tivra and base_glyph == "M":
        glyph += COMBINING_VERTICAL_LINE_ABOVE
    if is_komal:
        glyph += COMBINING_LOW_LINE
    if octave:
        glyph += octave
    return glyph


def decorate_bhatkhande(swara_raw: str, ornamentation: str | None) -> str:
    """Render a swara with its ornament marker for inline notation."""

    glyph = bhatkhande_glyph(swara_raw)
    if ornamentation == "meend":
        return f"{glyph}{UNDERTIE}"
    if ornamentation == "andolan":
        return f"{glyph}{SINE_WAVE}"
    if ornamentation == "kan swara":
        return f"{GRACE_PREFIX}{glyph}"
    if ornamentation == "murki":
        return f"({glyph})"
    return glyph


_VOWELS = set("aeiouAEIOU")


def syllabify_roman(text: str) -> list[str]:
    """Rough syllabifier for Roman-transliterated Hindi / Sanskrit.

    Uses the standard CV split: a consonant cluster between two vowels gives
    one consonant to the previous syllable and the rest to the next. Works
    well enough for bhajan alignment ("Chandra" -> ["Chan", "dra"],
    "Kripalu" -> ["Kri", "pa", "lu"]).
    """

    if not text:
        return []
    out: list[str] = []
    for word in text.split():
        positions = [i for i, ch in enumerate(word) if ch in _VOWELS]
        if not positions:
            out.append(word)
            continue
        start = 0
        for i in range(len(positions) - 1):
            cons_start = positions[i] + 1
            cons_end = positions[i + 1]
            cluster_len = cons_end - cons_start
            split = cons_start if cluster_len <= 1 else cons_start + 1
            out.append(word[start:split])
            start = split
        out.append(word[start:])
    return out


def _visual_width(value: str) -> int:
    width = 0
    for ch in value:
        code = ord(ch)
        if 0x0300 <= code <= 0x036F:
            continue
        width += 1
    return width


def _pad_right(value: str, width: int) -> str:
    deficit = width - _visual_width(value)
    return value + (" " * max(0, deficit))


def align_phrase(
    notes: list,
    lyrics_text: str | None,
    *,
    barline_every: int = 4,
    sustain_durations: tuple[float, float] = (0.65, 1.2),
) -> dict[str, str | bool]:
    """Return lyrics/swaras/strokes rows that share column widths.

    Each non-sustain note becomes one column; sustained holds become extra
    columns filled with em dashes; every ``barline_every`` notes a barline
    column is inserted in all three rows. Lyric syllables are distributed
    one per note column; any overflow is appended to the last column.
    """

    syllables = syllabify_roman(lyrics_text or "")
    has_lyrics = len(syllables) > 0
    columns: list[dict[str, str]] = []
    syll_idx = 0

    for index, event in enumerate(notes):
        if index > 0 and index % barline_every == 0:
            columns.append({"lyric": "|", "swara": "|", "stroke": "|"})
        swara = decorate_bhatkhande(event.swara, event.ornamentation)
        stroke = event.stroke.replace(", sustain", "")
        lyric = ""
        if syll_idx < len(syllables):
            lyric = syllables[syll_idx]
            syll_idx += 1
        columns.append({"lyric": lyric, "swara": swara, "stroke": stroke})
        duration = float(getattr(event, "duration", 0.0))
        sustains = 0
        if duration >= sustain_durations[1]:
            sustains = 2
        elif duration >= sustain_durations[0]:
            sustains = 1
        for _ in range(sustains):
            columns.append({"lyric": "", "swara": SUSTAIN, "stroke": SUSTAIN})

    if syll_idx < len(syllables) and columns:
        trailing = " ".join(syllables[syll_idx:])
        columns[-1]["lyric"] = (columns[-1]["lyric"] + " " + trailing).strip()

    widths = [
        max(_visual_width(col["lyric"]), _visual_width(col["swara"]), _visual_width(col["stroke"]))
        for col in columns
    ]
    return {
        "has_lyrics": has_lyrics,
        "lyrics": " ".join(_pad_right(col["lyric"], widths[i]) for i, col in enumerate(columns)),
        "swaras": " ".join(_pad_right(col["swara"], widths[i]) for i, col in enumerate(columns)),
        "strokes": " ".join(_pad_right(col["stroke"], widths[i]) for i, col in enumerate(columns)),
    }
