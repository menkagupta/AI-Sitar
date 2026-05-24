export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type NotationStyle = "swaras" | "western" | "hybrid";

export interface ProjectOptions {
  song_title?: string;
  artist?: string;
  youtube_url?: string;
  language?: string;
  lyrics?: string;
  preferred_raga?: string;
  skill_level: SkillLevel;
  practice_tempo: number;
  notation_style: NotationStyle;
  difficulty_target?: string;
}

export interface AnalysisJob {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  project_id?: string;
  error?: string;
}

export interface NoteEvent {
  swara: string;
  western: string;
  string: number;
  fret: number;
  start: number;
  duration: number;
  ornamentation?: string;
  stroke: string;
  fingering: string;
  confidence: number;
}

export interface Phrase {
  label: string;
  start: number;
  end: number;
  lyrics?: string;
  swaras: string;
  western_notes: string;
  sitar_tab: string;
  notes: NoteEvent[];
  ornamentation_notes: string[];
  fingering_guidance: string[];
  practice_tips: string[];
}

export interface Section {
  name: string;
  start: number;
  end: number;
  tempo: number;
  detected_scale: string;
  suggested_raga_flavor: string;
  confidence: number;
  phrases: Phrase[];
}

export interface AnalysisResult {
  project_id: string;
  title: string;
  artist?: string;
  duration: number;
  tempo: number;
  detected_key: string;
  detected_scale: string;
  overall_confidence: number;
  warnings: string[];
  sections: Section[];
  teacher_summary: string;
}
