from __future__ import annotations

import json
import shutil
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.schemas import AnalysisJob, ProjectOptions
from app.services.audio_pipeline import AnalysisProgress, analyze_audio
from app.services.exporters import export_midi, export_musicxml, export_pdf, export_txt
from app.services.lyrics import is_probably_metadata_lyrics
from app.services.storage import list_projects, load_project, save_project
from app.services.youtube_downloader import download_youtube_audio


BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac"}
jobs: dict[str, AnalysisJob] = {}

app = FastAPI(
    title="AI Sitar Transcription API",
    description="AI-assisted song-to-playable-Sitar-notation service.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalysisJob)
async def submit_analysis(
    background_tasks: BackgroundTasks,
    audio: UploadFile | None = File(None),
    youtube_url: str | None = Form(None),
    options_json: str = Form("{}"),
) -> AnalysisJob:
    has_audio = audio is not None and bool(audio.filename)
    has_youtube_url = bool(youtube_url and youtube_url.strip())
    if not has_audio and not has_youtube_url:
        raise HTTPException(status_code=400, detail="Upload an audio file or provide a YouTube URL.")

    try:
        options = ProjectOptions.model_validate(json.loads(options_json))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid options: {exc}") from exc

    job_id = str(uuid.uuid4())
    saved_path: Path | None = None
    if has_audio and audio is not None:
        extension = Path(audio.filename or "").suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Supported audio formats: mp3, wav, m4a, flac.")
        saved_path = UPLOAD_DIR / f"{job_id}{extension}"
        with saved_path.open("wb") as output:
            shutil.copyfileobj(audio.file, output)

    job = AnalysisJob(job_id=job_id, status="queued", progress=0, message="Queued")
    jobs[job_id] = job
    background_tasks.add_task(_run_analysis, job_id, saved_path, options, youtube_url.strip() if has_youtube_url else None)
    return job


@app.get("/api/jobs/{job_id}", response_model=AnalysisJob)
def get_job(job_id: str) -> AnalysisJob:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/projects")
def get_projects() -> list[dict[str, str | None]]:
    return list_projects()


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    result = load_project(project_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@app.get("/api/projects/{project_id}/export/{format_name}")
def export_project(project_id: str, format_name: str) -> Response:
    result = load_project(project_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")

    exporters = {
        "txt": ("text/plain", export_txt, "txt"),
        "musicxml": ("application/vnd.recordare.musicxml+xml", export_musicxml, "musicxml"),
        "midi": ("audio/midi", export_midi, "mid"),
        "pdf": ("application/pdf", export_pdf, "pdf"),
    }
    if format_name not in exporters:
        raise HTTPException(status_code=400, detail="Supported exports: txt, musicxml, midi, pdf.")

    media_type, exporter, extension = exporters[format_name]
    filename = f"{result.title.replace(' ', '_')}_sitar.{extension}"
    return Response(
        content=exporter(result),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _run_analysis(job_id: str, file_path: Path | None, options: ProjectOptions, youtube_url: str | None = None) -> None:
    def update_job(progress_value: int, message: str) -> None:
        jobs[job_id] = jobs[job_id].model_copy(
            update={"status": "processing", "progress": progress_value, "message": message}
        )

    progress = AnalysisProgress(on_update=update_job)
    try:
        jobs[job_id] = jobs[job_id].model_copy(update={"status": "processing", "message": "Starting analysis"})
        source_path = file_path
        if source_path is None and youtube_url:
            progress.update(5, "Downloading YouTube audio")
            downloaded = download_youtube_audio(youtube_url, UPLOAD_DIR, job_id)
            source_path = downloaded.path
            if downloaded.title and not options.song_title:
                options = options.model_copy(update={"song_title": downloaded.title})
            if downloaded.artist and not options.artist:
                options = options.model_copy(update={"artist": downloaded.artist})
            caption_is_metadata = is_probably_metadata_lyrics(downloaded.lyrics, downloaded.title, downloaded.artist)
            if downloaded.lyrics and not options.lyrics and not caption_is_metadata:
                options = options.model_copy(update={"lyrics": downloaded.lyrics})
            if downloaded.lyric_segments and not options.lyric_segments and not caption_is_metadata:
                options = options.model_copy(update={"lyric_segments": downloaded.lyric_segments})
        if source_path is None:
            raise RuntimeError("No audio source was available for analysis.")
        result = analyze_audio(source_path, options, progress)
        save_project(result)
        jobs[job_id] = AnalysisJob(
            job_id=job_id,
            status="completed",
            progress=100,
            message="Analysis complete",
            project_id=result.project_id,
        )
    except Exception as exc:
        jobs[job_id] = AnalysisJob(
            job_id=job_id,
            status="failed",
            progress=progress.progress,
            message=progress.message,
            error=str(exc),
        )
