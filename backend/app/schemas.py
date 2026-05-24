from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class SkillLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class NotationStyle(str, Enum):
    swaras = "swaras"
    western = "western"
    hybrid = "hybrid"


class LyricSegment(BaseModel):
    start: float
    end: float
    text: str


class ProjectOptions(BaseModel):
    song_title: str | None = None
    artist: str | None = None
    language: str | None = None
    lyrics: str | None = None
    lyric_segments: list[LyricSegment] | None = None
    preferred_raga: str | None = None
    skill_level: SkillLevel = SkillLevel.intermediate
    practice_tempo: int = Field(default=60, ge=30, le=180)
    notation_style: NotationStyle = NotationStyle.hybrid
    difficulty_target: str | None = None


class AnalysisJob(BaseModel):
    job_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    progress: int = Field(ge=0, le=100)
    message: str
    project_id: str | None = None
    error: str | None = None


class NoteEvent(BaseModel):
    swara: str
    western: str
    string: int
    fret: int
    start: float
    duration: float
    ornamentation: str | None = None
    stroke: str
    fingering: str
    confidence: float = Field(ge=0, le=1)


class Phrase(BaseModel):
    label: str
    start: float
    end: float
    lyrics: str | None = None
    swaras: str
    western_notes: str
    sitar_tab: str
    notes: list[NoteEvent]
    ornamentation_notes: list[str]
    fingering_guidance: list[str]
    practice_tips: list[str]


class Section(BaseModel):
    name: str
    start: float
    end: float
    tempo: float
    detected_scale: str
    suggested_raga_flavor: str
    confidence: float = Field(ge=0, le=1)
    phrases: list[Phrase]


class AnalysisResult(BaseModel):
    project_id: str
    title: str
    artist: str | None = None
    duration: float
    tempo: float
    detected_key: str
    detected_scale: str
    overall_confidence: float = Field(ge=0, le=1)
    warnings: list[str]
    sections: list[Section]
    teacher_summary: str
