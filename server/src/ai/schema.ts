import { z } from 'zod';

// ---- Gemini responseSchema objects (OpenAPI subset the API accepts) ----

const str = { type: 'string' } as const;
const num = { type: 'number' } as const;

export const guardSchema = {
  type: 'object',
  properties: {
    documentInScope: { type: 'boolean' },
    instructionsInScope: { type: 'boolean' },
    documentType: {
      type: 'string',
      enum: ['short_seller', 'investigative', 'regulatory', 'press_release', 'news', 'other', 'not_applicable'],
    },
    reason: str,
  },
  required: ['documentInScope', 'instructionsInScope', 'documentType', 'reason'],
};

export const documentSchema = {
  type: 'object',
  properties: {
    title: str,
    publisher: str,
    publishDate: { type: 'string', nullable: true },
    documentType: {
      type: 'string',
      enum: ['short_seller', 'investigative', 'regulatory', 'press_release', 'news', 'other'],
    },
    subjectEntities: { type: 'array', items: str },
    disclosedConflicts: { type: 'array', items: str },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: str,
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          pageRef: str,
        },
        required: ['text', 'severity', 'pageRef'],
      },
    },
  },
  required: ['title', 'publisher', 'documentType', 'subjectEntities', 'disclosedConflicts', 'claims'],
};

const dimensionItem = {
  type: 'object',
  properties: {
    key: { type: 'string', enum: ['market', 'reputational', 'legal', 'financial', 'operational', 'sentiment'] },
    label: str,
    score: num,
    direction: { type: 'string', enum: ['negative', 'positive', 'mixed'] },
    confidence: num,
    rationale: str,
  },
  required: ['key', 'label', 'score', 'direction', 'confidence', 'rationale'],
};

export const scoringSchema = {
  type: 'object',
  properties: {
    overallScore: num,
    overallDirection: { type: 'string', enum: ['negative', 'positive', 'mixed'] },
    dimensions: { type: 'array', items: dimensionItem },
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: str,
          kind: { type: 'string', enum: ['company', 'person', 'sector', 'other'] },
          score: num,
          ticker: { type: 'string', nullable: true },
          summary: str,
        },
        required: ['name', 'kind', 'score', 'summary'],
      },
    },
  },
  required: ['overallScore', 'overallDirection', 'dimensions', 'entities'],
};

export const projectionsSchema = {
  type: 'object',
  properties: {
    timeline: {
      type: 'object',
      properties: { immediate: str, shortTerm: str, longTerm: str },
      required: ['immediate', 'shortTerm', 'longTerm'],
    },
    analogs: {
      type: 'array',
      items: {
        type: 'object',
        properties: { event: str, year: num, outcome: str, similarity: num },
        required: ['event', 'year', 'outcome', 'similarity'],
      },
    },
    risks: { type: 'array', items: str },
    credibility: {
      type: 'object',
      properties: { score: num, rationale: str },
      required: ['score', 'rationale'],
    },
  },
  required: ['timeline', 'analogs', 'risks', 'credibility'],
};

export const synthesisSchema = {
  type: 'object',
  properties: { summary: str },
  required: ['summary'],
};

// ---- Zod validators for the AI step outputs (post-flight, L5) ----

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const zGuard = z.object({
  documentInScope: z.boolean(),
  instructionsInScope: z.boolean(),
  documentType: z.string(),
  reason: z.string(),
});

export const zDocument = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  publishDate: z.string().nullable().optional().transform((v) => v ?? null),
  documentType: z.enum(['short_seller', 'investigative', 'regulatory', 'press_release', 'news', 'other']),
  subjectEntities: z.array(z.string()).min(1),
  disclosedConflicts: z.array(z.string()),
  claims: z
    .array(
      z.object({
        text: z.string().min(1),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        pageRef: z.string(),
      })
    )
    .min(1)
    .transform((a) => a.slice(0, 20)),
});

export const zScoring = z.object({
  overallScore: z.number().transform(clamp100),
  overallDirection: z.enum(['negative', 'positive', 'mixed']),
  dimensions: z
    .array(
      z.object({
        key: z.enum(['market', 'reputational', 'legal', 'financial', 'operational', 'sentiment']),
        label: z.string(),
        score: z.number().transform(clamp100),
        direction: z.enum(['negative', 'positive', 'mixed']),
        confidence: z.number().transform(clamp01),
        rationale: z.string(),
      })
    )
    .length(6),
  entities: z
    .array(
      z.object({
        name: z.string().min(1),
        kind: z.enum(['company', 'person', 'sector', 'other']),
        score: z.number().transform(clamp100),
        ticker: z.string().nullable().optional().transform((v) => v ?? undefined),
        summary: z.string(),
      })
    )
    .min(1)
    .transform((a) => a.slice(0, 12)),
});

export const zProjections = z.object({
  timeline: z.object({ immediate: z.string(), shortTerm: z.string(), longTerm: z.string() }),
  analogs: z
    .array(z.object({ event: z.string(), year: z.number(), outcome: z.string(), similarity: z.number().transform(clamp01) }))
    .transform((a) => a.slice(0, 6)),
  risks: z.array(z.string()).min(1).transform((a) => a.slice(0, 8)),
  credibility: z.object({ score: z.number().transform(clamp100), rationale: z.string() }),
});

export const zSynthesis = z.object({ summary: z.string().min(20) });

// L5 banned-content lint: advice-like language must not appear in free text.
const ADVICE_RE =
  /\b(you should (buy|sell|short|hold)|we recommend (buying|selling|shorting)|price target|strong (buy|sell)\b)/i;

export function lintFreeText(report: { [k: string]: unknown }): string[] {
  const hits: string[] = [];
  const scan = (v: unknown, path: string) => {
    if (typeof v === 'string' && ADVICE_RE.test(v)) hits.push(path);
    else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => scan(x, `${path}.${k}`));
  };
  scan(report, 'report');
  return hits;
}
