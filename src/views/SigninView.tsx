import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const FONT_ID = 'wingman-auth-font';

const PAGE_STYLES = `
@keyframes waDriftA{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(7%,5%,0) scale(1.18)}100%{transform:translate3d(0,0,0) scale(1)}}
@keyframes waDriftB{0%{transform:translate3d(0,0,0) scale(1.12)}50%{transform:translate3d(-8%,6%,0) scale(1)}100%{transform:translate3d(0,0,0) scale(1.12)}}
@keyframes waFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes waShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes waPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}
@keyframes waSpin{to{transform:rotate(360deg)}}
.wa-drift-a{animation:waDriftA 26s ease-in-out infinite}
.wa-drift-b{animation:waDriftB 32s ease-in-out infinite}
.wa-float{animation:waFloat 6s ease-in-out infinite}
.wa-shake{animation:waShake .42s cubic-bezier(.36,.07,.19,.97) both}
.wa-pulse{animation:waPulse 2.2s ease-in-out infinite}
.wa-spin{animation:waSpin .8s linear infinite}
@media (prefers-reduced-motion:reduce){.wa-drift-a,.wa-drift-b,.wa-float,.wa-shake,.wa-pulse,.wa-spin{animation:none}}
`;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";

export const SigninView = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap';
    document.head.appendChild(l);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const em = email.trim();
    if (!em || !password) { setError('Enter your email and password to continue.'); return; }

    setLoading(true);
    setWaking(false);
    let wakingId: ReturnType<typeof setTimeout> | undefined;
    let watchdogId: ReturnType<typeof setTimeout> | undefined;
    try {
      // Live feedback after a few seconds so a cold server never reads as a silent freeze.
      wakingId = setTimeout(() => setWaking(true), 4000);
      // Hard bound: if the call truly never settles, surface a message instead of spinning forever.
      const watchdog = new Promise<never>((_, reject) => {
        watchdogId = setTimeout(() => reject(new Error('The server is slow to wake up — please try again in a few seconds.')), 60000);
      });
      await Promise.race([login(em, password), watchdog]);
      navigate('/app/feeds', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Could not sign in. Please try again.');
    } finally {
      if (wakingId) clearTimeout(wakingId);
      if (watchdogId) clearTimeout(watchdogId);
      setLoading(false);
      setWaking(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 text-zinc-900 dark:text-zinc-100">
      <style>{PAGE_STYLES}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#f4f5f7] dark:bg-[#070809]" />
        <div className="wa-drift-a absolute -left-24 -top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.16),transparent_66%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.18),transparent_66%)]" />
        <div className="wa-drift-b absolute -bottom-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14),transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.12),transparent_68%)]" />
        <div className="absolute inset-0 opacity-50 mix-blend-soft-light dark:opacity-[0.05] dark:mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_55%,rgba(15,23,42,0.06))] dark:bg-[radial-gradient(120%_120%_at_50%_0%,transparent_40%,rgba(0,0,0,0.7))]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="relative w-full max-w-sm"
      >
        <div className="relative overflow-hidden rounded-[28px] border border-black/[0.06] bg-white/90 p-7 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.045] sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/15" />

          <div className="flex flex-col items-center text-center">
            <motion.div
              className="wa-float relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 shadow-lg shadow-pink-500/30"
              whileHover={{ rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30" />
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
                <path d="M3 12l9 4.5L21 12" />
                <path d="M3 16.5 12 21l9-4.5" />
              </svg>
            </motion.div>

            <h1 className="mt-5 text-[28px] font-extrabold leading-none tracking-tight text-zinc-900 dark:text-white" style={{ fontFamily: DISPLAY }}>
              Welcome back
            </h1>
            <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">Sign in to pick up where you left off.</p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            <Field id="wa-email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={setEmail} filled={email.trim() !== ''} />
            <Field id="wa-password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={setPassword} filled={password !== ''} />

            <AnimatePresence>
              {error && (
                <motion.div key={error} role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="wa-shake flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[13px] font-medium text-rose-700 dark:text-rose-300">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.9}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-zinc-900 text-[15px] font-semibold text-white transition active:scale-[0.98] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-zinc-900"
            >
              {loading ? (
                <>
                  <span className="wa-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                  <span>Signing in</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
              {loading && (
                <motion.span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-rose-400 via-fuchsia-400 to-teal-300" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
              )}
            </button>

            <AnimatePresence>
              {loading && (
                <motion.p key={waking ? 'waking' : 'signing'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1.5 text-center text-[12px] text-zinc-400 dark:text-zinc-500">
                  {waking ? (
                    <><span className="wa-pulse inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />Still waking the server — thanks for holding…</>
                  ) : (
                    'Checking your details…'
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </form>

          <p className="mt-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
            Don&apos;t have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="font-semibold text-rose-600 transition active:opacity-60 dark:text-rose-400">Sign up</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const Field = ({ id, label, type, autoComplete, placeholder, value, onChange, filled }: {
  id: string; label: string; type: string; autoComplete: string; placeholder: string; value: string; onChange: (v: string) => void; filled: boolean;
}) => (
  <label htmlFor={id} className="block">
    <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
      <span className={`h-1.5 w-1.5 rounded-full transition-colors ${filled ? 'bg-teal-400' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
      {label}
    </span>
    <div className="group rounded-xl border border-zinc-200 bg-zinc-50 transition-all duration-200 focus-within:border-rose-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-rose-400/70 dark:focus-within:bg-white/[0.06]">
      <input id={id} type={type} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl bg-transparent px-4 text-[15px] font-medium text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-600" />
    </div>
  </label>
);

export default SigninView;
export { SigninView as SignIn, SigninView as Login, SigninView as SignInView, SigninView as LoginView };
