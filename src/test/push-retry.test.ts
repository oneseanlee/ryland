import { describe, expect, it, vi } from 'vitest';
import { pushRetryDelaysMs } from '../../supabase/functions/_shared/ghl-file-rules';
import { retryQueuedPush, type PushAnswer } from '../lib/push-retry';

const answer = (state: string): PushAnswer => ({ data: { state }, error: null });
const setup = (key: string) => ({ key, sleep: vi.fn(async (_ms: number) => {}), onSent: vi.fn(), onGaveUp: vi.fn() });

describe('queued document push retries', () => {
  it('derives 30/90/150s and 30/90/330s schedules from the lease TTL', () => {
    expect(pushRetryDelaysMs(120_000)).toEqual([30000, 60000, 60000]);
    expect(pushRetryDelaysMs()).toEqual([30000, 60000, 240000]);
  });

  it('queued then uploaded sends on the second non-final retry', async () => {
    const opts = setup('two');
    const invoke = vi.fn().mockResolvedValueOnce(answer('queued')).mockResolvedValueOnce(answer('uploaded'));
    expect(await retryQueuedPush({ ...opts, invoke })).toBe('sent');
    expect(invoke.mock.calls).toEqual([[false], [false]]);
    expect(opts.sleep.mock.calls).toEqual([[30000], [60000]]);
    expect(opts.onSent).toHaveBeenCalledTimes(1);
    expect(opts.onGaveUp).not.toHaveBeenCalled();
  });

  it('caps queued retries at three, flags only the last, and gives up once', async () => {
    const opts = setup('cap'); const invoke = vi.fn().mockResolvedValue(answer('queued'));
    expect(await retryQueuedPush({ ...opts, invoke })).toBe('gave_up');
    await Promise.resolve();
    expect(invoke.mock.calls).toEqual([[false], [false], [true]]);
    expect(opts.sleep.mock.calls).toEqual([[30000], [60000], [240000]]);
    expect(opts.onGaveUp).toHaveBeenCalledTimes(1);
    expect(opts.onSent).not.toHaveBeenCalled();
    // The finally removed the key: a later chain can run.
    expect(await retryQueuedPush({ ...opts, invoke: vi.fn().mockResolvedValue(answer('uploaded')) })).toBe('sent');
  });

  it('continues past an error answer and accepts final uploaded', async () => {
    const opts = setup('error');
    const invoke = vi.fn().mockResolvedValueOnce(answer('queued')).mockResolvedValueOnce({ data: null, error: new Error('offline') }).mockResolvedValueOnce(answer('uploaded'));
    expect(await retryQueuedPush({ ...opts, invoke })).toBe('sent');
    expect(invoke.mock.calls).toEqual([[false], [false], [true]]);
    expect(opts.onSent).toHaveBeenCalledTimes(1);
    expect(opts.onGaveUp).not.toHaveBeenCalled();
  });

  it('stops on pending for affiliate leads', async () => {
    const invoke = vi.fn().mockResolvedValue(answer('pending'));
    expect(await retryQueuedPush({ ...setup('lead'), invoke, retryPending: false })).toBe('stopped');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('continues on pending for inquiry orders', async () => {
    const invoke = vi.fn().mockResolvedValueOnce(answer('pending')).mockResolvedValueOnce(answer('uploaded'));
    expect(await retryQueuedPush({ ...setup('inquiry'), invoke, retryPending: true })).toBe('sent');
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('skips a second chain for the same in-flight key', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const invoke = vi.fn().mockResolvedValue(answer('uploaded'));
    const running = retryQueuedPush({ key: 'shared', invoke, sleep: () => gate });
    const other = vi.fn();
    expect(await retryQueuedPush({ ...setup('shared'), invoke: other })).toBe('skipped');
    expect(other).not.toHaveBeenCalled();
    release();
    expect(await running).toBe('sent');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('treats rejected invokes as error answers without throwing', async () => {
    const opts = setup('reject'); const invoke = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(retryQueuedPush({ ...opts, invoke })).resolves.toBe('stopped');
    expect(invoke.mock.calls).toEqual([[false], [false], [true]]);
    expect(opts.onGaveUp).not.toHaveBeenCalled();
  });
});