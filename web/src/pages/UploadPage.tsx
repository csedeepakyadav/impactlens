import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadReport, startAnalysis } from '../lib/api';

const TYPE_HINTS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'short_seller', label: 'Short-seller research' },
  { value: 'investigative', label: 'Investigative journalism' },
  { value: 'regulatory', label: 'Regulatory / legal' },
  { value: 'news', label: 'News coverage' },
  { value: 'press_release', label: 'Press release' },
];

export default function UploadPage() {
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [typeHint, setTypeHint] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = useCallback((f: File | undefined | null) => {
    setError('');
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) return setError('PDF files only.');
    if (f.size > 25 * 1024 * 1024) return setError('Max 25 MB.');
    setFile(f);
  }, []);

  async function go() {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      const id = await uploadReport(file, instructions, typeHint);
      await startAnalysis(id);
      nav(`/r/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <div className="mesh-bg min-h-[calc(100vh-6rem)]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-brand-soft">New analysis</div>
          <h1 className="font-display mt-2 text-4xl font-semibold text-white">Feed the machine a report.</h1>
          <p className="mt-3 text-fog">
            Upload a media report — short-seller research, investigative piece, regulatory notice. The AI reads it
            end-to-end and scores its real-world impact.
          </p>
        </motion.div>

        {/* Dropzone */}
        <motion.label
          htmlFor="file-input"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={`mt-10 block cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
            dragOver
              ? 'border-brand bg-brand/10 shadow-[0_0_60px_#6366f14d]'
              : file
                ? 'border-sev-minimal/60 bg-sev-minimal/5'
                : 'border-line bg-panel/40 hover:border-brand/60 hover:bg-panel/70'
          }`}
        >
          <input
            id="file-input"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="glass flex items-center gap-4 rounded-2xl px-6 py-4">
                  <div className="flex h-12 w-10 items-center justify-center rounded-md bg-sev-severe/20 text-xs font-bold text-sev-severe">
                    PDF
                  </div>
                  <div className="text-left">
                    <div className="max-w-xs truncate font-medium text-white">{file.name}</div>
                    <div className="mono-nums text-xs text-fog">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <span className="text-xs text-fog">Click or drop to replace</span>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  animate={{ y: dragOver ? -6 : 0 }}
                  className="font-display text-5xl"
                  aria-hidden
                >
                  ⌖
                </motion.div>
                <div className="mt-4 text-lg font-medium text-white">Drop your media report here</div>
                <div className="mt-1 text-sm text-fog">PDF · up to 25 MB · 200 pages</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.label>

        {/* Instructions + type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid gap-4 md:grid-cols-[1fr_240px]"
        >
          <div className="glass rounded-2xl p-5">
            <label htmlFor="instructions" className="text-xs font-bold uppercase tracking-widest text-fog">
              Analysis instructions <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value.slice(0, 2000))}
              placeholder="e.g. Focus on the legal exposure of the CFO, and write for a risk-committee audience…"
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-ink/60 p-4 text-sm text-white placeholder:text-fog/50 focus:border-brand focus:outline-none"
            />
            <div className="mono-nums mt-1 text-right text-[10px] text-fog/60">{instructions.length}/2000</div>
          </div>
          <div className="glass rounded-2xl p-5">
            <label htmlFor="type-hint" className="text-xs font-bold uppercase tracking-widest text-fog">
              Report type
            </label>
            <select
              id="type-hint"
              value={typeHint}
              onChange={(e) => setTypeHint(e.target.value)}
              className="mt-3 w-full rounded-xl border border-line bg-ink/60 p-3 text-sm text-white focus:border-brand focus:outline-none"
            >
              {TYPE_HINTS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs leading-relaxed text-fog/70">
              A hint helps calibrate scoring. Auto-detect works well for most documents.
            </p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-xl border border-sev-severe/40 bg-sev-severe/10 px-4 py-3 text-sm text-sev-severe"
          >
            {error}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <motion.div whileHover={file && !busy ? { scale: 1.02 } : {}} whileTap={file && !busy ? { scale: 0.98 } : {}}>
            <button
              onClick={go}
              disabled={!file || busy}
              className="mt-8 w-full rounded-2xl bg-brand py-4 text-lg font-semibold text-white shadow-[0_0_40px_#6366f14d] transition disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy ? 'Uploading…' : 'Analyze impact →'}
            </button>
          </motion.div>
        </motion.div>

        <p className="mt-4 text-center text-xs text-fog/60">
          Guardrailed: this portal only analyzes media reports. Anything else gets politely refused.
        </p>
      </div>
    </div>
  );
}
