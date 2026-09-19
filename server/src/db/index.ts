import { MongoClient, type Collection } from 'mongodb';
import type { ReportRecord, AnalysisStatus, ImpactReport } from '../../../shared/types.ts';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

interface ReportDoc extends ReportRecord {
  filePath: string;
}

let col: Collection<ReportDoc> | null = null;

export async function initDb(): Promise<void> {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'media_impact_ai');
  col = db.collection<ReportDoc>('reports');
  await col.createIndex({ createdAt: -1 });
}

function reports(): Collection<ReportDoc> {
  if (!col) throw new Error('DB not initialized — call initDb() first');
  return col;
}

// Strip Mongo _id and internal filePath before returning to API consumers.
function toRecord(doc: ReportDoc): ReportRecord {
  const { filePath: _fp, ...rest } = doc;
  delete (rest as Record<string, unknown>)._id;
  return rest;
}

export const reportsDb = {
  async create(rec: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    instructions: string;
    typeHint: string;
  }): Promise<void> {
    await reports().insertOne({
      ...rec,
      pageCount: null,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
    } as ReportDoc);
  },

  async get(id: string): Promise<ReportRecord | null> {
    const doc = await reports().findOne({ id });
    return doc ? toRecord(doc) : null;
  },

  async getFilePath(id: string): Promise<string | null> {
    const doc = await reports().findOne({ id }, { projection: { filePath: 1 } });
    return doc?.filePath ?? null;
  },

  async list(): Promise<ReportRecord[]> {
    const docs = await reports().find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(toRecord);
  },

  async setStatus(id: string, status: AnalysisStatus): Promise<void> {
    await reports().updateOne({ id }, { $set: { status } });
  },

  async setRejected(id: string, reason: string): Promise<void> {
    await reports().updateOne({ id }, { $set: { status: 'rejected', rejectionReason: reason } });
  },

  async setError(id: string, message: string): Promise<void> {
    await reports().updateOne({ id }, { $set: { status: 'error', errorMessage: message } });
  },

  async setResult(id: string, result: ImpactReport): Promise<void> {
    await reports().updateOne({ id }, { $set: { status: 'complete', result } });
  },

  async setPageCount(id: string, pageCount: number): Promise<void> {
    await reports().updateOne({ id }, { $set: { pageCount } });
  },

  async delete(id: string): Promise<void> {
    await reports().deleteOne({ id });
  },
};
