import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listReports, deleteReport, pdfUrl } from '../lib/api';

type Item = Awaited<ReturnType<typeof listReports>>[number];

const STATUS_STYLE: Record<string, string> = {
  complete: 'text-sev-minimal bg-sev-minimal/10 border-sev-minimal/30',
  analyzing: 'text-brand-soft bg-brand/10 border-brand/30',
  uploaded: 'text-fog bg-panel border-line',
  rejected: 'text-sev-moderate bg-sev-moderate/10 border-sev-moderate/30',
  error: 'text-sev-severe bg-sev-severe/10 border-sev-severe/30',
};

export default function HistoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = () =>
    listReports()
      .then(setItems)
      .finally(() => setLoaded(true));

  useEffect(() => {
    refresh();
  }, []);

  async function remove(id: string) {
    await deleteReport(id);
    refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-brand-soft">Archive</div>
        <h1 className="font-display mt-2 text-4xl font-semibold text-white">Past analyses</h1>
      </motion.div>

      {loaded && items.length === 0 && (
        <div className="glass mt-10 rounded-3xl p-12 text-center">
          <p className="text-fog">Nothing analyzed yet.</p>
          <Link
            to="/upload"
            className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-soft"
          >
            Run your first analysis
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass flex items-center justify-between gap-4 rounded-2xl px-6 py-5"
          >
            <div className="min-w-0">
              <Link to={`/r/${it.id}`} className="block truncate font-medium text-white hover:text-brand-soft">
                {it.fileName}
              </Link>
              <div className="mono-nums mt-1 text-xs text-fog">
                {new Date(it.createdAt).toLocaleString()} · {(it.fileSize / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLE[it.status] || STATUS_STYLE.uploaded}`}>
                {it.status}
              </span>
              {it.hasResult && (
                <a href={pdfUrl(it.id)} className="text-sm text-brand-soft hover:text-white" title="Download PDF">
                  PDF ↓
                </a>
              )}
              <button
                onClick={() => remove(it.id)}
                className="text-sm text-fog/50 transition hover:text-sev-severe"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
