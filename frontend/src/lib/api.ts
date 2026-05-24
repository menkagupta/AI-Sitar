import type { AnalysisJob, AnalysisResult, ProjectOptions } from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function submitAnalysis(file: File | null, options: ProjectOptions): Promise<AnalysisJob> {
  const form = new FormData();
  if (file) {
    form.append("audio", file);
  }
  if (options.youtube_url?.trim()) {
    form.append("youtube_url", options.youtube_url.trim());
  }
  form.append("options_json", JSON.stringify(options));
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: form,
  });
  return readJson(response);
}

export async function getJob(jobId: string): Promise<AnalysisJob> {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  return readJson(response);
}

export async function getProject(projectId: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
  return readJson(response);
}

export function exportUrl(projectId: string, format: "pdf" | "midi" | "musicxml" | "txt"): string {
  return `${API_BASE}/api/projects/${projectId}/export/${format}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}
