import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

const LEGAL_WEBHOOK = '/1f4c9b1b-49c7-4129-bc89-c8bfbc9dc9a5/legal';

const FONT_ID = 'wingman-legal-font';

const PAGE_STYLES = `
@keyframes lgDriftA{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5%,4%,0) scale(1.14)}100%{transform:translate3d(0,0,0) scale(1)}}
@keyframes lgDriftB{0%{transform:translate3d(0,0,0) scale(1.1)}50%{transform:translate3d(-6%,5%,0) scale(1)}100%{transform:translate3d(0,0,0) scale(1.1)}}
@keyframes lgDraw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes lgPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}
.lg-drift-a{animation:lgDriftA 26s ease-in-out infinite}
.lg-drift-b{animation:lgDriftB 32s ease-in-out infinite}
.lg-draw{transform-origin:left center;animation:lgDraw .9s cubic-bezier(.2,.7,.2,1) both}
.lg-pulse{animation:lgPulse 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.lg-drift-a,.lg-drift-b,.lg-draw,.lg-pulse{animation:none}}
`;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";

interface LegalPage {
  slug?: string;
  title?: string;
  content?: string;
  version?: number;
  updated_at?: string;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URL_RE = /https?:\/\/[^\s)]+/i;
const TOKEN_RE = new RegExp(`(${EMAIL_RE.source})|(${URL_RE.source})`, 'gi');

