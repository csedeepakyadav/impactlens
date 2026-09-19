import { motion } from 'framer-motion';
import type { ImpactReport } from '@shared/types';
import { ScoreGauge, ScoreBar, DimensionRadar, CountUp, RingGauge, SeverityDonut, EntityBars } from './charts';
import { colorForScore } from '../lib/severity';

const SEV_CHIP: Record<string, string> = {
  low: '#2dd4bf',
  medium: '#fbbf24',
  high: '#f87171',
  critical: '#ef4444',
};

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <motion.section {...rise} className="mt-16">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-brand-soft">{eyebrow}</div>
      <h2 className="font-display mt-1 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}

export default function Dashboard({ report, downloadUrl }: { report: ImpactReport; downloadUrl: string }) {
  const r = report;
  const criticalClaims = r.claims.filter((c) => c.severity === 'critical').length;
  const maxEntity = [...r.entities].sort((a, b) => b.score - a.score)[0];
  const topDim = [...r.dimensions].sort((a, b) => b.score - a.score)[0];

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20">
      {/* Hero */}
      <div className="mesh-bg -mx-6 rounded-b-[3rem] px-6 pb-14 pt-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-fog">
            {r.document.publisher}
            {r.document.publishDate ? ` · ${r.document.publishDate}` : ''} ·{' '}
            {r.document.documentType.replace('_', ' ')}
          </div>
          <h1 className="font-display mx-auto mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-4xl">
            {r.document.title}
          </h1>
        </motion.div>

        <div className="mt-10 flex flex-col items-center gap-10 md:flex-row md:justify-center">
          <ScoreGauge score={r.overall.score} />
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass max-w-xl rounded-3xl p-8"
          >
            <div className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: colorForScore(r.overall.score) }}>
              Executive summary
            </div>
            <p className="font-display mt-3 text-[17px] leading-relaxed text-slate-200">{r.overall.summary}</p>
          </motion.div>
        </div>

        {/* Quick-stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-5"
        >
          {[
            [String(r.claims.length), 'claims extracted'],
            [String(criticalClaims), 'critical severity'],
            [String(r.entities.length), 'entities affected'],
            [topDim.label, `top dimension · ${topDim.score}`],
            [maxEntity?.name ?? '—', `most exposed · ${maxEntity?.score ?? ''}`],
          ].map(([big, small], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.08 }}
              className="bg-panel/90 px-4 py-4 text-center"
            >
              <div className="font-display truncate text-lg font-semibold text-white">{big}</div>
              <div className="mt-0.5 truncate text-[10px] uppercase tracking-widest text-fog">{small}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-10 text-center"
        >
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand px-8 py-4 font-semibold text-white shadow-[0_0_40px_#6366f159] transition hover:bg-brand-soft"
          >
            ↓ Download PDF report
          </a>
        </motion.div>
      </div>

      {/* Dimensions */}
      <Section eyebrow="Scorecard" title="Impact dimensions">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            {r.dimensions.map((d, i) => (
              <motion.div key={d.key} {...rise} transition={{ ...rise.transition, delay: i * 0.06 }} className="glass rounded-2xl p-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-white">{d.label}</span>
                  <span className="mono-nums text-xl font-bold" style={{ color: colorForScore(d.score) }}>
                    <CountUp value={d.score} />
                  </span>
                </div>
                <div className="mt-3">
                  <ScoreBar score={d.score} delay={i * 0.06} />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[10px] uppercase tracking-widest text-fog/70">
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{ background: `${colorForScore(d.score)}1a`, color: colorForScore(d.score) }}
                  >
                    {d.direction}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1 w-14 overflow-hidden rounded-full bg-[#1a2138]">
                      <motion.span
                        className="block h-full rounded-full bg-brand-soft"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.confidence * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </span>
                    confidence {(d.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fog">{d.rationale}</p>
              </motion.div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-fog">Dimension radar</div>
              <DimensionRadar dimensions={r.dimensions} />
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-fog">Entity exposure</div>
              <div className="mt-5">
                <EntityBars entities={r.entities} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Claims */}
      <Section eyebrow="Evidence" title="Key claims & allegations">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <motion.div {...rise} className="glass h-fit rounded-3xl p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-fog">Severity mix</div>
            <div className="mt-4">
              <SeverityDonut claims={r.claims} />
            </div>
            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-fog/70">
              All claims are allegations made by the source document, attributed to its publisher.
            </p>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-2">
            {r.claims.map((c, i) => (
              <motion.div
                key={i}
                {...rise}
                transition={{ ...rise.transition, delay: (i % 2) * 0.08 }}
                whileHover={{ y: -3 }}
                className="glass rounded-2xl p-5"
                style={{ borderLeft: `3px solid ${SEV_CHIP[c.severity]}` }}
              >
                <p className="text-sm leading-relaxed text-slate-200">{c.text}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: SEV_CHIP[c.severity], background: `${SEV_CHIP[c.severity]}1a` }}
                  >
                    {c.severity}
                  </span>
                  <span className="mono-nums text-xs text-fog">p. {c.pageRef.replace(/^p+\.?\s*/i, '')}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Timeline — visual progression */}
      <Section eyebrow="Projection" title="How this likely unfolds">
        <div className="glass relative rounded-3xl p-8">
          {/* connector line */}
          <div className="absolute left-8 right-8 top-[4.4rem] hidden h-0.5 md:block">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sev-critical via-sev-high to-sev-moderate"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {(
              [
                ['Immediate', '0–7 days', r.timeline.immediate, '#ef4444'],
                ['Short term', '1–3 months', r.timeline.shortTerm, '#fb923c'],
                ['Long term', '6–24 months', r.timeline.longTerm, '#fbbf24'],
              ] as const
            ).map(([label, range, text, color], i) => (
              <motion.div key={label} {...rise} transition={{ ...rise.transition, delay: i * 0.15 }}>
                <div className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color }}>
                  {label}
                </div>
                <div className="mono-nums text-[10px] text-fog">{range}</div>
                <motion.div
                  className="relative mt-3 mb-4 hidden h-3 w-3 rounded-full md:block"
                  style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.35, type: 'spring', stiffness: 300 }}
                />
                <p className="mt-3 text-sm leading-relaxed text-fog">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Analogs + risks */}
      <div className="grid gap-12 lg:grid-cols-2">
        <Section eyebrow="Precedent" title="Historical analogs">
          <div className="space-y-4">
            {r.analogs.map((a, i) => (
              <motion.div key={a.event} {...rise} whileHover={{ x: 4 }} className="glass rounded-2xl p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-white">
                    {a.event} <span className="mono-nums text-xs text-fog">· {a.year}</span>
                  </span>
                  <span className="mono-nums shrink-0 text-xs font-bold text-brand-soft">
                    {(a.similarity * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1a2138]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-brand-soft"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${a.similarity * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="mt-3 text-sm text-fog">{a.outcome}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Watchlist" title="Risk factors">
          <div className="glass rounded-2xl p-6">
            {r.risks.map((risk, i) => (
              <motion.div
                key={i}
                {...rise}
                transition={{ ...rise.transition, delay: i * 0.06 }}
                className="flex gap-3 border-b border-line py-3 last:border-0"
              >
                <span className="mono-nums mt-0.5 shrink-0 text-xs font-bold text-sev-high">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-sm leading-relaxed text-fog">{risk}</p>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* Credibility */}
      <Section eyebrow="Source" title="Credibility assessment">
        <div className="glass flex flex-col items-center gap-8 rounded-3xl p-8 md:flex-row">
          <RingGauge value={r.credibility.score} size={150} color="#818cf8" label="Credibility" />
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-fog">{r.credibility.rationale}</p>
            {r.document.disclosedConflicts.length > 0 && (
              <div className="mt-4 rounded-xl border border-sev-moderate/30 bg-sev-moderate/5 px-4 py-3 text-xs text-sev-moderate">
                <strong>Disclosed conflicts:</strong> {r.document.disclosedConflicts.join('; ')}
              </div>
            )}
          </div>
        </div>
      </Section>

      <motion.div {...rise} className="mt-16 rounded-2xl border border-line bg-panel/50 px-6 py-5 text-xs leading-relaxed text-fog/70">
        <strong className="text-fog">Disclaimer.</strong> {r.disclaimer}
      </motion.div>
    </div>
  );
}
