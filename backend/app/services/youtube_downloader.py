from __future__ import annotations

import re
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen

from app.schemas import LyricSegment


@dataclass(frozen=True)
class DownloadedAudio:
    path: Path
    lyrics: str | None = None
    lyric_segments: list[LyricSegment] | None = None
    title: str | None = None
    artist: str | None = None


def download_youtube_audio(youtube_url: str, output_dir: Path, job_id: str) -> DownloadedAudio:
    try:
        import yt_dlp
    except ImportError as exc:
        raise RuntimeError("YouTube links require yt-dlp. Run `npm run install:all` to install backend dependencies.") from exc

    output_dir.mkdir(parents=True, exist_ok=True)
    output_template = str(output_dir / f"{job_id}.%(ext)s")
    options = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": output_template,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
    }

    try:
        with yt_dlp.YoutubeDL(options) as downloader:
            info = downloader.extract_info(youtube_url, download=True)
            downloaded = Path(downloader.prepare_filename(info))
    except Exception as exc:
        raise RuntimeError(f"Could not download YouTube audio: {exc}") from exc

    lyrics, lyric_segments = _extract_lyrics_from_info(info)
    title = info.get("title") if isinstance(info, dict) else None
    artist = (info.get("artist") or info.get("uploader")) if isinstance(info, dict) else None
    if downloaded.exists():
        return DownloadedAudio(path=downloaded, lyrics=lyrics, lyric_segments=lyric_segments, title=title, artist=artist)

    matches = [
        path
        for path in sorted(output_dir.glob(f"{job_id}.*"))
        if path.suffix.lower() in {".mp3", ".wav", ".m4a", ".flac", ".webm", ".opus"}
    ]
    if matches:
        return DownloadedAudio(path=matches[0], lyrics=lyrics, lyric_segments=lyric_segments, title=title, artist=artist)

    raise RuntimeError("YouTube audio download completed but no audio file was found.")


def _extract_lyrics_from_subtitles(output_dir: Path, job_id: str) -> tuple[str | None, list[LyricSegment]]:
    subtitle_files = sorted(output_dir.glob(f"{job_id}*.vtt"))
    if not subtitle_files:
        return None, []

    segments: list[LyricSegment] = []
    seen: set[str] = set()
    for subtitle_file in subtitle_files:
        raw_lines = subtitle_file.read_text(encoding="utf-8", errors="ignore").splitlines()
        current_start: float | None = None
        current_end: float | None = None
        for raw_line in raw_lines:
            line = raw_line.strip()
            if "-->" in line:
                current_start, current_end = _parse_vtt_timing(line)
                continue
            if not line or line == "WEBVTT" or line.isdigit() or line.startswith("Kind:"):
                continue
            cleaned = re.sub(r"<[^>]+>", "", line)
            cleaned = re.sub(r"\[[^\]]+\]", "", cleaned)
            cleaned = unescape(" ".join(cleaned.split())).strip()
            key = cleaned.lower()
            if cleaned and key not in seen:
                segments.append(LyricSegment(start=current_start or 0.0, end=current_end or current_start or 0.0, text=cleaned))
                seen.add(key)

    return (" ".join(segment.text for segment in segments) if segments else None), segments


def _extract_lyrics_from_info(info: dict | None) -> tuple[str | None, list[LyricSegment]]:
    if not isinstance(info, dict):
        return None, []

    for tracks in (info.get("subtitles") or {}, info.get("automatic_captions") or {}):
        for language in _preferred_caption_languages(tracks):
            for track in tracks.get(language, []):
                if track.get("ext") not in {"vtt", "srv3", "ttml"}:
                    continue
                url = track.get("url")
                if not url:
                    continue
                try:
                    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
                    with urlopen(request, timeout=10) as response:
                        text = response.read().decode("utf-8", errors="ignore")
                    return _parse_subtitle_text(text)
                except Exception:
                    continue

    return None, []


def _preferred_caption_languages(tracks: dict) -> list[str]:
    preferred_prefixes = ["en", "hi", "sa"]
    keys = list(tracks.keys())
    preferred = [
        key
        for prefix in preferred_prefixes
        for key in keys
        if key == prefix or key.startswith(f"{prefix}-")
    ]
    return preferred + [key for key in keys if key not in preferred][:2]


def _parse_subtitle_text(text: str) -> tuple[str | None, list[LyricSegment]]:
    if "-->" in text:
        segments = _parse_vtt_lines(text.splitlines())
    else:
        cleaned = re.sub(r"<[^>]+>", " ", text)
        cleaned = unescape(" ".join(cleaned.split())).strip()
        segments = [LyricSegment(start=0.0, end=0.0, text=cleaned)] if cleaned else []
    return (" ".join(segment.text for segment in segments) if segments else None), segments


def _parse_vtt_lines(raw_lines: list[str]) -> list[LyricSegment]:
    segments: list[LyricSegment] = []
    seen: set[str] = set()
    current_start: float | None = None
    current_end: float | None = None
    for raw_line in raw_lines:
        line = raw_line.strip()
        if "-->" in line:
            current_start, current_end = _parse_vtt_timing(line)
            continue
        if not line or line == "WEBVTT" or line.isdigit() or line.startswith("Kind:"):
            continue
        cleaned = _clean_caption_line(line)
        key = cleaned.lower()
        if cleaned and key not in seen:
            segments.append(LyricSegment(start=current_start or 0.0, end=current_end or current_start or 0.0, text=cleaned))
            seen.add(key)
    return segments


def _clean_caption_line(line: str) -> str:
    cleaned = re.sub(r"<[^>]+>", "", line)
    cleaned = re.sub(r"\[[^\]]+\]", "", cleaned)
    return unescape(" ".join(cleaned.split())).strip()


def _parse_vtt_timing(line: str) -> tuple[float, float]:
    start_raw, end_raw = line.split("-->", maxsplit=1)
    end_raw = end_raw.split()[0]
    return _parse_timestamp(start_raw.strip()), _parse_timestamp(end_raw.strip())


def _parse_timestamp(value: str) -> float:
    parts = value.replace(",", ".").split(":")
    seconds = float(parts[-1])
    minutes = int(parts[-2]) if len(parts) >= 2 else 0
    hours = int(parts[-3]) if len(parts) >= 3 else 0
    return hours * 3600 + minutes * 60 + seconds
