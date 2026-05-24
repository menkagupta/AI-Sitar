// Bhatkhande short notation renderer for the frontend.
// Keep in sync with backend/app/services/notation.py.

const COMBINING_LOW_LINE = "\u0332"; // komal
const COMBINING_VERTICAL_LINE_ABOVE = "\u030d"; // tivra Ma
const COMBINING_DOT_BELOW = "\u0323"; // mandra saptak
const COMBINING_DOT_ABOVE = "\u0307"; // taar saptak
const UNDERTIE = "\u203f"; // meend
const SINE_WAVE = "\u223f"; // andolan
const GRACE_PREFIX = "\u1d4f"; // kan swara
export const SUSTAIN = "\u2014"; // em dash

const BASE_GLYPH: Record<string, string> = {
  Sa: "S",
  Re: "R",
  Ga: "G",
  Ma: "M",
  Pa: "P",
  Dha: "D",
  Ni: "N",
};

export const NOTATION_KEY =
  `Bhatkhande key: underline = komal, M${COMBINING_VERTICAL_LINE_ABOVE} = tivra Ma, ` +
  "dot below = mandra, dot above = taar, " +
  `${UNDERTIE} = meend, ${SINE_WAVE} = andolan, ${GRACE_PREFIX} = kan swara, ( ) = murki, ${SUSTAIN} = sustain`;

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1).toLowerCase();
}

export function bhatkhandeGlyph(swaraRaw: string): string {
  if (!swaraRaw) return swaraRaw;
  let token = swaraRaw.trim();

  let octave = "";
  if (token.endsWith(".")) {
    octave = COMBINING_DOT_BELOW;
    token = token.slice(0, -1).trim();
  } else if (token.endsWith("'")) {
    octave = COMBINING_DOT_ABOVE;
    token = token.slice(0, -1).trim();
  }

  let isKomal = false;
  let isTivra = false;
  const lowered = token.toLowerCase();
  if (lowered.startsWith("komal ")) {
    isKomal = true;
    token = token.slice("komal ".length).trim();
  } else if (lowered.startsWith("tivra ")) {
    isTivra = true;
    token = token.slice("tivra ".length).trim();
  }

  const base = BASE_GLYPH[capitalize(token)];
  if (!base) return swaraRaw;

  let glyph = base;
  if (isTivra && base === "M") glyph += COMBINING_VERTICAL_LINE_ABOVE;
  if (isKomal) glyph += COMBINING_LOW_LINE;
  if (octave) glyph += octave;
  return glyph;
}

export function decorateBhatkhande(swaraRaw: string, ornamentation?: string | null): string {
  const glyph = bhatkhandeGlyph(swaraRaw);
  switch (ornamentation) {
    case "meend":
      return `${glyph}${UNDERTIE}`;
    case "andolan":
      return `${glyph}${SINE_WAVE}`;
    case "kan swara":
      return `${GRACE_PREFIX}${glyph}`;
    case "murki":
      return `(${glyph})`;
    default:
      return glyph;
  }
}
