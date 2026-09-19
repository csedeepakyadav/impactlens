import fs from 'node:fs';
import type { ImpactReport, StreamEvent, JobStep } from '../../../shared/types.ts';
import { bandForScore, DISCLAIMER } from '../../../shared/types.ts';
import { generateJson, ANALYSIS_MODEL, GUARD_MODEL, DEMO_MODE } from './gemini.ts';
import {
  GUARD_PROMPT, DOCUMENT_PROMPT, SCORING_PROMPT, PROJECTIONS_PROMPT, SYNTHESIS_PROMPT,
  wrapUserInstructions,
} from './prompts.ts';
import {
  guardSchema, documentSchema, scoringSchema, projectionsSchema, synthesisSchema,
  zGuard, zDocument, zScoring, zProjections, zSynthesis, lintFreeText,
} from './schema.ts';
import { demoReport } from './demo.ts';
import { reportsDb } from '../db/index.ts';

export type Emit = (ev: StreamEvent) => void;

export class RejectedError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Runs the full analysis pipeline for a report. Emits progress events, persists the result. */
export async function runAnalysis(reportId: string, emit: Emit): Promise<void> {
  const rec = await reportsDb.get(reportId);
  if (!rec) throw new Error(`Report ${reportId} not found`);
  const filePath = await reportsDb.getFilePath(reportId);
  if (!filePath || !fs.existsSync(filePath)) throw new Error('Uploaded file missing');

  await reportsDb.setStatus(reportId, 'analyzing');

  try {
    const report = DEMO_MODE
      ? await runDemo(reportId, rec.fileName, emit)
      : await runReal(reportId, rec.fileName, filePath, rec.instructions, rec.typeHint, emit);

    await reportsDb.setResult(reportId, report);
    emit({ type: 'complete', reportId });
  } catch (err) {
    if (err instanceof RejectedError) {
      await reportsDb.setRejected(reportId, err.message);
      emit({ type: 'rejected', reason: err.message });
    } else {
      const message = err instanceof Error ? err.message : String(err);
      await reportsDb.setError(reportId, message);
      emit({ type: 'error', message });
    }
  }
}

async function runReal(
  reportId: string,
  fileName: string,
  filePath: string,
  instructions: string,
  typeHint: string,
  emit: Emit
): Promise<ImpactReport> {
  const pdf = { data: fs.readFileSync(filePath), mimeType: 'application/pdf' };
  const userBlock = wrapUserInstructions(instructions, typeHint);
  const step = (s: JobStep, state: 'start' | 'done', note?: string) => emit({ type: 'step', step: s, state, note });

  // STEP 0 — guardrail gate (cheap model)
  step('guard', 'start');
  const guard = zGuard.parse(
    await generateJson({
      model: GUARD_MODEL,
      systemInstruction: GUARD_PROMPT,
      userText: `${userBlock}\n\nClassify the attached document and the instructions.`,
      pdf,
      responseSchema: guardSchema,
      temperature: 0,
    })
  );
  if (!guard.documentInScope) {
    throw new RejectedError(`Document out of scope: ${guard.reason}`);
  }
  if (!guard.instructionsInScope) {
    throw new RejectedError(`Instructions out of scope: ${guard.reason}`);
  }
  step('guard', 'done', guard.documentType);

  // STEP 1 — document intelligence
  step('document', 'start');
  const doc = zDocument.parse(
    await generateJson({
      model: ANALYSIS_MODEL,
      systemInstruction: DOCUMENT_PROMPT,
      userText: `${userBlock}\n\nExtract document intelligence from the attached PDF.`,
      pdf,
      responseSchema: documentSchema,
    })
  );
  emit({ type: 'partial', entities: doc.subjectEntities, claims: doc.claims.slice(0, 5).map((c) => c.text) });
  step('document', 'done', doc.publisher);

  // STEP 2 — impact scoring (no PDF re-send; scores from extracted intel keeps it fast + cheap)
  step('scoring', 'start');
  const docJson = JSON.stringify(doc, null, 2);
  const scoring = zScoring.parse(
    await generateJson({
      model: ANALYSIS_MODEL,
      systemInstruction: SCORING_PROMPT,
      userText: `${userBlock}\n\nDocument intelligence:\n${docJson}\n\nScore the impact.`,
      responseSchema: scoringSchema,
    })
  );
  step('scoring', 'done', `overall ${scoring.overallScore}`);

  // STEP 3 — projections & analogs
  step('projections', 'start');
  const projections = zProjections.parse(
    await generateJson({
      model: ANALYSIS_MODEL,
      systemInstruction: PROJECTIONS_PROMPT,
      userText: `${userBlock}\n\nDocument intelligence:\n${docJson}\n\nImpact scores:\n${JSON.stringify(scoring, null, 2)}`,
      responseSchema: projectionsSchema,
    })
  );
  step('projections', 'done');

  // STEP 4 — synthesis
  step('synthesis', 'start');
  const synthesis = zSynthesis.parse(
    await generateJson({
      model: ANALYSIS_MODEL,
      systemInstruction: SYNTHESIS_PROMPT,
      userText: `${userBlock}\n\nFull analysis:\n${JSON.stringify({ doc, scoring, projections }, null, 2)}`,
      responseSchema: synthesisSchema,
      temperature: 0.5,
    })
  );
  step('synthesis', 'done');

  // STEP 5 — assembly + post-flight validation (code, not AI)
  step('validate', 'start');
  const report: ImpactReport = {
    meta: { id: reportId, analyzedAt: new Date().toISOString(), model: ANALYSIS_MODEL, sourceFile: fileName },
    document: {
      title: doc.title,
      publisher: doc.publisher,
      publishDate: doc.publishDate,
      documentType: doc.documentType,
      subjectEntities: doc.subjectEntities,
      disclosedConflicts: doc.disclosedConflicts,
    },
    overall: {
      score: scoring.overallScore,
      band: bandForScore(scoring.overallScore),
      direction: scoring.overallDirection,
      summary: synthesis.summary,
    },
    dimensions: scoring.dimensions,
    entities: scoring.entities,
    claims: doc.claims,
    timeline: projections.timeline,
    analogs: projections.analogs,
    risks: projections.risks,
    credibility: projections.credibility,
    disclaimer: DISCLAIMER, // injected server-side, never model-authored
  };

  const lintHits = lintFreeText(report as unknown as Record<string, unknown>);
  if (lintHits.length) {
    // Advice-like language slipped through the prompts — fail closed rather than publish it.
    throw new Error(`Output failed content lint (advice-like language at: ${lintHits.join(', ')})`);
  }
  step('validate', 'done');

  return report;
}

async function runDemo(reportId: string, fileName: string, emit: Emit): Promise<ImpactReport> {
  const steps: JobStep[] = ['guard', 'document', 'scoring', 'projections', 'synthesis', 'validate'];
  const report = demoReport(reportId, fileName);
  for (const s of steps) {
    emit({ type: 'step', step: s, state: 'start' });
    await sleep(s === 'document' ? 2500 : 1200);
    if (s === 'document') {
      emit({ type: 'partial', entities: report.document.subjectEntities, claims: report.claims.slice(0, 3).map((c) => c.text) });
    }
    emit({ type: 'step', step: s, state: 'done' });
  }
  return report;
}
