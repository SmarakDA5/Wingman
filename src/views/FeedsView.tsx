import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFeedsStore } from '../stores/dashboardStore';
import { useProfileStore } from '../stores/profileStore';
import { EventCard } from '../components/EventCard';
import webhooks from '../services/api';

const SECTIONS: { key: string; label: string }[] = [
  { key: 'internship', label: 'Internships' },
  { key: 'job', label: 'Jobs' },
  { key: 'course', label: 'Courses' },
  { key: 'scheme', label: 'Scholarships' },
];
const SECTION_ACCENT: Record<string, string> = { internship: 'bg-sky-400', job: 'bg-emerald-400', course: 'bg-amber-400', scheme: 'bg-rose-400' };
const REACH_WORD = ['local & casual', 'regional', 'national & competitive', 'global & prestigious'];
const catOf = (it: any) => String(it?.category ?? it?.entity_type ?? it?.type ?? '').toLowerCase();

const FEED_STYLES = `
@keyframes wmDriftA{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(6%,4%,0) scale(1.15)}100%{transform:translate3d(0,0,0) scale(1)}}
@keyframes wmDriftB{0%{transform:translate3d(0,0,0) scale(1.1)}50%{transform:translate3d(-7%,5%,0) scale(1)}100%{transform:translate3d(0,0,0) scale(1.1)}}
@keyframes wmDraw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes wmPulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
.wm-drift-a{animation:wmDriftA 22s ease-in-out infinite}.wm-drift-b{animation:wmDriftB 28s ease-in-out infinite}
.wm-draw{transform-origin:left center;animation:wmDraw .9s cubic-bezier(.2,.7,.2,1) both}.wm-pulse{animation:wmPulse 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.wm-drift-a,.wm-drift-b,.wm-draw,.wm-pulse{animation:none}}
.wm-slider{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:transparent;cursor:pointer;}
.wm-slider::-webkit-slider-runnable-track{height:4px;border-radius:9999px;background:linear-gradient(to right,#6366f1 var(--p,0%),rgba(120,120,128,0.24) var(--p,0%));}
.wm-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;height:28px;width:28px;margin-top:-12px;border-radius:9999px;background:#fff;border:0.5px solid rgba(0,0,0,0.04);box-shadow:0 3px 8px rgba(0,0,0,0.15),0 1px 2px rgba(0,0,0,0.10);transition:transform .12s ease;}
.wm-slider:active::-webkit-slider-thumb{transform:scale(1.08);}
.wm-slider::-moz-range-track{height:4px;border-radius:9999px;background:rgba(120,120,128,0.24);}
.wm-slider::-moz-range-progress{height:4px;border-radius:9999px;background:#6366f1;}
.wm-slider::-moz-range-thumb{height:28px;width:28px;border:none;border-radius:9999px;background:#fff;box-shadow:0 3px 8px rgba(0,0,0,0.15),0 1px 2px rgba(0,0,0,0.10);}
.wm-slider:focus{outline:none;}
`;
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";

// Apple-style slider: single control, filled-left track, white shadowed thumb.
const BreadthControl = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const pct = (value / 3) * 100;
  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">Reach</span>
        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-indigo-600 dark:text-indigo-300">tier ≤ {value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Recommendation breadth"
        className="wm-slider"
        style={{ '--p': `${pct}%` } as any}
      />
      <div className="mt-2 flex justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        <span>Local · casual</span>
        <span>Global · prestigious</span>
      </div>
    </div>
  );
};

const FeedSkeleton = () => (
  <div className="relative overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
    <div className="h-3 w-28 rounded bg-zinc-200/80 dark:bg-white/10 animate-pulse" />
    <div className="mt-3 h-6 w-3/4 rounded bg-zinc-200/80 dark:bg-white/10 animate-pulse" />
    <div className="mt-3 h-3 w-full rounded bg-zinc-200/70 dark:bg-white/[0.07] animate-pulse" />
    <div className="mt-2 h-3 w-2/3 rounded bg-zinc-200/70 dark:bg-white/[0.07] animate-pulse" />
  </div>
);

