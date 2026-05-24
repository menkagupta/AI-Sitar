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