// Turn emails/URLs inside a string into high-contrast, tappable links.
const linkify = (text: string, keyPrefix: string) => {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    const isEmail = EMAIL_RE.test(token);
    if (isEmail) {
      nodes.push(
        <a key={`${keyPrefix}-e-${i}`} href={`mailto:${token}`}
          className="group/mail inline-flex items-center gap-1 font-semibold text-rose-600 underline decoration-rose-500/30 decoration-2 underline-offset-4 transition hover:text-rose-500 hover:decoration-rose-500/70 dark:text-rose-400 dark:hover:text-rose-300">
          {token}
        </a>
      );
    } else {
      nodes.push(
        <a key={`${keyPrefix}-u-${i}`} href={token} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-rose-600 underline decoration-rose-500/30 decoration-2 underline-offset-4 transition hover:text-rose-500 hover:decoration-rose-500/70 dark:text-rose-400 dark:hover:text-rose-300">
          {token}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-7.5 7.5M11 5H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-5" />
          </svg>
        </a>
      );
    }
    last = m.index + token.length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const fmtDate = (v?: string) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

export const LegalPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const slug = (params as any)?.slug || (params as any)?.id || Object.values(params || {})[0] || '';

  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!slug) { setError('No page specified.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`${LEGAL_WEBHOOK}/${encodeURIComponent(slug)}`);
      const row = (Array.isArray(data) ? data[0] : data) as LegalPage | undefined;
      if (!row || !row.content) { setError('This page could not be found.'); setPage(null); }
      else setPage(row);
    } catch (e) {
      console.error('Failed to load legal page:', e);
      setError('We could not load this page right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug]);

  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap';
    document.head.appendChild(l);
  }, []);

  // Split the raw text into readable blocks; pull out a trailing "Last updated" line.
  const { blocks, updatedLine, dropCapOnFirst } = useMemo(() => {
    const raw = (page?.content || '').replace(/\r/g, '');
    let parts = raw.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
    let updated = '';
    if (parts.length && /^last\s+updated[:\s]/i.test(parts[parts.length - 1])) {
      updated = parts.pop()!.replace(/^last\s+updated[:\s]*/i, '').trim();
    }
    // Drop a leading block that just repeats the title (avoids a doubled heading).
    if (parts.length && page?.title && parts[0].toLowerCase() === page.title.toLowerCase()) parts.shift();
    const first = parts[0] || '';
    const drop = first.length > 48 && !/^[A-Z0-9._%+-]+@/i.test(first) && !/^https?:\/\//i.test(first) && !/^(contact|email|last updated)/i.test(first);
    return { blocks: parts, updatedLine: updated, dropCapOnFirst: drop };
  }, [page]);

  const resolvedUpdated = fmtDate(page?.updated_at) || updatedLine;

  const goBack = () => { if (typeof window !== 'undefined' && window.history.length > 1) navigate(-1); else navigate('/'); };

  return (
    <div className="relative min-h-screen pb-24 text-zinc-900 dark:text-zinc-100">
      <style>{PAGE_STYLES}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#f4f5f7] dark:bg-[#0a0c11]" />
        <div className="lg-drift-a absolute -left-32 -top-28 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.05),transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.10),transparent_68%)]" />
        <div className="lg-drift-b absolute -right-40 top-1/3 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.08),transparent_70%)]" />
        <div className="absolute inset-0 opacity-50 mix-blend-soft-light dark:opacity-[0.06] dark:mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_55%,rgba(15,23,42,0.06))] dark:bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_42%,rgba(0,0,0,0.6))]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 pt-8">
        {/* top bar */}
        <div className="mb-8 flex items-center justify-between">
          <button type="button" onClick={goBack}
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 pl-3 pr-4 text-[13px] font-semibold text-zinc-700 backdrop-blur-sm transition hover:bg-white active:scale-[0.97] dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.09]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            <span className="lg-pulse inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            Wingman · Legal
          </span>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="h-4 w-28 rounded bg-zinc-200/80 dark:bg-white/10 animate-pulse" />
              <div className="h-10 w-3/4 rounded bg-zinc-200/80 dark:bg-white/10 animate-pulse" />
              <div className="h-4 w-full rounded bg-zinc-200/70 dark:bg-white/[0.07] animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-zinc-200/70 dark:bg-white/[0.07] animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-zinc-200/70 dark:bg-white/[0.07] animate-pulse" />
            </motion.div>
          ) : error ? (
            <motion.div key="err" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6 text-center">
              <p className="text-[15px] font-semibold text-rose-700 dark:text-rose-300">{error}</p>
              <button type="button" onClick={load}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-[14px] font-semibold text-white transition active:scale-[0.97] dark:bg-white dark:text-zinc-900">
                Try again
              </button>
            </motion.div>
          ) : (
            <motion.article key="doc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="text-[12px] font-bold uppercase tracking-[0.28em] text-rose-600 dark:text-rose-400">
                {slug === 'contact' ? 'Get in touch' : 'Legal'}
              </motion.p>

              <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                className="mt-3 text-[2.4rem] font-extrabold leading-[1.02] tracking-tight text-zinc-900 dark:text-white sm:text-[3.1rem]"
                style={{ fontFamily: DISPLAY }}>
                {page?.title || 'Document'}
              </motion.h1>

              <div className="lg-draw mt-5 h-[3px] w-32 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500" />

              <div className="mt-8 space-y-5">
                {blocks.map((block, idx) => {
                  const isDrop = idx === 0 && dropCapOnFirst;
                  return (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: Math.min(idx * 0.03, 0.2) }}
                      className={`whitespace-pre-line text-[17px] leading-[1.75] text-zinc-700 dark:text-zinc-200 ${
                        isDrop
                          ? 'first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-extrabold first-letter:text-[3.4rem] first-letter:leading-[0.72] first-letter:tracking-tight first-letter:text-zinc-900 dark:first-letter:text-white'
                          : ''
                      }`}
                      style={isDrop ? { fontFamily: DISPLAY } : undefined}
                    >
                      {linkify(block, `b${idx}`)}
                    </motion.p>
                  );
                })}
              </div>

              {/* legible footer meta */}
              {(resolvedUpdated || page?.version) && (
                <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-black/[0.06] pt-5 text-[13px] font-medium text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  {resolvedUpdated && (
                    <span className="inline-flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Updated {resolvedUpdated}
                    </span>
                  )}
                  {resolvedUpdated && page?.version ? <span className="text-zinc-300 dark:text-zinc-700">·</span> : null}
                  {page?.version ? <span>Version {page.version}</span> : null}
                </motion.footer>
              )}
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LegalPage;
export { LegalPage as Legal, LegalPage as LegalPageView, LegalPage as LegalView };
