import type { ImpactReport, SeverityBand, DimensionScore } from '../../../shared/types.ts';
import { BAND_LABELS } from '../../../shared/types.ts';

// Print palette — severity colors tuned for white paper.
const BAND_COLORS: Record<SeverityBand, string> = {
  minimal: '#0d9488',
  moderate: '#d97706',
  high: '#ea580c',
  severe: '#dc2626',
  critical: '#991b1b',
};

const INK = '#111827';
const MUTED = '#6b7280';
const BRAND = '#4338ca';
const RULE = '#e5e7eb';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function scoreColor(score: number): string {
  if (score >= 85) return BAND_COLORS.critical;
  if (score >= 70) return BAND_COLORS.severe;
  if (score >= 50) return BAND_COLORS.high;
  if (score >= 30) return BAND_COLORS.moderate;
  return BAND_COLORS.minimal;
}

function dimensionBars(dims: DimensionScore[]): string {
  return dims
    .map((d) => {
      const c = scoreColor(d.score);
      return `
      <div class="dim-row avoid-break">
        <div class="dim-head">
          <span class="dim-label">${esc(d.label)}</span>
          <span class="dim-score mono" style="color:${c}">${d.score}</span>
        </div>
        <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
          <rect x="0" y="0" width="100" height="8" rx="4" fill="#f3f4f6"/>
          <rect x="0" y="0" width="${d.score}" height="8" rx="4" fill="${c}"/>
        </svg>
        <div class="dim-meta">confidence ${(d.confidence * 100).toFixed(0)}% · ${d.direction}</div>
        <div class="dim-rationale">${esc(d.rationale)}</div>
      </div>`;
    })
    .join('');
}

