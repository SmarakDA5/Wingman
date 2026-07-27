import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { FeedItem } from '../types';

interface EventCardProps {
  item: FeedItem;
  onLikeToggle: (id: number, isLiked: boolean) => void;
}

const ACCENTS: Record<string, { rail: string; dot: string; chip: string; glow: string; txt: string }> = {
  job:        { rail: 'bg-emerald-400', dot: 'bg-emerald-400', chip: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20', glow: 'bg-emerald-500/25', txt: 'text-emerald-600 dark:text-emerald-400' },
  internship: { rail: 'bg-sky-400',      dot: 'bg-sky-400',      chip: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 ring-1 ring-inset ring-sky-500/20',             glow: 'bg-sky-500/25',      txt: 'text-sky-600 dark:text-sky-400' },
  course:     { rail: 'bg-amber-400',    dot: 'bg-amber-400',    chip: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20',       glow: 'bg-amber-500/25',    txt: 'text-amber-600 dark:text-amber-400' },
  scheme:     { rail: 'bg-rose-400',     dot: 'bg-rose-400',     chip: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 ring-1 ring-inset ring-rose-500/20',            glow: 'bg-rose-500/25',     txt: 'text-rose-600 dark:text-rose-400' },
};
const FALLBACK = { rail: 'bg-zinc-400', dot: 'bg-zinc-400', chip: 'text-zinc-600 dark:text-zinc-300 bg-zinc-500/10 ring-1 ring-inset ring-zinc-500/20', glow: 'bg-zinc-500/20', txt: 'text-zinc-600 dark:text-zinc-300' };
const CAT_LABEL: Record<string, string> = { job: 'Role', internship: 'Internship', course: 'Course', scheme: 'Scholarship' };

const pick = (it: any, keys: string[]) => { for (const k of keys) { const v = it?.[k]; if (v != null && String(v).trim() !== '') return v; } return ''; };
const fmtDate = (v: any): string | null => { if (v == null || v === '') return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); };

const FONT_ID = 'wingman-display-font';

export const EventCard = ({ item, onLikeToggle }: EventCardProps) => {
  const it = item as any;

  const rawTitle = String(pick(it, ['title', 'name', 'headline', 'post']));
  const rawSummary = String(pick(it, ['description_summary', 'summary', 'description', 'snippet', 'excerpt']));
  const rawCompany = String(pick(it, ['company', 'organization', 'org', 'provider', 'employer']));
  const url = String(pick(it, ['url', 'apply_url', 'link']));
  const cat = String(pick(it, ['category', 'entity_type', 'type']) || 'job').toLowerCase();
  const tier = Math.max(0, Math.min(3, Number(pick(it, ['scope_phase', 'scope_tier']) || 0)));
  const closed = fmtDate(pick(it, ['apply_by', 'applyBy', 'deadline', 'closing_date']));
  const accent = ACCENTS[cat] || FALLBACK;
  const catLabel = CAT_LABEL[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);

  let displayTitle: string, displaySummary: string;
  if (rawTitle) { displayTitle = rawTitle; displaySummary = rawSummary; }
  else if (rawSummary) { displayTitle = rawSummary.length > 72 ? rawSummary.slice(0, 72) + '…' : rawSummary; displaySummary = ''; }
  else { displayTitle = rawCompany || `${catLabel} opportunity`; displaySummary = ''; }

  const liked = Boolean(it.isLiked);

  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap';
    document.head.appendChild(l);
  }, []);

  const toggle = () => onLikeToggle((it.id ?? 0) as number, liked);

  return (
    <motion.article whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }} className="group relative">
      <div className={`pointer-events-none absolute -inset-1 rounded-[26px] ${accent.glow} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100`} />
      <div className="relative flex overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
        <div className="pointer-events-none absolute inset-0 dark:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="relative w-1.5 shrink-0 bg-zinc-200 dark:bg-white/5">
          <div className={`absolute inset-0 ${accent.rail}`} />
        </div>
        <div className="relative flex-1 p-5 sm:p-6">
          {/* 44pt circular icon button, gray highlight on press — Apple favorite control */}
          <button type="button" onClick={toggle} aria-pressed={liked} aria-label={liked ? 'Remove from likes' : 'Save to likes'}
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-500/10 active:scale-90 dark:hover:bg-white/10">
            <motion.svg key={liked ? 'on' : 'off'} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} whileTap={{ scale: 0.82 }}
              viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} style={liked ? { color: '#f43f5e' } : undefined}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7.5-4.6-10-9.2C.4 8.5 2 5 5.4 5c2 0 3.3 1.1 4.1 2.3C10.3 6.1 11.6 5 13.6 5 17 5 18.6 8.5 17 11.8 14.5 16.4 12 21 12 21z" />
            </motion.svg>
          </button>

          {rawCompany && <p className="mb-1.5 max-w-[80%] truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{rawCompany}</p>}

          <h3 className="pr-12 text-[1.6rem] font-extrabold leading-[1.05] tracking-tight text-zinc-900 dark:text-white sm:text-[1.85rem]" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            {displayTitle}
          </h3>

          {displaySummary && <p className="mt-2.5 line-clamp-2 max-w-prose text-sm leading-relaxed text-zinc-600 dark:text-zinc-300/90">{displaySummary}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold ${accent.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />{catLabel}
            </span>
            <span className="inline-flex items-center gap-1.5" title={`Reach tier ${tier} of 3`}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Reach</span>
              <span className="flex items-center gap-1">{[0, 1, 2, 3].map((p) => (<span key={p} className={`h-1.5 w-3.5 rounded-full transition-colors ${p <= tier ? accent.rail : 'bg-zinc-200 dark:bg-white/10'}`} />))}</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {closed ? `Closes ${closed}` : 'Rolling · open'}
            </span>
          </div>

          {url && (
            <div className="mt-4 border-t border-black/[0.05] pt-3 dark:border-white/[0.06]">
              {/* plain accent button + external-link glyph (Apple's "open externally" affordance), no underline */}
              <a href={url} target="_blank" rel="noopener noreferrer"
                className={`group/link inline-flex items-center gap-1 text-[15px] font-medium transition active:opacity-60 ${accent.txt}`}>
                See source
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-active/link:translate-x-0.5 group-active/link:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-7.5 7.5M11 5H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-5" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default EventCard;
