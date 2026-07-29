import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import webhooks from '../services/api';

const REQUIRED = ['edu', 'field', 'skill', 'goal'] as const;

const ACCENT = {
  sky:     { dot: 'bg-sky-400',     focus: 'focus-within:border-sky-400',     chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/20',         num: 'text-sky-500/60' },
  emerald: { dot: 'bg-emerald-400', focus: 'focus-within:border-emerald-400', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20', num: 'text-emerald-500/60' },
  amber:   { dot: 'bg-amber-400',   focus: 'focus-within:border-amber-400',   chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20',     num: 'text-amber-500/60' },
  rose:    { dot: 'bg-rose-400',    focus: 'focus-within:border-rose-400',    chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/20',         num: 'text-rose-500/60' },
  zinc:    { dot: 'bg-zinc-400',    focus: 'focus-within:border-zinc-400',    chip: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 ring-1 ring-inset ring-zinc-500/20',         num: 'text-zinc-500/60' },
} as const;

type AccentKey = keyof typeof ACCENT;

const FIELDS: Array<{ key: string; label: string; hint: string; accent: AccentKey; multiline?: boolean }> = [
  { key: 'edu',   label: 'Education',      hint: 'Degree, school, or where you are in it',     accent: 'sky' },
  { key: 'field', label: 'Field of study', hint: 'The domain you study or work in',            accent: 'emerald' },
  { key: 'skill', label: 'Skills',         hint: 'Comma-separated — Python, Figma, accounting', accent: 'amber' },
  { key: 'goal',  label: 'Goal',           hint: 'Where you actually want to land',            accent: 'rose', multiline: true },
];

const PAGE_STYLES = `
@keyframes pfDriftA{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5%,3%,0) scale(1.12)}100%{transform:translate3d(0,0,0) scale(1)}}
@keyframes pfDriftB{0%{transform:translate3d(0,0,0) scale(1.1)}50%{transform:translate3d(-6%,4%,0) scale(1)}100%{transform:translate3d(0,0,0) scale(1.1)}}
@keyframes pfPulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
.pf-drift-a{animation:pfDriftA 24s ease-in-out infinite}.pf-drift-b{animation:pfDriftB 30s ease-in-out infinite}
.pf-pulse{animation:pfPulse 2.4s ease-in-out infinite}
.pf-field{width:100%;background:transparent;outline:none;color:inherit;}
.pf-field::placeholder{color:rgba(113,113,122,0.7);}
@media (prefers-reduced-motion:reduce){.pf-drift-a,.pf-drift-b,.pf-pulse{animation:none}}
`;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";

const FieldRow = ({
  index, label, hint, value, accent, multiline, onChange,
}: {
  index: string; label: string; hint: string; value: string; accent: AccentKey; multiline?: boolean; onChange: (v: string) => void;
}) => {
  const a = ACCENT[accent];
  const filled = value.trim() !== '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`group rounded-2xl border-b-2 border-zinc-200/80 px-4 pb-3 pt-4 transition-colors duration-300 ${a.focus} dark:border-white/10`}
    >
      <div className="flex items-center gap-3">
        {index && (
          <span className={`text-[13px] font-bold tabular-nums ${filled ? a.num : 'text-zinc-300 dark:text-zinc-700'}`} style={{ fontFamily: DISPLAY }}>
            {index}
          </span>
        )}
        <span className={`h-1.5 w-1.5 rounded-full transition-colors ${filled ? a.dot : 'bg-zinc-300 dark:bg-zinc-700'}`} />
        <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{label}</label>
      </div>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint}
          className="pf-field mt-2 resize-none pl-7 text-[17px] font-medium leading-snug text-zinc-900 dark:text-white"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint}
          className="pf-field mt-2 pl-7 text-[17px] font-medium text-zinc-900 dark:text-white"
        />
      )}
    </motion.div>
  );
};

