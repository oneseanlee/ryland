import { pushRetryDelaysMs } from '../../supabase/functions/_shared/ghl-file-rules';

export type PushAnswer = { data: { state?: string } | null; error: unknown };
const inFlight = new Set<string>();

/** Bounded, deduplicated background retries; failures never escape to the uploader. */
export async function retryQueuedPush(opts: {
  key: string;
  invoke: (final: boolean) => Promise<PushAnswer>;
  retryPending?: boolean;
  delays?: number[];
  sleep?: (ms: number) => Promise<void>;
  onSent?: () => void;
  onGaveUp?: () => void;
}): Promise<'sent' | 'stopped' | 'gave_up' | 'skipped'> {
  if (inFlight.has(opts.key)) return 'skipped';
  inFlight.add(opts.key);
  try {
    const delays = opts.delays ?? pushRetryDelaysMs();
    const sleep = opts.sleep ?? (ms => new Promise<void>(resolve => setTimeout(resolve, ms)));
    let last: PushAnswer | undefined;
    for (let i = 0; i < delays.length; i++) {
      await sleep(delays[i]);
      try { last = await opts.invoke(i === delays.length - 1); }
      catch (error) { last = { data: null, error }; }
      if (!last.error) {
        if (last.data?.state === 'uploaded') {
          try { opts.onSent?.(); } catch { /* Background callbacks never fail the upload. */ }
          return 'sent';
        }
        if (last.data?.state !== 'queued' && !(opts.retryPending && last.data?.state === 'pending')) return 'stopped';
      }
    }
    if (last?.data?.state === 'queued') {
      try { opts.onGaveUp?.(); } catch { /* Background callbacks never fail the upload. */ }
      return 'gave_up';
    }
    return 'stopped';
  } catch {
    return 'stopped';
  } finally {
    inFlight.delete(opts.key);
  }
}