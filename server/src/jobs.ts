import type { StreamEvent } from '../../shared/types.ts';
import { runAnalysis } from './ai/pipeline.ts';

type Listener = (ev: StreamEvent) => void;

interface Job {
  events: StreamEvent[]; // buffer so late SSE subscribers replay history
  listeners: Set<Listener>;
  done: boolean;
}

const jobs = new Map<string, Job>();
let running = 0;
const MAX_CONCURRENT = 2;
const queue: string[] = [];

function emit(reportId: string, ev: StreamEvent) {
  const job = jobs.get(reportId);
  if (!job) return;
  job.events.push(ev);
  if (ev.type === 'complete' || ev.type === 'rejected' || ev.type === 'error') job.done = true;
  for (const l of job.listeners) l(ev);
}

async function execute(reportId: string) {
  running++;
  try {
    await runAnalysis(reportId, (ev) => emit(reportId, ev));
  } finally {
    running--;
    const next = queue.shift();
    if (next) void execute(next);
  }
}

export function startJob(reportId: string): { queued: boolean } {
  if (jobs.has(reportId) && !jobs.get(reportId)!.done) return { queued: false }; // already running
  jobs.set(reportId, { events: [], listeners: new Set(), done: false });
  if (running >= MAX_CONCURRENT) {
    queue.push(reportId);
    return { queued: true };
  }
  void execute(reportId);
  return { queued: false };
}

export function subscribe(reportId: string, listener: Listener): (() => void) | null {
  const job = jobs.get(reportId);
  if (!job) return null;
  for (const ev of job.events) listener(ev); // replay
  if (job.done) return () => {};
  job.listeners.add(listener);
  return () => job.listeners.delete(listener);
}

export function hasJob(reportId: string): boolean {
  return jobs.has(reportId);
}
