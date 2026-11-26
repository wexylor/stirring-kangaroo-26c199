export const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000;
export const KEEP_ALIVE_MIN_GAP_MS = 45 * 1000;

export interface KeepAliveStatus {
  active: boolean;
  intervalMs: number;
  lastPingAtMs: number | null;
  lastSuccessAtMs: number | null;
  lastLatencyMs: number | null;
  lastStatus: 'idle' | 'ok' | 'error';
  serverUptimeSec: number | null;
  pingCount: number;
  consecutiveFailures: number;
}

export function createInitialKeepAliveStatus(): KeepAliveStatus {
  return {
    active: true,
    intervalMs: KEEP_ALIVE_INTERVAL_MS,
    lastPingAtMs: null,
    lastSuccessAtMs: null,
    lastLatencyMs: null,
    lastStatus: 'idle',
    serverUptimeSec: null,
    pingCount: 0,
    consecutiveFailures: 0,
  };
}

export function shouldSendKeepAlivePing(params: {
  nowMs: number;
  lastPingAtMs: number | null;
  isVisible: boolean;
  isOnline: boolean;
  force?: boolean;
  minGapMs?: number;
}): boolean {
  if (!params.isOnline) return false;
  if (params.force) return true;
  if (!params.isVisible) return false;
  if (params.lastPingAtMs === null) return true;
  const minGap = params.minGapMs ?? KEEP_ALIVE_MIN_GAP_MS;
  return params.nowMs - params.lastPingAtMs >= minGap;
}

export function recordKeepAliveResult(
  prev: KeepAliveStatus,
  result: {
    nowMs: number;
    ok: boolean;
    latencyMs: number;
    serverUptimeSec?: number | null;
  }
): KeepAliveStatus {
  if (result.ok) {
    return {
      ...prev,
      active: true,
      lastPingAtMs: result.nowMs,
      lastSuccessAtMs: result.nowMs,
      lastLatencyMs: Math.max(0, Math.round(result.latencyMs)),
      lastStatus: 'ok',
      serverUptimeSec:
        typeof result.serverUptimeSec === 'number' && Number.isFinite(result.serverUptimeSec)
          ? Math.max(0, Math.floor(result.serverUptimeSec))
          : prev.serverUptimeSec,
      pingCount: prev.pingCount + 1,
      consecutiveFailures: 0,
    };
  }

  return {
    ...prev,
    active: true,
    lastPingAtMs: result.nowMs,
    lastLatencyMs: Math.max(0, Math.round(result.latencyMs)),
    lastStatus: 'error',
    pingCount: prev.pingCount + 1,
    consecutiveFailures: prev.consecutiveFailures + 1,
  };
}

export async function sendServerHealthPing(timeoutMs = 15000): Promise<{
  ok: boolean;
  latencyMs: number;
  serverUptimeSec: number | null;
}> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`/api/health?_t=${startedAt}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startedAt;
    if (!res.ok) {
      return { ok: false, latencyMs, serverUptimeSec: null };
    }
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; uptimeSec?: number }
      | null;
    if (!data?.ok) {
      return { ok: false, latencyMs, serverUptimeSec: null };
    }
    return {
      ok: true,
      latencyMs,
      serverUptimeSec: typeof data.uptimeSec === 'number' ? data.uptimeSec : null,
    };
  } catch {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      serverUptimeSec: null,
    };
  } finally {
    clearTimeout(timer);
  }
}
