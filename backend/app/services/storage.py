from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from app.schemas import AnalysisResult


DB_PATH = Path(__file__).resolve().parents[1] / "storage" / "projects.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                result_json TEXT NOT NULL
            )
            """
        )


def save_project(result: AnalysisResult) -> None:
    init_db()
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO projects (id, title, artist, result_json)
            VALUES (?, ?, ?, ?)
            """,
            (result.project_id, result.title, result.artist, result.model_dump_json()),
        )


def load_project(project_id: str) -> AnalysisResult | None:
    init_db()
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute(
            "SELECT result_json FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()

    if not row:
        return None
    return AnalysisResult.model_validate(json.loads(row[0]))


def list_projects() -> list[dict[str, str | None]]:
    init_db()
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            "SELECT id, title, artist, created_at FROM projects ORDER BY created_at DESC"
        ).fetchall()
    return [
        {"id": row[0], "title": row[1], "artist": row[2], "created_at": row[3]}
        for row in rows
    ]
