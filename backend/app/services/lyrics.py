from __future__ import annotations

import os
import re
from pathlib import Path

from app.schemas import LyricSegment


def estimate_lyrics_from_audio(
    file_path: Path,
    language: str | None = None,
    title: str | None = None,
) -> tuple[str | None, list[LyricSegment]]:
    """Best-effort local speech transcription.

    Uses faster-whisper when installed. If the model cannot run locally, callers
    should fall back to phrase syllable placeholders rather than claiming lyrics
    are unavailable.
    """

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None, []

    resolved_language = _normalize_language(language) or guess_language_from_title(title)
    model_size = os.getenv("LYRICS_MODEL_SIZE", "base")
    try:
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        segments, _info = model.transcribe(
            str(file_path),
            language=resolved_language,
            vad_filter=True,
            beam_size=3,
        )
        lyric_segments = [
            LyricSegment(start=float(segment.start), end=float(segment.end), text=" ".join(segment.text.split()))
            for segment in segments
            if segment.text.strip()
        ]
    except Exception:
        return None, []

    full_text = " ".join(segment.text for segment in lyric_segments).strip()
    if _looks_like_wrong_script(full_text, title):
        return None, []
    return full_text or None, lyric_segments


_HINDI_DEVOTIONAL_KEYWORDS = {
    "aarti",
    "arti",
    "aarti",
    "bhajan",
    "bhaj",
    "bhole",
    "chalisa",
    "darshan",
    "deva",
    "devi",
    "durga",
    "ganesh",
    "ganesha",
    "ganpati",
    "gopal",
    "hanuman",
    "hari",
    "kailash",
    "kali",
    "katha",
    "krishna",
    "kripa",
    "lakshmi",
    "mahadev",
    "maharaj",
    "mantra",
    "namo",
    "om",
    "raam",
    "ram",
    "rama",
    "ramayan",
    "saraswati",
    "shankar",
    "shanti",
    "shiv",
    "shiva",
    "shri",
    "sri",
    "swami",
    "vishnu",
    "yashoda",
}


def guess_language_from_title(title: str | None) -> str | None:
    words = set(_normalize_words(title))
    if not words:
        return None
    if words & _HINDI_DEVOTIONAL_KEYWORDS:
        return "hi"
    return None


_NON_LATIN_HINDI_SCRIPT_RANGES = (
    (0x0600, 0x06FF),
    (0x0750, 0x077F),
    (0xFB50, 0xFDFF),
    (0xFE70, 0xFEFF),
)