export const InfoView = () => {
  const navigate = useNavigate();

  // Loose read so this compiles regardless of the committed store's exact shape.
  const ps = useProfileStore() as any;
  const answers = (ps.answers ?? {}) as Record<string, any>;
  const isInitialized = Boolean(ps.isInitialized ?? false);
  const fetchProfile = (ps.fetchProfile ?? (() => {})) as () => void;
  const setAnswers = (ps.setAnswers ?? (() => {})) as (a: Record<string, any>) => void;

  // Session identity + logout, read loosely the same way.
  const auth = useAuthStore() as any;
  const userEmail = String(auth.user?.email ?? '');
  const logout = (auth.logout ?? (() => {})) as () => void;
  const monogram = ((userEmail.split('@')[0]?.[0]) || userEmail[0] || '?').toUpperCase();

  const [draft, setDraft] = useState<Record<string, string>>({ edu: '', field: '', skill: '', goal: '', gpa: '' });
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const seeded = useRef(false);

  useEffect(() => { if (!isInitialized) fetchProfile(); }, [isInitialized, fetchProfile]);

  // Prefill once from whatever the DB already knows about this user.
  useEffect(() => {
    if (isInitialized && !seeded.current) {
      seeded.current = true;
      setDraft((d) => ({
        ...d,
        edu: answers.edu != null ? String(answers.edu) : d.edu,
        field: answers.field != null ? String(answers.field) : d.field,
        skill: answers.skill != null ? String(answers.skill) : d.skill,
        goal: answers.goal != null ? String(answers.goal) : d.goal,
        gpa: answers.gpa != null ? String(answers.gpa) : d.gpa,
      }));
    }
  }, [isInitialized, answers]);

  const valid = useMemo(() => REQUIRED.every((k) => String(draft[k] ?? '').trim() !== ''), [draft]);
  const done = useMemo(() => REQUIRED.filter((k) => String(draft[k] ?? '').trim() !== '').length, [draft]);

  const skillChips = useMemo(
    () => draft.skill.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8),
    [draft.skill]
  );

  const change = (key: string, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const onSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        edu: draft.edu.trim(),
        field: draft.field.trim(),
        skill: draft.skill.trim(),
        goal: draft.goal.trim(),
      };
      if (draft.gpa.trim()) payload.gpa = draft.gpa.trim();
      setAnswers(payload);
      await webhooks.updateUserInfo(payload);
      navigate('/app/feeds');
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => {
    if (signingOut) return;
    setSigningOut(true);
    try { logout(); } catch (e) { console.error('logout error:', e); }
    try { localStorage.removeItem('auth-storage'); } catch { /* ignore */ }
    // let the press animation read, then leave to the auth screen
    window.setTimeout(() => { navigate('/login', { replace: true }); }, 220);
  };

  return (
    <div className="relative min-h-screen pb-28 text-zinc-900 dark:text-zinc-100">
      <style>{PAGE_STYLES}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#f4f5f7] dark:bg-[#0a0c11]" />
        <div className="pf-drift-a absolute -left-40 -top-32 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.10),transparent_68%)]" />
        <div className="pf-drift-b absolute -right-40 top-1/4 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.10),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.08),transparent_70%)]" />
        <div className="absolute inset-0 opacity-50 mix-blend-soft-light dark:opacity-[0.06] dark:mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_55%,rgba(15,23,42,0.06))] dark:bg-[radial-gradient(120%_120%_at_50%_-10%,transparent_42%,rgba(0,0,0,0.6))]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 pt-10">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            <span className="pf-pulse inline-block h-2 w-2 rounded-full bg-sky-500" />
            Intake
          </div>

          <div className="mt-4 flex items-end justify-between gap-6">
            <h1 className="text-4xl font-extrabold leading-[0.95] tracking-tight text-zinc-900 dark:text-white sm:text-5xl" style={{ fontFamily: DISPLAY }}>
              Build your<br />dossier.
            </h1>
            <div className="flex items-baseline gap-1 pb-1">
              <motion.span
                key={done}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="text-6xl font-extrabold leading-none tracking-tight tabular-nums text-zinc-900 dark:text-white sm:text-7xl"
                style={{ fontFamily: DISPLAY }}
              >
                {done}
              </motion.span>
              <span className="text-2xl font-bold text-zinc-300 dark:text-zinc-600" style={{ fontFamily: DISPLAY }}>/4</span>
            </div>
          </div>

          <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-amber-500 to-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${(done / 4) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Four things, no fluff. We read these to match roles, programs and funding to you — and to set how far afield your recommendations reach.
          </p>
        </header>

        <div className="space-y-3">
          {FIELDS.map((f, i) => (
            <FieldRow
              key={f.key}
              index={String(i + 1).padStart(2, '0')}
              label={f.label}
              hint={f.hint}
              value={draft[f.key] ?? ''}
              accent={f.accent}
              multiline={f.multiline}
              onChange={(v) => change(f.key, v)}
            />
          ))}

          <div className="pt-1">
            <FieldRow
              index=""
              label="GPA · optional"
              hint="Only if you want it weighed in"
              value={draft.gpa ?? ''}
              accent="zinc"
              onChange={(v) => change('gpa', v)}
            />
          </div>
        </div>

        {/* Live read-back — responds to every keystroke */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 rounded-2xl border border-black/[0.04] bg-zinc-500/[0.05] p-5 dark:border-white/[0.06] dark:bg-white/[0.04]"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">How we'll read you</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {draft.edu.trim() && (
                <motion.span key="edu" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold ${ACCENT.sky.chip}`}>{draft.edu.trim()}</motion.span>
              )}
              {draft.field.trim() && (
                <motion.span key="field" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold ${ACCENT.emerald.chip}`}>{draft.field.trim()}</motion.span>
              )}
              {draft.goal.trim() && (
                <motion.span key="goal" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold ${ACCENT.rose.chip}`}>→ {draft.goal.trim().slice(0, 40)}</motion.span>
              )}
              {skillChips.map((s) => (
                <motion.span key={`sk-${s}`} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold ${ACCENT.amber.chip}`}>{s}</motion.span>
              ))}
              {done === 0 && (
                <span className="text-[12px] font-medium text-zinc-400 dark:text-zinc-600">Start typing — your profile assembles here.</span>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

               <div className="mt-8 flex flex-col items-stretch gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={!valid || saving}
            aria-disabled={!valid || saving}
            className={`inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-semibold transition ${
              valid && !saving
                ? 'bg-zinc-900 text-white active:scale-[0.97] active:opacity-90 dark:bg-white dark:text-zinc-900'
                : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-white/10 dark:text-zinc-600'
            }`}
          >
            {saving ? 'Saving…' : 'Save & open my feed'}
          </button>

          <div className="rounded-2xl border border-black/[0.04] bg-zinc-500/[0.04] px-4 py-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-center text-[12px] text-zinc-400 dark:text-zinc-600">
              {valid ? 'Looks complete — your recommendations will refresh on save.' : `Complete all four fields to continue (${done}/4).`}
            </p>
            <div className="mt-3 flex items-start justify-center gap-2 border-t border-black/[0.04] pt-3 dark:border-white/[0.06]">
              <svg viewBox="0 0 24 24" className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
              </svg>
              <p className="max-w-md text-center text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                The refresh may not work immediately — please wait a moment and refresh the page if your feed doesn't update.
              </p>
            </div>
          </div>
        </div>

        {/* Account / session footer — the only place Sign out lives */}
        <motion.footer
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mt-12"
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-300/70 to-transparent dark:via-white/10" />
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-black/[0.04] bg-zinc-500/[0.04] px-4 py-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-900 text-[13px] font-bold text-white ring-1 ring-black/5 dark:bg-white dark:text-zinc-900 dark:ring-white/10"
                style={{ fontFamily: DISPLAY }}
              >
                {monogram}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Signed in</p>
                <p className="truncate text-[13px] font-medium text-zinc-700 dark:text-zinc-200">{userEmail || '—'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={signingOut}
              aria-label="Sign out"
              className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium text-rose-600 transition hover:bg-rose-500/10 active:scale-95 active:bg-rose-500/15 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <span>{signingOut ? 'Signing out' : 'Sign out'}</span>
              {!signingOut && (
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              )}
            </button>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default InfoView;
export { InfoView as ProfileView };