export const FeedsView = () => {
  const navigate = useNavigate();
  const { initializeFeeds, isInitialized, feeds, toggleLike, isLoading } = useFeedsStore();

  const ps = useProfileStore() as any;
  const isProfileValid = ps.isProfileValid ?? false;
  const fetchProfile = ps.fetchProfile ?? (() => {});
  const isProfileInitialized = ps.isInitialized ?? false;
  const interestLevel = Math.max(0, Math.min(3, Number(ps.interestLevel ?? 3)));
  const setInterestLevel = (ps.setInterestLevel ?? ((_v: number) => {})) as (v: number) => void;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBreadth = (v: number) => {
    setInterestLevel(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      webhooks.updateUserInfo({ interest_level: v }).catch((e) => console.error('Failed to save interest level:', e));
    }, 1200);
  };

  // Back-to-top: shown only while the category selection bar (the pills) is scrolled out of view.
  const [showTop, setShowTop] = useState(false);
  const pillsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const el = pillsRef.current;
      setShowTop(el ? el.getBoundingClientRect().bottom < 0 : window.scrollY > 360);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { if (!isInitialized) initializeFeeds(); }, [isInitialized, initializeFeeds]);
  useEffect(() => { if (!isProfileInitialized) fetchProfile(); }, [isProfileInitialized, fetchProfile]);

  const recs = (feeds.recommended || []) as any[];
  const pool = (feeds.discover || []) as any[];
  const seen = new Set<string>();
  const combined: any[] = [];
  for (const it of [...recs, ...pool]) {
    if (String((it as any).title ?? '').trim() === '') continue;
    const u = String((it as any).url || '');
    if (u && seen.has(u)) continue;
    if (u) seen.add(u);
    if (((it as any).scope_phase ?? (it as any).scope_tier ?? 0) > interestLevel) continue;
    combined.push(it);
  }

  const counts = SECTIONS.reduce((acc, { key }) => { acc[key] = combined.filter((it) => catOf(it) === key).length; return acc; }, {} as Record<string, number>);
  const total = combined.length;
  const reachWord = REACH_WORD[interestLevel] ?? REACH_WORD[3];
  const jumpTo = (key: string) => document.getElementById(`wm-section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="relative min-h-screen pb-24 text-zinc-900 dark:text-zinc-100">
      <style>{FEED_STYLES}</style>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#f4f5f7] dark:bg-[#0a0c11]" />
        <div className="wm-drift-a absolute -left-32 -top-24 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(13,148,136,0.16),transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.13),transparent_68%)]" />
        <div className="wm-drift-b absolute -right-40 top-1/3 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.13),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.09),transparent_70%)]" />
        <div className="absolute inset-0 opacity-50 mix-blend-soft-light dark:opacity-[0.06] dark:mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_55%,rgba(15,23,42,0.06))] dark:bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_42%,rgba(0,0,0,0.6))]" />
      </div>

      {!isProfileValid && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-2xl border-l-4 border-amber-500 bg-amber-100/80 p-4 text-amber-800 backdrop-blur-sm dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-300">
          <p className="text-sm font-medium">Complete your profile to unlock your feed.</p>
          <button onClick={() => navigate('/app/info')} className="text-[13px] font-semibold text-amber-700 transition active:opacity-60 dark:text-amber-300">Complete Profile</button>
        </div>
      )}

      <div className="relative mx-auto max-w-2xl px-6 pt-8">
        {!isProfileValid ? (
          <div className="py-12 text-center">
            <div className="relative overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white/80 p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
              <svg className="mx-auto mb-4 h-14 w-14 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white" style={{ fontFamily: DISPLAY }}>Profile incomplete</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">Answer a few questions so the feed can match roles, programs and funding to you.</p>
              <button onClick={() => navigate('/app/info')} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-[15px] font-semibold text-white transition active:scale-[0.97] active:opacity-90 dark:bg-white dark:text-zinc-900">Go to Profile</button>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-7">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                <span className="wm-pulse inline-block h-2 w-2 rounded-full bg-emerald-500" />Live feed
              </div>
              <div className="mt-3 flex items-end gap-5">
                <motion.span key={total} initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="text-6xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-white sm:text-7xl" style={{ fontFamily: DISPLAY }}>{total}</motion.span>
                <div className="pb-2">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">opportunities in view</p>
                  <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">tuned to <motion.span key={interestLevel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold text-zinc-800 dark:text-zinc-100">{reachWord}</motion.span> reach</p>
                </div>
              </div>
              <div key={interestLevel} className="wm-draw mt-4 h-[3px] w-40 rounded-full bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500" />

              <div className="mt-5 rounded-2xl border border-black/[0.04] bg-zinc-500/[0.05] p-4 dark:border-white/[0.06] dark:bg-white/[0.04]">
                <BreadthControl value={interestLevel} onChange={handleBreadth} />
              </div>

              {/* category selection bar — the back-to-top button keys off this element's visibility */}
              <div ref={pillsRef} className="mt-4 flex flex-wrap gap-2">
                {SECTIONS.map(({ key, label }) => {
                  const n = counts[key] || 0; const live = n > 0;
                  return (
                    <button key={key} type="button" disabled={!live} onClick={() => jumpTo(key)}
                      className={live
                        ? 'group inline-flex h-9 items-center gap-2 rounded-full bg-zinc-500/[0.08] pl-2.5 pr-3 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-500/[0.12] active:scale-[0.96] active:bg-zinc-500/[0.14] dark:bg-white/[0.07] dark:text-zinc-200 dark:hover:bg-white/[0.10] dark:active:bg-white/[0.14]'
                        : 'inline-flex h-9 cursor-default items-center gap-2 rounded-full bg-zinc-500/[0.05] pl-2.5 pr-3 text-[13px] font-medium text-zinc-400 opacity-60 dark:bg-white/[0.03] dark:text-zinc-600'}>
                      <span className={`h-1.5 w-1.5 rounded-full transition-transform duration-200 ${SECTION_ACCENT[key]} ${live ? 'group-active:scale-125' : ''}`} />
                      <span>{label}</span>
                      <span className="text-[12px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">{n}</span>
                    </button>
                  );
                })}
              </div>
            </header>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">{[0, 1, 2].map((i) => (<FeedSkeleton key={i} />))}</motion.div>
              ) : combined.length > 0 ? (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                  {SECTIONS.map(({ key, label }) => {
                    const items = combined.filter((it) => catOf(it) === key);
                    if (items.length === 0) return null;
                    return (
                      <motion.section key={key} id={`wm-section-${key}`} scroll-mt-6 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="mb-3.5 flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${SECTION_ACCENT[key]}`} />
                          <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300" style={{ fontFamily: DISPLAY }}>{label}</h3>
                          <span className="h-px flex-1 bg-gradient-to-r from-zinc-300 to-transparent dark:from-white/15" />
                          <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-zinc-600 dark:bg-white/10 dark:text-zinc-300">{items.length}</span>
                        </div>
                        <div className="space-y-4">
                          {items.map((item: any) => (
                            <motion.div key={(item as any).url || item.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0 }} transition={{ duration: 0.4 }}>
                              <EventCard item={item} onLikeToggle={(id: number, isLiked: boolean) => toggleLike(id, 'discover', isLiked, catOf(item) || 'job')} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.section>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[20px] border border-dashed border-zinc-300 py-14 text-center dark:border-white/15">
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Nothing in view at this reach</p>
                  <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">Widen your breadth above, or check back after the next refresh.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"
            className="fixed bottom-24 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-black/[0.06] bg-white/70 text-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition active:scale-90 dark:border-white/10 dark:bg-white/10 dark:text-zinc-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
