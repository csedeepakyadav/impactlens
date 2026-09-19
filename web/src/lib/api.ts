import type { ReportRecord, StreamEvent } from '@shared/types';

export async function uploadReport(file: File, instructions: string, typeHint: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('instructions', instructions);
  fd.append('typeHint', typeHint);
  const res = await fetch('/api/reports', { method: 'POST', body: fd });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  const { reportId } = await res.json();
  return reportId as string;
}

export async function startAnalysis(id: string): Promise<void> {
  const res = await fetch(`/api/reports/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json()).error || 'Could not start analysis');
}

export async function getReport(id: string): Promise<ReportRecord> {
  const res = await fetch(`/api/reports/${id}`);
  if (!res.ok) throw new Error('Report not found');
  return res.json();
}

export async function listReports(): Promise<(Omit<ReportRecord, 'result'> & { hasResult: boolean })[]> {
  const res = await fetch('/api/reports');
  return res.json();
}

export async function deleteReport(id: string): Promise<void> {
  await fetch(`/api/reports/${id}`, { method: 'DELETE' });
}

export function streamAnalysis(id: string, onEvent: (ev: StreamEvent) => void): () => void {
  const es = new EventSource(`/api/reports/${id}/stream`);
  es.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data) as StreamEvent);
    } catch {
      // ignore malformed frames
    }
  };
  es.onerror = () => es.close();
  return () => es.close();
}

export function pdfUrl(id: string): string {
  return `/api/reports/${id}/pdf`;
}
