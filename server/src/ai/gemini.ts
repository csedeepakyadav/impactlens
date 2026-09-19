import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const DEMO_MODE = !apiKey;
export const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL || 'gemini-pro-latest';
export const GUARD_MODEL = process.env.GUARD_MODEL || 'gemini-flash-latest';

let client: GoogleGenAI | null = null;
export function gemini(): GoogleGenAI {
  if (!client) {
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export interface GenJsonOpts {
  model: string;
  systemInstruction: string;
  userText: string;
  pdf?: { data: Buffer; mimeType: string };
  responseSchema: object;
  temperature?: number;
}

/** One structured-output call: returns parsed JSON matching responseSchema. Retries transient failures. */
export async function generateJson<T>(opts: GenJsonOpts): Promise<T> {
  const parts: object[] = [];
  if (opts.pdf) {
    parts.push({ inlineData: { data: opts.pdf.data.toString('base64'), mimeType: opts.pdf.mimeType } });
  }
  parts.push({ text: opts.userText });

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await gemini().models.generateContent({
        model: opts.model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: opts.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: opts.responseSchema,
          temperature: opts.temperature ?? 0.3,
        },
      });
      const text = res.text;
      if (!text) throw new Error('Empty response from Gemini');
      return JSON.parse(text) as T;
    } catch (err) {
      lastErr = err;
      const msg = String(err);
      // Retry only transient errors (rate limit / server); parse errors retry once too.
      const transient = /429|500|503|overloaded|deadline|JSON/i.test(msg);
      if (!transient || attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw lastErr;
}
