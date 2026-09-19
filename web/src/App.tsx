import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Landing from './pages/Landing';
import UploadPage from './pages/UploadPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-50 w-full px-4">
        <div className="glass mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              className="h-8 w-8 rounded-lg bg-brand"
              whileHover={{ rotate: 12, scale: 1.05 }}
              style={{ boxShadow: '0 0 24px #6366f180' }}
            />
            <div className="leading-tight">
              <div className="font-display text-[15px] font-semibold tracking-wide text-white">
                Impact<span className="text-brand-soft">Lens</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-fog">AI Impact Analysis</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {[
              { to: '/', label: 'Home' },
              { to: '/upload', label: 'Analyze' },
              { to: '/history', label: 'History' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-4 py-2 transition-colors ${
                  pathname === l.to ? 'bg-brand/15 text-brand-soft' : 'text-fog hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/upload"
              className="ml-3 rounded-lg bg-brand px-4 py-2 font-medium text-white shadow-[0_0_20px_#6366f166] transition hover:bg-brand-soft"
            >
              New analysis
            </Link>
          </nav>
        </div>
      </header>
      <main className="pt-24">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/r/:id" element={<ReportPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
      <footer className="mx-auto mt-24 max-w-6xl border-t border-line px-6 py-8 text-center text-xs text-fog">
        AI-generated analyses are informational only — never investment, legal, or financial advice.
      </footer>
    </div>
  );
}