function radarSvg(dims: DimensionScore[]): string {
  const cx = 130, cy = 120, r = 90;
  const n = dims.length;
  const point = (i: number, frac: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `${(cx + Math.cos(a) * r * frac).toFixed(1)},${(cy + Math.sin(a) * r * frac).toFixed(1)}`;
  };
  const rings = [0.25, 0.5, 0.75, 1]
    .map((f) => `<polygon points="${dims.map((_, i) => point(i, f)).join(' ')}" fill="none" stroke="${RULE}" stroke-width="1"/>`)
    .join('');
  const axes = dims.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${point(i, 1).split(',')[0]}" y2="${point(i, 1).split(',')[1]}" stroke="${RULE}" stroke-width="1"/>`).join('');
  const shape = dims.map((d, i) => point(i, d.score / 100)).join(' ');
  const labels = dims
    .map((d, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const lx = cx + Math.cos(a) * (r + 18);
      const ly = cy + Math.sin(a) * (r + 14);
      return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="8.5" fill="${MUTED}" text-anchor="middle">${esc(d.label)}</text>`;
    })
    .join('');
  return `<svg width="260" height="240" viewBox="0 0 260 240">
    ${rings}${axes}
    <polygon points="${shape}" fill="${BRAND}22" stroke="${BRAND}" stroke-width="2"/>
    ${dims.map((d, i) => `<circle cx="${point(i, d.score / 100).split(',')[0]}" cy="${point(i, d.score / 100).split(',')[1]}" r="3" fill="${BRAND}"/>`).join('')}
    ${labels}
  </svg>`;
}

function medallion(score: number, band: SeverityBand): string {
  const c = BAND_COLORS[band];
  const circumference = 2 * Math.PI * 84;
  const filled = (score / 100) * circumference;
  return `<svg width="220" height="220" viewBox="0 0 220 220">
    <circle cx="110" cy="110" r="84" fill="none" stroke="#f3f4f6" stroke-width="14"/>
    <circle cx="110" cy="110" r="84" fill="none" stroke="${c}" stroke-width="14"
      stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${circumference.toFixed(1)}"
      transform="rotate(-90 110 110)"/>
    <text x="110" y="112" text-anchor="middle" font-size="52" font-weight="700" fill="${INK}" font-family="Georgia, serif">${score}</text>
    <text x="110" y="140" text-anchor="middle" font-size="13" letter-spacing="3" fill="${c}" font-weight="700">${BAND_LABELS[band].toUpperCase()}</text>
  </svg>`;
}

const SEV_BADGE: Record<string, string> = {
  low: BAND_COLORS.minimal,
  medium: BAND_COLORS.moderate,
  high: BAND_COLORS.severe,
  critical: BAND_COLORS.critical,
};

export function buildReportHtml(r: ImpactReport): string {
  const bandColor = BAND_COLORS[r.overall.band];
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; color:${INK}; font-size:10.5pt; line-height:1.55; }
  .serif { font-family: Georgia, 'Times New Roman', serif; }
  .mono { font-family:'SF Mono', Menlo, monospace; font-variant-numeric: tabular-nums; }
  .cover { page-break-after: always; padding: 8mm 0 0; }
  .flow { padding-top: 4mm; }
  .section-block { margin-top: 9mm; }
  .avoid-break { page-break-inside: avoid; }
  h2.section { font-family: Georgia, serif; font-size:17pt; margin: 0 0 4mm; padding-bottom:2mm; border-bottom: 2px solid ${INK}; page-break-after: avoid; }
  .eyebrow { font-size:8pt; letter-spacing:2.5px; text-transform:uppercase; color:${BRAND}; font-weight:700; margin-bottom:2mm; }

  /* Cover */
  .cover-title { font-size:23pt; line-height:1.25; margin:6mm 0 3mm; }
  .cover-sub { color:${MUTED}; font-size:11pt; margin-bottom:8mm; }
  .cover-grid { display:flex; gap:10mm; align-items:center; margin:4mm 0 8mm; }
  .summary-block { background:#f9fafb; border-left:3px solid ${bandColor}; padding:5mm 6mm; font-size:10.5pt; }
  .meta-table { width:100%; border-collapse:collapse; margin-top:6mm; font-size:9.5pt; }
  .meta-table td { padding:2mm 3mm; border-bottom:1px solid ${RULE}; vertical-align:top; }
  .meta-table td:first-child { color:${MUTED}; width:38mm; text-transform:uppercase; font-size:7.5pt; letter-spacing:1px; padding-top:2.8mm; }

  /* Scorecard */
  .dim-row { margin-bottom:5mm; }
  .dim-head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1.2mm; }
  .dim-label { font-weight:600; font-size:10pt; }
  .dim-score { font-size:13pt; font-weight:700; }
  .dim-meta { color:${MUTED}; font-size:8pt; margin-top:1mm; }
  .dim-rationale { font-size:9pt; color:#374151; margin-top:0.8mm; }
  .scorecard-grid { display:flex; gap:8mm; }
  .scorecard-grid > div:first-child { flex:1.3; }
  table.data { width:100%; border-collapse:collapse; font-size:9.5pt; }
  table.data th { text-align:left; font-size:7.5pt; text-transform:uppercase; letter-spacing:1px; color:${MUTED}; padding:2mm 3mm; border-bottom:1.5px solid ${INK}; }
  table.data td { padding:2.5mm 3mm; border-bottom:1px solid ${RULE}; vertical-align:top; }

  .badge { display:inline-block; padding:0.6mm 2.4mm; border-radius:99px; font-size:7.5pt; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#fff; }

  /* Timeline */
  .timeline { display:flex; gap:5mm; margin-top:4mm; }
  .tl-cell { flex:1; border-top:3px solid ${BRAND}; padding-top:3mm; }
  .tl-label { font-size:8pt; letter-spacing:1.5px; text-transform:uppercase; color:${BRAND}; font-weight:700; margin-bottom:2mm; }
  .tl-text { font-size:9.5pt; }

  .analog { border:1px solid ${RULE}; border-radius:2mm; padding:4mm 5mm; margin-bottom:4mm; }
  .analog-head { display:flex; justify-content:space-between; font-weight:600; margin-bottom:1.5mm; }
  .risk-item { padding:2.5mm 0 2.5mm 6mm; position:relative; border-bottom:1px solid ${RULE}; font-size:9.5pt; }
  .risk-item:before { content:''; position:absolute; left:0; top:4.2mm; width:2.5mm; height:2.5mm; background:${BAND_COLORS.high}; border-radius:50%; }
  .disclaimer { margin-top:5mm; padding:4mm 5mm; background:#f9fafb; border:1px solid ${RULE}; border-radius:2mm; font-size:8pt; color:${MUTED}; }
</style></head><body>

<!-- COVER (own page) -->
<div class="cover">
  <div class="eyebrow">Impact Analysis · ${esc(r.document.documentType.replace('_', '-'))}</div>
  <h1 class="serif cover-title">${esc(r.document.title)}</h1>
  <div class="cover-sub">${esc(r.document.publisher)}${r.document.publishDate ? ' · ' + esc(r.document.publishDate) : ''} — subject: ${esc(r.document.subjectEntities.join(', '))}</div>
  <div class="cover-grid">
    <div>${medallion(r.overall.score, r.overall.band)}</div>
    <div style="flex:1">
      <div class="eyebrow" style="color:${bandColor}">Executive Summary</div>
      <div class="summary-block serif">${esc(r.overall.summary)}</div>
    </div>
  </div>
  <table class="meta-table">
    <tr><td>Report ID</td><td class="mono">${esc(r.meta.id)}</td></tr>
    <tr><td>Source file</td><td>${esc(r.meta.sourceFile)}</td></tr>
    <tr><td>Disclosed conflicts</td><td>${r.document.disclosedConflicts.length ? esc(r.document.disclosedConflicts.join('; ')) : 'None identified'}</td></tr>
  </table>
</div>

<!-- CONTENT FLOW (continuous, breaks naturally) -->
<div class="flow">
<div class="section-block" style="margin-top:0">
  <h2 class="section">Impact Scorecard</h2>
  <div class="scorecard-grid">
    <div>${dimensionBars(r.dimensions)}</div>
    <div>
      <div class="avoid-break" style="text-align:center; margin-bottom:6mm;">${radarSvg(r.dimensions)}</div>
      <div class="avoid-break">
        <div class="eyebrow">Affected Entities</div>
        <table class="data">
          <tr><th>Entity</th><th>Type</th><th style="text-align:right">Impact</th></tr>
          ${r.entities.map((e) => `<tr><td><strong>${esc(e.name)}</strong>${e.ticker ? ` <span class="mono" style="color:${MUTED};font-size:8pt">${esc(e.ticker)}</span>` : ''}</td><td>${esc(e.kind)}</td><td class="mono" style="text-align:right;font-weight:700;color:${scoreColor(e.score)}">${e.score}</td></tr>`).join('')}
        </table>
      </div>
    </div>
  </div>
</div>

<div class="section-block">
  <h2 class="section">Key Claims &amp; Allegations</h2>
  <p style="color:${MUTED};font-size:9pt;margin-bottom:4mm">All claims below are allegations made by the source document, attributed to its publisher.</p>
  <table class="data">
    <tr><th style="width:60%">Claim</th><th>Severity</th><th>Source</th></tr>
    ${r.claims.map((c) => `<tr class="avoid-break"><td>${esc(c.text)}</td><td><span class="badge" style="background:${SEV_BADGE[c.severity]}">${esc(c.severity)}</span></td><td class="mono" style="color:${MUTED}">${esc(c.pageRef)}</td></tr>`).join('')}
  </table>
</div>

<div class="section-block">
  <h2 class="section">Projected Timeline</h2>
  <div class="timeline avoid-break">
    <div class="tl-cell"><div class="tl-label">Immediate · 0–7 days</div><div class="tl-text">${esc(r.timeline.immediate)}</div></div>
    <div class="tl-cell"><div class="tl-label">Short term · 1–3 mo</div><div class="tl-text">${esc(r.timeline.shortTerm)}</div></div>
    <div class="tl-cell"><div class="tl-label">Long term · 6–24 mo</div><div class="tl-text">${esc(r.timeline.longTerm)}</div></div>
  </div>
  <h2 class="section" style="margin-top:10mm">Historical Analogs</h2>
  ${r.analogs.map((a) => `<div class="analog avoid-break"><div class="analog-head"><span>${esc(a.event)} · ${a.year}</span><span class="mono" style="color:${BRAND}">${(a.similarity * 100).toFixed(0)}% similar</span></div><div style="font-size:9.5pt">${esc(a.outcome)}</div></div>`).join('')}
</div>

<div class="section-block">
  <h2 class="section">Risk Factors &amp; Watch Items</h2>
  ${r.risks.map((risk) => `<div class="risk-item avoid-break">${esc(risk)}</div>`).join('')}
  <div class="avoid-break">
    <h2 class="section" style="margin-top:10mm">Source Credibility</h2>
    <div style="display:flex; gap:8mm; align-items:center;">
      <div class="mono" style="font-size:30pt; font-weight:700; color:${scoreColor(100 - r.credibility.score)};">${r.credibility.score}<span style="font-size:12pt;color:${MUTED}">/100</span></div>
      <div style="flex:1; font-size:9.5pt">${esc(r.credibility.rationale)}</div>
    </div>
    <div class="disclaimer"><strong>Disclaimer.</strong> ${esc(r.disclaimer)}</div>
  </div>
</div>
</div>

</body></html>`;
}

export function headerTemplate(): string {
  return `<div style="width:100%; font-size:7px; padding:4mm 18mm 0; font-family:Helvetica, Arial, sans-serif;">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid ${BRAND}; padding-bottom:2mm;">
      <div style="display:flex; align-items:center; gap:6px;">
        <div style="width:14px; height:14px; background:${BRAND}; border-radius:3px;"></div>
        <span style="font-weight:700; letter-spacing:2px; font-size:8px; color:${INK};">IMPACTLENS</span>
      </div>
      <span style="color:${MUTED}; letter-spacing:1px;">CONFIDENTIAL · AI-GENERATED ANALYSIS</span>
    </div>
  </div>`;
}

export function footerTemplate(reportId: string): string {
  return `<div style="width:100%; font-size:7px; color:${MUTED}; padding:0 18mm 4mm; font-family:Helvetica, Arial, sans-serif;">
    <div style="border-top:1px solid ${RULE}; padding-top:2mm; display:flex; justify-content:space-between;">
      <span>Report ${reportId} · AI-generated · not investment advice</span>
      <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  </div>`;
}