def _looks_like_wrong_script(text: str, title: str | None) -> bool:
    if not text:
        return False
    title_has_latin = any("a" <= ch.lower() <= "z" for ch in (title or ""))
    if not title_has_latin:
        return False
    arabic_like = sum(
        1
        for ch in text
        if any(start <= ord(ch) <= end for start, end in _NON_LATIN_HINDI_SCRIPT_RANGES)
    )
    return arabic_like >= max(8, len(text) // 8)


TRADITIONAL_LYRIC_TEMPLATES = [
    (
        re.compile(r"(aarti|arti)\s*(keeje|kije|kije|keejai|kijai)\s*hanuman", re.IGNORECASE),
        """Aarti Keeje Hanuman Lala Ki
Dushta-Dalan Raghunath Kala Ki
Jaake Bal Se Giri-Var Kanpe
Rog Dosh Jaake Nikat Na Jhanpe
Anjani Putra Mahabaldai
Santan Ke Prabhu Sada Sahai
De Beera Raghunath Pathaye
Lanka Jari Siya Sudhi Laaye
Lanka So Kot Samudra Si Khai
Jaat Pavansut Baar Na Laai
Lanka Jari Asur Sanghare
Siyaram Ji Ke Kaaj Savare
Lakhan Murchhit Pare Sakare
Lai Sanjeevan Praan Ubare
Pathiya Patal Tori Jamkare
Ahiravan Ki Bhuja Ukhare
Bayen Bhuja Sab Asur Sanghare
Dahine Bhuja Santan Hitkare
Sur Nar Muni Jan Aarti Utare
Jai Jai Jai Hanuman Uchare
Kanchan Thaar Kapur Lou Chhai
Aarti Karat Anjana Mai
Jo Hanuman Ji Ki Aarti Gawai
Basi Baikunth Param Pad Pai
Lanka Vidhwans Kiyo Raghurai
Tulsidas Prabhu Kirti Gai""",
    ),
    (
        re.compile(r"shiv\s*kailash(o|on|o ke)?\s*(ke\s*)?(vasi|wasi|waasi)", re.IGNORECASE),
        """Shiv Kailasho Ke Vasi
Dhauli Dharon Ke Raja
Shankar Sankat Harna
Shankar Sankat Harna
Tere Kailashon Ka Ant Na Paya
Tere Kailashon Ka Ant Na Paya
Ant Beant Teri Maya
O Bhole Baba
Ant Beant Teri Maya
Bel Ki Pattiyan Bhang Dhatura
Bel Ki Pattiyan Bhang Dhatura
Shiv Ji Ke Man Ko Lubhaye
O Bhole Baba
Shiv Ji Ke Man Ko Lubhaye
Ek Tha Dera Tera
Chambe Re Chaugana
Dujja Laayi Ditta Bharmaura
O Bhole Baba
Dujja Laayi Ditta Bharmaura""",
    ),
    (
        re.compile(r"(sri|shri)?\s*ram(a)?\s*chandra.*kripalu|kripalu.*bhaj", re.IGNORECASE),
        """Shri Ram Chandra Kripalu Bhajman
Haran Bhav Bhaya Darunam
Nav Kanj Lochan Kanj Mukh
Kar Kanj Pad Kanjarunam
Kandarpa Aganit Amit Chhavi
Nav Neel Neeraj Sundaram
Pat Peet Manahu Tadit Ruchi
Shuchi Naumi Janak Sutavaram
Bhaj Deen Bandhu Dinesh
Danav Daitya Vansh Nikandanam
Raghunand Anand Kand Koshal Chand
Dashrath Nandanam""",
    ),
]


def known_lyrics_for_title(title: str | None) -> str | None:
    if not title:
        return None
    normalized = re.sub(r"[^a-zA-Z0-9\s]", " ", title)
    normalized = " ".join(normalized.split())
    for pattern, lyrics in TRADITIONAL_LYRIC_TEMPLATES:
        if pattern.search(normalized):
            return lyrics
    return None


def phrase_syllable_estimate(note_count: int, title: str | None = None) -> str:
    syllables = ["aa", "na", "ri", "ta", "ma", "na", "aa", "re"]
    count = max(2, min(8, round(note_count / 2)))
    return " ".join(syllables[index % len(syllables)] for index in range(count))


def is_probably_metadata_lyrics(text: str | None, title: str | None = None, artist: str | None = None) -> bool:
    if not text:
        return False

    lines = [line.strip() for line in text.splitlines() if line.strip()] or [text.strip()]
    normalized_title = _normalize_words(title)
    normalized_artist = _normalize_words(artist)
    metadata_words = {"official", "video", "music", "lyrical", "full", "song", "audio", "hd", "4k"}

    metadata_like = 0
    for line in lines:
        words = _normalize_words(line)
        if not words:
            continue
        title_overlap = _overlap_ratio(words, normalized_title)
        artist_overlap = _overlap_ratio(words, normalized_artist)
        metadata_hit = any(word in metadata_words for word in words)
        if title_overlap >= 0.65 or artist_overlap >= 0.75 or metadata_hit:
            metadata_like += 1

    unique_lines = {tuple(_normalize_words(line)) for line in lines}
    repeated = len(unique_lines) <= max(1, len(lines) // 3)
    return metadata_like >= max(1, len(lines) // 2) or repeated and metadata_like > 0


def _normalize_words(value: str | None) -> list[str]:
    return [word for word in re.sub(r"[^a-zA-Z0-9\s]", " ", value or "").lower().split() if len(word) > 1]


def _overlap_ratio(words: list[str], reference: list[str]) -> float:
    if not words or not reference:
        return 0.0
    return len(set(words) & set(reference)) / max(1, min(len(set(words)), len(set(reference))))


def _normalize_language(language: str | None) -> str | None:
    if not language:
        return None
    lowered = language.strip().lower()
    aliases = {
        "hindi": "hi",
        "english": "en",
        "sanskrit": "sa",
        "tamil": "ta",
        "telugu": "te",
        "kannada": "kn",
        "bengali": "bn",
        "marathi": "mr",
        "gujarati": "gu",
    }
    return aliases.get(lowered, lowered[:2] if len(lowered) > 2 else lowered)
