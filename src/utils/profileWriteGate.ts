// Coalescing + serializing write gate for the Interest slider and the Save button.
// At most ONE request in flight + ONE pending value; latest wins; no send after dispose.
export interface WriteGateOptions<P> {
  buildPayload: (interestLevel: number) => P; // called at SEND time (never stale)
  send: (payload: P) => Promise<unknown>;     // reject on failure
  debounceMs?: number;                        // default 1500
  onError?: (err: unknown) => void;
}
export interface WriteGate {
  setLevel: (level: number) => void; // slider onChange: record + (re)start debounce
  save: (payload: unknown) => Promise<void>; // Save: waits for slider, then sends, wins
  flush: () => Promise<void>;        // blur / before navigation
  dispose: () => void;               // unmount
  isInFlight: () => boolean;
}
export function createWriteGate<P>(opts: WriteGateOptions<P>): WriteGate {
  const debounceMs = opts.debounceMs ?? 1500;
  let pending: number | null = null;
  let lastSent: number | null = null;
  let running = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let chain: Promise<void> = Promise.resolve();

  function kick(): void {
    if (running || disposed || pending === null || pending === lastSent) return;
    running = true;
    chain = chain.then(async () => {
      try {
        while (!disposed && pending !== null && pending !== lastSent) {
          const lvl = pending;
          try { await opts.send(opts.buildPayload(lvl)); lastSent = lvl; }
          catch (err) { opts.onError?.(err); break; } // fail-soft: no auto-retry loop
        }
      } finally { running = false; }
    });
  }

  function setLevel(level: number): void {
    if (disposed) return;
    pending = level;
    clearTimeout(timer);
    timer = setTimeout(() => { if (!running) kick(); }, debounceMs); // if running, the loop re-reads pending
  }

  function save(payload: unknown): Promise<void> {
    if (disposed) return Promise.resolve();
    clearTimeout(timer);
    const task = chain.then(async () => {
      if (disposed) return;
      const wasRunning = running; running = true; // block a parallel slider drive
      try {
        await opts.send(payload as P);
        const lvl = (payload as { interest_level?: unknown }).interest_level;
        if (typeof lvl === 'number') lastSent = lvl;
      } catch (err) { opts.onError?.(err); throw err; } // Save surfaces the error
      finally { running = wasRunning; }
    });
    chain = task.catch(() => {}).then(() => { if (!disposed && !running && pending !== null && pending !== lastSent) kick(); });
    return task;
  }

  function flush(): Promise<void> {
    clearTimeout(timer);
    if (!running && pending !== null && pending !== lastSent) kick();
    return chain;
  }
  function dispose(): void { disposed = true; clearTimeout(timer); }
  return { setLevel, save, flush, dispose, isInFlight: () => running };
}
