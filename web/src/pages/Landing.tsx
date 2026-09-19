import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import headerArt from '../assets/header-art.png';

const STEPS = [
  {
    n: '01',
    title: 'Feed it a report',
    body: 'Drop in a PDF — short-seller research, an investigative exposé, a regulatory notice — plus optional instructions on where to focus.',
  },
  {
    n: '02',
    title: 'AI reads everything',
    body: 'Gemini ingests the full document: claims, evidence, entities, conflicts. Guardrails keep it strictly on impact analysis.',
  },
  {
    n: '03',
    title: 'Get the impact report',
    body: 'Six scored dimensions, timeline projections, historical analogs — live on the web and as a letterhead PDF.',
  },
];

const STATS = [
  ['6', 'impact dimensions scored'],
  ['0–100', 'severity scale, calibrated'],
  ['~60s', 'from upload to report'],
  ['PDF', 'letterhead export'],
];

/** Word-by-word masked slide-up reveal. */
function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ delay: delay + i * 0.09, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
          {i < text.split(' ').length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

export default function Landing() {
  return (
    <div className="-mt-24">
      {/* Hero — full-bleed generated header art */}
      <div className="relative min-h-[92vh] overflow-hidden">
        <motion.img
          src={headerArt}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.4, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-center px-6 pt-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-medium tracking-[0.2em] uppercase text-slate-300 backdrop-blur-sm"
          >
            AI-powered media impact analysis
          </motion.div>

          <h1 className="font-display mt-8 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl">
            <WordReveal text="A report drops." delay={0.2} />
            <br />
            <WordReveal
              text="What breaks next?"
              delay={0.6}
              className="shimmer-text bg-gradient-to-r from-brand-soft via-white to-brand-soft bg-clip-text text-transparent"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300"
          >
            When Hindenburg published on Adani, $100B+ of market value evaporated. Upload any media report and let AI
            score the fallout — market, reputation, legal, financial — before the dust settles.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/upload"
              className="group rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-ink transition hover:scale-[1.03] hover:bg-brand-soft hover:text-white"
            >
              Analyze a report <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/history"
              className="rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-slate-200 backdrop-blur-sm transition hover:border-white/40 hover:text-white"
            >
              Past analyses
            </Link>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm md:grid-cols-4"
          >
            {STATS.map(([big, small], i) => (
              <motion.div
                key={big}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9 + i * 0.1 }}
                className="bg-ink/70 px-4 py-5"
              >
                <div className="font-display text-2xl font-semibold text-white">{big}</div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-fog">{small}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto max-w-6xl px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-brand-soft">How it works</div>
          <h2 className="font-display mt-3 text-4xl font-semibold tracking-tight text-white">
            Three steps to an impact report
          </h2>
        </motion.div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-line bg-panel/60 p-8"
            >
              <div className="absolute -right-6 -top-8 font-display text-[110px] font-bold leading-none text-white/[0.04] transition-colors group-hover:text-brand/10">
                {s.n}
              </div>
              <div className="mono-nums text-sm font-bold text-brand-soft">{s.n}</div>
              <h3 className="font-display mt-3 text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fog">{s.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Guardrail note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mx-auto mt-16 max-w-2xl rounded-2xl border border-line bg-panel/40 px-6 py-5 text-center text-sm text-fog"
        >
          <span className="font-semibold text-brand-soft">Guardrailed by design.</span> The AI does exactly one job —
          media impact analysis. No advice, no price targets, no off-topic detours. Out-of-scope uploads get a polite
          refusal.
        </motion.div>
      </div>
    </div>
  );
}
