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

const VOWELS = new Set(["a", "e", "i", "o", "u", "A", "E", "I", "O", "U"]);

export function syllabifyRoman(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const positions: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (VOWELS.has(word[i])) positions.push(i);
    }
    if (positions.length === 0) {
      out.push(word);
      continue;
    }
    let start = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      const consStart = positions[i] + 1;
      const consEnd = positions[i + 1];
      const clusterLen = consEnd - consStart;
      const split = clusterLen <= 1 ? consStart : consStart + 1;
      out.push(word.slice(start, split));
      start = split;
    }
    out.push(word.slice(start));
  }
  return out;
}

function visualWidth(value: string): number {
  let width = 0;
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x0300 && code <= 0x036f) continue;
    width++;
  }
  return width;
}

function padRight(value: string, width: number): string {
  const deficit = width - visualWidth(value);
  return value + " ".repeat(Math.max(0, deficit));
}

interface AlignNote {
  swara: string;
  ornamentation?: string | null;
  stroke: string;
  duration: number;
}

export interface AlignedPhrase {
  hasLyrics: boolean;
  lyrics: string;
  swaras: string;
  strokes: string;
}

export function alignPhrase(notes: AlignNote[], lyricsText: string | null | undefined): AlignedPhrase {
  const syllables = syllabifyRoman(lyricsText ?? "");
  const hasLyrics = syllables.length > 0;
  const columns: { lyric: string; swara: string; stroke: string }[] = [];
  let syllIdx = 0;

  notes.forEach((note, index) => {
    if (index > 0 && index % 4 === 0) {
      columns.push({ lyric: "|", swara: "|", stroke: "|" });
    }
    const swara = decorateBhatkhande(note.swara, note.ornamentation);
    const stroke = note.stroke.replace(", sustain", "");
    const lyric = syllIdx < syllables.length ? syllables[syllIdx++] : "";
    columns.push({ lyric, swara, stroke });

    let sustains = 0;
    if (note.duration >= 1.2) sustains = 2;
    else if (note.duration >= 0.65) sustains = 1;
    for (let s = 0; s < sustains; s++) {
      columns.push({ lyric: "", swara: SUSTAIN, stroke: SUSTAIN });
    }
  });

  if (syllIdx < syllables.length && columns.length > 0) {
    const trailing = syllables.slice(syllIdx).join(" ");
    const last = columns[columns.length - 1];
    last.lyric = (last.lyric + " " + trailing).trim();
  }

  const widths = columns.map((col) =>
    Math.max(visualWidth(col.lyric), visualWidth(col.swara), visualWidth(col.stroke)),
  );

  return {
    hasLyrics,
    lyrics: columns.map((col, i) => padRight(col.lyric, widths[i])).join(" "),
    swaras: columns.map((col, i) => padRight(col.swara, widths[i])).join(" "),
    strokes: columns.map((col, i) => padRight(col.stroke, widths[i])).join(" "),
  };
}
