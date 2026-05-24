from __future__ import annotations

from io import BytesIO

from app.schemas import AnalysisResult
from app.services.notation import NOTATION_KEY, align_phrase


def export_txt(result: AnalysisResult) -> bytes:
    lines = [
        result.title.upper(),
        f"Artist: {result.artist}" if result.artist else "",
        f"Scale: {result.detected_scale}   Tempo: {result.tempo:.0f} BPM   Confidence: {result.overall_confidence:.0%}",
        NOTATION_KEY,
        "",
    ]
    phrase_number = 1
    for section in result.sections:
        lines.append(f"{section.name} ({_format_time(section.start)} - {_format_time(section.end)})")
        for phrase in section.phrases:
            aligned = align_phrase(phrase.notes, phrase.lyrics)
            phrase_lines = [f"{phrase_number}."]
            if aligned["has_lyrics"]:
                phrase_lines.append(f"   {aligned['lyrics']}")
            phrase_lines.extend([f"   {aligned['swaras']}", f"   {aligned['strokes']}", ""])
            lines.extend(phrase_lines)
            phrase_number += 1
    return "\n".join(lines).encode("utf-8")


def export_musicxml(result: AnalysisResult) -> bytes:
    try:
        from music21 import note, stream

        score = stream.Score()
        part = stream.Part()
        for section in result.sections:
            for phrase in section.phrases:
                for event in phrase.notes:
                    n = note.Note(event.western)
                    n.quarterLength = max(0.25, event.duration)
                    n.lyric = event.swara
                    part.append(n)
        score.insert(0, part)
        fp = BytesIO()
        score.write("musicxml", fp=fp)
        return fp.getvalue()
    except Exception:
        return export_txt(result)


def export_midi(result: AnalysisResult) -> bytes:
    try:
        import pretty_midi

        midi = pretty_midi.PrettyMIDI(initial_tempo=result.tempo)
        instrument = pretty_midi.Instrument(program=104, name="AI Sitar")
        for section in result.sections:
            for phrase in section.phrases:
                for event in phrase.notes:
                    pitch = pretty_midi.note_name_to_number(event.western)
                    instrument.notes.append(
                        pretty_midi.Note(
                            velocity=84,
                            pitch=pitch,
                            start=event.start,
                            end=event.start + event.duration,
                        )
                    )
        midi.instruments.append(instrument)
        buffer = BytesIO()
        midi.write(buffer)
        return buffer.getvalue()
    except Exception:
        return export_txt(result)


def export_pdf(result: AnalysisResult) -> bytes:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        buffer = BytesIO()
        page = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 48
        page.setFont("Helvetica-Bold", 14)
        page.drawString(48, y, f"AI Sitar Transcription: {result.title}")
        y -= 24
        page.setFont("Helvetica", 9)
        for raw_line in export_txt(result).decode("utf-8").splitlines():
            if y < 48:
                page.showPage()
                page.setFont("Helvetica", 9)
                y = height - 48
            line = raw_line[:110]
            page.drawString(48, y, line)
            y -= 13
        page.save()
        return buffer.getvalue()
    except Exception:
        return export_txt(result)


def _format_time(seconds: float) -> str:
    minutes = int(seconds // 60)
    remainder = int(seconds % 60)
    return f"{minutes:02d}:{remainder:02d}"



