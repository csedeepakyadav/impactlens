import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { DimensionScore, Claim } from '@shared/types';
import { colorForScore, bandForScore, BAND_LABELS } from '../lib/severity';

/** Odometer-style number that counts 0 → value when scrolled into view. */
export function CountUp({ value, className, duration = 1.4 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration]);
  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/** Hero score gauge — animated severity ring + giant number. */
export function ScoreGauge({ score, size = 280 }: { score: number; size?: number }) {
  const color = colorForScore(score);
  const band = bandForScore(score);
  const r = size * 0.4;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a2138" strokeWidth={size * 0.055} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.055}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 14px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp value={score} className="font-display text-[72px] font-semibold leading-none text-white" />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color, background: `${color}1a`, border: `1px solid ${color}44` }}
        >
          {BAND_LABELS[band]}
        </motion.div>
        <div className="mt-1 text-[11px] uppercase tracking-widest text-fog">Impact / 100</div>
      </div>
    </div>
  );
}

/** Animated horizontal severity bar. */
export function ScoreBar({ score, delay = 0 }: { score: number; delay?: number }) {
  const color = colorForScore(score);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#1a2138]">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}88` }}
        initial={{ width: 0 }}
        whileInView={{ width: `${score}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/** Small ring gauge — used for credibility and confidence. */
export function RingGauge({
  value,
  size = 120,
  color,
  label,
}: {
  value: number;
  size?: number;
  color: string;
  label?: string;
}) {
  const r = size * 0.38;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a2138" strokeWidth={size * 0.07} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono-nums font-bold text-white" style={{ fontSize: size * 0.24 }}>
          <CountUp value={value} />
        </span>
        {label && <span className="text-[9px] uppercase tracking-widest text-fog">{label}</span>}
      </div>
    </div>
  );
}

const SEV_ORDER = ['critical', 'high', 'medium', 'low'] as const;
const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f87171',
  medium: '#fbbf24',
  low: '#2dd4bf',
};

/** Donut of claim severity distribution. */
export function SeverityDonut({ claims }: { claims: Claim[] }) {
  const data = SEV_ORDER.map((s) => ({
    name: s,
    value: claims.filter((c) => c.severity === s).length,
  })).filter((d) => d.value > 0);
  const total = claims.length;
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative mx-auto shrink-0" style={{ width: 150, height: 150 }}>
        <PieChart width={150} height={150}>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={66}
            paddingAngle={3}
            stroke="none"
            isAnimationActive
            animationDuration={1200}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={SEV_COLORS[d.name]} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="mono-nums text-2xl font-bold text-white">{total}</span>
          <span className="text-[9px] uppercase tracking-widest text-fog">claims</span>
        </div>
      </div>
      <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map((d, i) => (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-1.5 text-sm"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLORS[d.name] }} />
            <span className="mono-nums font-bold text-white">{d.value}</span>
            <span className="capitalize text-fog">{d.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Animated horizontal bar list for entity impacts. */
export function EntityBars({
  entities,
}: {
  entities: { name: string; kind: string; score: number; ticker?: string }[];
}) {
  const sorted = [...entities].sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-4">
      {sorted.map((e, i) => {
        const color = colorForScore(e.score);
        return (
          <motion.div
            key={e.name}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-white">
                {e.name}
                {e.ticker && <span className="mono-nums ml-2 text-[10px] text-fog">{e.ticker}</span>}
                <span className="ml-2 text-[10px] uppercase tracking-wider text-fog/60">{e.kind}</span>
              </span>
              <span className="mono-nums text-sm font-bold" style={{ color }}>
                {e.score}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1a2138]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}66, ${color})`, boxShadow: `0 0 10px ${color}66` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${e.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function DimensionRadar({ dimensions }: { dimensions: DimensionScore[] }) {
  const data = dimensions.map((d) => ({ label: d.label, score: d.score }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#232b45" />
        <PolarAngleAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Radar dataKey="score" stroke="#818cf8" fill="#6366f1" fillOpacity={0.35} isAnimationActive animationDuration={1400} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
