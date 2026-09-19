import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { reportsDb } from '../db/index.ts';
import { startJob, subscribe, hasJob } from '../jobs.ts';
import { renderPdf } from '../pdf/renderer.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => cb(null, `${nanoid(12)}${path.extname(file.originalname) || '.pdf'}`),
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const reportsRouter = Router();

// L1 guardrail: PDF magic bytes, not just extension/mimetype.
function isPdf(filePath: string): boolean {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(5);
  fs.readSync(fd, buf, 0, 5, 0);
  fs.closeSync(fd);
  return buf.toString('latin1') === '%PDF-';
}

reportsRouter.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  if (!isPdf(file.path)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'File is not a valid PDF' });
  }
  const id = nanoid(10);
  const instructions = String(req.body.instructions || '').slice(0, 2000);
  const typeHint = String(req.body.typeHint || 'auto').slice(0, 40);
  await reportsDb.create({
    id,
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    instructions,
    typeHint,
  });
  res.json({ reportId: id });
});

reportsRouter.post('/:id/analyze', async (req, res) => {
  const rec = await reportsDb.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Report not found' });
  const { queued } = startJob(rec.id);
  res.json({ started: true, queued });
});

reportsRouter.get('/:id/stream', async (req, res) => {
  const id = req.params.id;
  const rec = await reportsDb.get(id);
  if (!rec) return res.status(404).json({ error: 'Report not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (ev: unknown) => res.write(`data: ${JSON.stringify(ev)}\n\n`);

  if (!hasJob(id)) {
    // No live job — report terminal state from DB (page reload after completion).
    if (rec.status === 'complete') send({ type: 'complete', reportId: id });
    else if (rec.status === 'rejected') send({ type: 'rejected', reason: rec.rejectionReason });
    else if (rec.status === 'error') send({ type: 'error', message: rec.errorMessage });
    return res.end();
  }

  const unsub = subscribe(id, send);
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => {
    clearInterval(ping);
    unsub?.();
  });
});

reportsRouter.get('/:id/pdf', async (req, res) => {
  const rec = await reportsDb.get(req.params.id);
  if (!rec?.result) return res.status(404).json({ error: 'No completed analysis for this report' });
  try {
    const pdfBuf = await renderPdf(rec.result);
    const entity = rec.result.document.subjectEntities[0]?.replace(/[^\w-]+/g, '-') || 'Report';
    const date = rec.result.meta.analyzedAt.slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Impact-Report_${entity}_${date}.pdf"`);
    res.send(pdfBuf);
  } catch (err) {
    res.status(500).json({ error: `PDF generation failed: ${err instanceof Error ? err.message : err}` });
  }
});

reportsRouter.get('/:id', async (req, res) => {
  const rec = await reportsDb.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Report not found' });
  res.json(rec);
});

reportsRouter.get('/', async (_req, res) => {
  const list = await reportsDb.list();
  res.json(list.map(({ result, ...rest }) => ({ ...rest, hasResult: !!result })));
});

reportsRouter.delete('/:id', async (req, res) => {
  const filePath = await reportsDb.getFilePath(req.params.id);
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await reportsDb.delete(req.params.id);
  res.json({ deleted: true });
});
