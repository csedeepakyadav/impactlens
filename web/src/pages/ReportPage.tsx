import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImpactReport, JobStep, StreamEvent } from '@shared/types';
import { JOB_STEPS } from '@shared/types';
import { getReport, streamAnalysis, pdfUrl } from '../lib/api';
import Dashboard from '../components/Dashboard';

type StepState = 'pending' | 'running' | 'done';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [steps, setSteps] = useState<Record<JobStep, StepState>>(
    Object.fromEntries(JOB_STEPS.map((s) => [s.key, 'pending'])) as Record<JobStep, StepState>
  );
  const [partialEntities, setPartialEntities] = useState<string[]>([]);
  const [partialClaims, setPartialClaims] = useState<string[]>([]);
  const [rejected, setRejected] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let closed = false;

    // If already complete (revisit/reload), load the result directly.
    getReport(id)
      .then((rec) => {
        if (closed) return;
        if (rec.status === 'complete' && rec.result) setReport(rec.result);
        else if (rec.status === 'rejected') setRejected(rec.rejectionReason || 'Out of scope');
        else if (rec.status === 'error') setError(rec.errorMessage || 'Analysis failed');
      })
      .catch(() => setError('Report not found'));

    const stop = streamAnalysis(id, (ev: StreamEvent) => {
      if (ev.type === 'step') {
        setSteps((prev) => ({ ...prev, [ev.step]: ev.state === 'start' ? 'running' : 'done' }));
      } else if (ev.type === 'partial') {
        if (ev.entities) setPartialEntities(ev.entities);
        if (ev.claims) setPartialClaims(ev.claims);
      } else if (ev.type === 'rejected') {
        setRejected(ev.reason);
      } else if (ev.type === 'error') {
        setError(ev.message);
      } else if (ev.type === 'complete') {
        getReport(id).then((rec) => rec.result && setReport(rec.result));
      }
    });
    return () => {
      closed = true;
      stop();
    };
  }, [id]);

  if (rejected) return <RefusalCard reason={rejected} />;
  if (error) return <ErrorCard message={error} />;

  return (
    <AnimatePresence mode="wait">
      {report ? (
        <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Dashboard report={report} downloadUrl={pdfUrl(id!)} />
        </motion.div>
      ) : (
        <motion.div key="theater" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
          <AnalysisTheater steps={steps} entities={partialEntities} claims={partialClaims} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Analysis theater: the wait is the show ---------- */

function AnalysisTheater({
  steps,
  entities,
  claims,
}: {
  steps: Record<JobStep, StepState>;
  entities: string[];
  claims: string[];
}) {
  return (
    <div className="mesh-bg flex min-h-[calc(100vh-6rem)] items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="relative mx-auto h-20 w-20">
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-brand"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-2 rounded-xl border-2 border-brand-soft/50"
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-display text-2xl text-brand-soft">
              ◉
            </div>
          </div>
          <h1 className="font-display mt-6 text-3xl font-semibold text-white">Analyzing impact…</h1>
          <p className="mt-2 text-sm text-fog">Gemini is reading the document end-to-end. ~30–90 seconds.</p>
        </motion.div>

        <div className="glass mt-10 rounded-3xl p-8">
          {JOB_STEPS.map((s, i) => {
            const state = steps[s.key];
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 py-3"
              >
                <div className="flex h-7 w-7 items-center justify-center">
                  {state === 'done' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-sev-minimal/20 text-xs text-sev-minimal"
                    >
                      ✓
                    </motion.div>
                  ) : state === 'running' ? (
                    <motion.div
                      className="h-5 w-5 rounded-full border-2 border-brand border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-line" />
                  )}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    state === 'running' ? 'font-medium text-white' : state === 'done' ? 'text-fog' : 'text-fog/40'
                  }`}
                >
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {(entities.length > 0 || claims.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            {entities.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {entities.map((e, i) => (
                  <motion.span
                    key={e}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.12 }}
                    className="rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand-soft"
                  >
                    {e}
                  </motion.span>
                ))}
              </div>
            )}
            {claims.length > 0 && (
              <div className="mt-4 space-y-2">
                {claims.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="glass truncate rounded-xl px-4 py-2.5 text-xs text-fog"
                  >
                    {c}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ---------- Refusal & error cards ---------- */

function RefusalCard({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass max-w-lg rounded-3xl p-10 text-center"
      >
        <div className="font-display text-5xl">🛡</div>
        <h1 className="font-display mt-4 text-2xl font-semibold text-white">Outside my lane.</h1>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          This portal does one thing: impact analysis of media reports — short-seller research, investigative
          journalism, regulatory notices, press coverage.
        </p>
        <div className="mt-5 rounded-xl border border-sev-moderate/30 bg-sev-moderate/10 px-4 py-3 text-sm text-sev-moderate">
          {reason}
        </div>
        <Link
          to="/upload"
          className="mt-8 inline-block rounded-xl bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-soft"
        >
          Upload a media report
        </Link>
      </motion.div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-6">
      <div className="glass max-w-lg rounded-3xl p-10 text-center">
        <h1 className="font-display text-2xl font-semibold text-white">Analysis failed</h1>
        <p className="mt-3 break-words text-sm text-sev-severe">{message}</p>
        <Link
          to="/upload"
          className="mt-8 inline-block rounded-xl bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-soft"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
