import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { EventCard } from '../components/EventCard';
import webhooks from '../services/api';

const SECTIONS: { key: string; label: string }[] = [
  { key: 'internship', label: 'Internships' },
  { key: 'job', label: 'Jobs' },
  { key: 'course', label: 'Courses' },
  { key: 'scheme', label: 'Scholarships' },
];

const SECTION_ACCENT: Record<string, string> = {
  internship: 'bg-sky-400',
  job: 'bg-emerald-400',
  course: 'bg-amber-400',
  scheme: 'bg-rose-400',
};

const catOf = (it: any) => String(it?.category ?? it?.entity_type ?? it?.type ?? '').toLowerCase();

const isOrphan = (x: any) =>
  !String(x?.title ?? '').trim() && !String(x?.company ?? '').trim() && !String(x?.url ?? '').trim();

const FEED_STYLES = `
@keyframes wmDriftA{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(6%,4%,0) scale(1.15)}100%{transform:translate3d(0,0,0) scale(1)}}
@keyframes wmDriftB{0%{transform:translate3d(0,0,0) scale(1.1)}50%{transform:translate3d(-7%,5%,0) scale(1)}100%{transform:translate3d(0,0,0) scale(1.1)}}
@keyframes wmPulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
.wm-drift-a{animation:wmDriftA 22s ease-in-out infinite}
.wm-drift-b{animation:wmDriftB 28s ease-in-out infinite}
.wm-pulse{animation:wmPulse 2.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.wm-drift-a,.wm-drift-b,.wm-pulse{animation:none}}
`;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";

const Skeleton = () => (
  <div className="relative overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
    <div className="h-3 w-28 rounded bg-zinc-200/80 dark:bg-white/10 animate-pulse" />
    <div className="mt-3 h-6 w-3/4 rounded bg-zinc-200/80 dark:bg-white/10 animate-pulse" />
    <div className="mt-3 h-3 w-full rounded bg-zinc-200/70 dark:bg-white/[0.07] animate-pulse" />
  </div>
);

export const LikesView = () => {
  const navigate = useNavigate();
  const email = useAuthStore((s) => s.user?.email || '');

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!email) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await webhooks.fetchLikedItems();
      const all = (r.items || []).map((x: any) => ({ ...x, isLiked: true }));
      setRows(all.filter((x: any) => !isOrphan(x)));
      all.filter(isOrphan).forEach((o: any) => {
        webhooks.syncLikeMutation(email, String(o.id), false, catOf(o) || 'job').catch(() => {});
      });
    } catch (e) {
      console.error('Failed to load likes:', e);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [email]);

  const onToggle = async (id: any, isLiked: boolean, type: string) => {
    const next = !isLiked;
    setRows((prev) =>
      next ? prev.filter((r) => r.id !== id) : prev.map((r) => (r.id === id ? { ...r, isLiked: next } : r))
    );

    if (!next) {
      const tryDelete = (attempt = 0) => {
        webhooks.syncLikeMutation(email, String(id), false, type).catch((e) => {
          if (attempt < 2) setTimeout(() => tryDelete(attempt + 1), 1500 * (attempt + 1));
          else console.error('Unlike sync failed:', e);
        });
      };
      tryDelete();
    } else {
      try {
        await webhooks.syncLikeMutation(email, String(id), true, type);
      } catch (e) {
        console.error('Like sync failed:', e);
        await load();
      }
    }
  };

  const total = rows.length;

  return (
    <div className="relative min-h-screen pb-24 text-zinc-900 dark:text-zinc-100">
      <style>{FEED_STYLES}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#f4f5f7] dark:bg-[#0a0c11]" />
        <div className="wm-drift-a absolute -left-32 -top-24 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.14),transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.12),transparent_68%)]" />
        <div className="wm-drift-b absolute -right-40 top-1/3 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.12),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)]" />
        <div className="absolute inset-0 opacity-50 mix-blend-soft-light dark:opacity-[0.06] dark:mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_55%,rgba(15,23,42,0.06))] dark:bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_42%,rgba(0,0,0,0.6))]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 pt-8">
        <header className="mb-9">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500 dark:text-rose-400">
            <span className="wm-pulse inline-block h-2 w-2 rounded-full bg-rose-500" />
            Saved by you
          </div>
          <div className="mt-3 flex items-end gap-5">
            <motion.span
              key={total}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="text-6xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-white sm:text-7xl"
              style={{ fontFamily: DISPLAY }}
            >
              {total}
            </motion.span>
            <div className="pb-2">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">liked {total === 1 ? 'opportunity' : 'opportunities'}</p>
              <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">tap the heart to remove one</p>
            </div>
          </div>
          <div className="mt-4 h-[3px] w-40 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-teal-500" />
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {[0, 1, 2].map((i) => (<Skeleton key={i} />))}
            </motion.div>
          ) : rows.length > 0 ? (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              {SECTIONS.map(({ key, label }) => {
                const items = rows.filter((it) => catOf(it) === key);
                if (items.length === 0) return null;
                return (
                  <motion.section key={key} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                    <div className="mb-3.5 flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${SECTION_ACCENT[key]}`} />
                      <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300" style={{ fontFamily: DISPLAY }}>{label}</h3>
                      <span className="h-px flex-1 bg-gradient-to-r from-zinc-300 to-transparent dark:from-white/15" />
                      <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-zinc-600 dark:bg-white/10 dark:text-zinc-300">{items.length}</span>
                    </div>
                    <div className="space-y-4">
                      {items.map((item: any) => (
                        <motion.div
                          key={item.url || item.id}
                          layout
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                        >
                          <EventCard
                            item={item}
                            onLikeToggle={(id: number, isLiked: boolean) => onToggle(id, isLiked, catOf(item) || 'job')}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[20px] border border-dashed border-zinc-300 py-14 text-center dark:border-white/15">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">No liked opportunities yet</p>
              <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">Heart a card in your feed and it lands here.</p>
              <button onClick={() => navigate('/app/feeds')} className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-[15px] font-semibold text-white transition active:scale-[0.97] active:opacity-90 dark:bg-white dark:text-zinc-900">Browse the feed</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LikesView;
