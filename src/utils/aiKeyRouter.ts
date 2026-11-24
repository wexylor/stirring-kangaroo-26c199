import { classifyGeminiError, type GeminiUpstreamErrorCode } from './aiPolicy.ts';

export type AiKeySlot = 'primary' | 'backup';
export type AiKeyRouteMode = 'auto' | 'primary' | 'backup';
export type SlotHealthState = 'unconfigured' | 'untested' | 'ok' | 'cooldown' | 'invalid' | 'error';

export interface ResolvedServerKeys {
  primaryKey: string;
  backupKey: string;
}

export interface KeySlotTelemetry {
  configured: boolean;
  health: SlotHealthState;
  cooldownUntilMs: number;
  lastErrorCode?: string;
  lastCheckedAt?: string;
  lastLatencyMs?: number;
}

export interface ServerKeyStatusSnapshot {
  primaryConfigured: boolean;
  backupConfigured: boolean;
  anyKeyConfigured: boolean;
  routeMode: AiKeyRouteMode;
  effectiveSlot: AiKeySlot | null;
  lastFallbackAt?: string;
  lastFallbackFrom?: AiKeySlot;
  lastFallbackTo?: AiKeySlot;
  lastFallbackReason?: string;
  slots: {
    primary: {
      configured: boolean;
      health: SlotHealthState;
      cooldownRemainingSec: number;
      cooldownUntilMs: number;
      lastErrorCode?: string;
      lastCheckedAt?: string;
      lastLatencyMs?: number;
    };
    backup: {
      configured: boolean;
      health: SlotHealthState;
      cooldownRemainingSec: number;
      cooldownUntilMs: number;
      lastErrorCode?: string;
      lastCheckedAt?: string;
      lastLatencyMs?: number;
    };
  };
}

export function resolveAiKeyRouteMode(raw: unknown): AiKeyRouteMode {
  if (raw === 'primary' || raw === 'backup' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

export function resolveServerGeminiKeys(
  env: Record<string, string | undefined>
): ResolvedServerKeys {
  const primaryKey = String(env.GEMINI_API_KEY || '').trim();
  const backupKey = String(
    env.GEMINI_API_KEY_BACKUP ||
      env.GEMINI_API_KEY_SECONDARY ||
      env.GEMINI_API_KEY_2 ||
      ''
  ).trim();

  return { primaryKey, backupKey };
}

export function isRouteConfigured(
  keys: ResolvedServerKeys,
  routeMode: AiKeyRouteMode
): boolean {
  if (routeMode === 'primary') return Boolean(keys.primaryKey);
  if (routeMode === 'backup') return Boolean(keys.backupKey);
  return Boolean(keys.primaryKey || keys.backupKey);
}

export function buildKeyExecutionPlan(params: {
  keys: ResolvedServerKeys;
  routeMode: AiKeyRouteMode;
  primaryCooldownUntilMs?: number;
  backupCooldownUntilMs?: number;
  nowMs?: number;
}): AiKeySlot[] {
  const now = params.nowMs ?? Date.now();
  const hasPrimary = Boolean(params.keys.primaryKey);
  const hasBackup = Boolean(params.keys.backupKey);

  if (params.routeMode === 'primary') {
    return hasPrimary ? ['primary'] : [];
  }
  if (params.routeMode === 'backup') {
    return hasBackup ? ['backup'] : [];
  }

  if (hasPrimary && hasBackup) {
    const primaryInCooldown = (params.primaryCooldownUntilMs ?? 0) > now;
    const backupInCooldown = (params.backupCooldownUntilMs ?? 0) > now;
    if (primaryInCooldown && !backupInCooldown) {
      return ['backup', 'primary'];
    }
    return ['primary', 'backup'];
  }

  if (hasPrimary) return ['primary'];
  if (hasBackup) return ['backup'];
  return [];
}

export function shouldFailoverToNextSlot(errorCode: GeminiUpstreamErrorCode | string): boolean {
  return (
    errorCode === 'UNAVAILABLE' ||
    errorCode === 'RESOURCE_EXHAUSTED' ||
    errorCode === 'API_KEY_INVALID' ||
    errorCode === 'PERMISSION_DENIED' ||
    errorCode === 'UPSTREAM_ERROR' ||
    errorCode === 'EMPTY_AI_RESPONSE'
  );
}

export function getSlotCooldownMs(errorCode: GeminiUpstreamErrorCode | string): number {
  if (errorCode === 'API_KEY_INVALID' || errorCode === 'PERMISSION_DENIED') {
    return 10 * 60 * 1000;
  }
  if (errorCode === 'RESOURCE_EXHAUSTED') {
    return 5 * 60 * 1000;
  }
  if (errorCode === 'UNAVAILABLE') {
    return 60 * 1000;
  }
  return 0;
}

export function mapErrorToSlotHealth(errorMessage: string): SlotHealthState {
  const classified = classifyGeminiError(errorMessage);
  if (classified.errorCode === 'API_KEY_INVALID' || classified.errorCode === 'PERMISSION_DENIED') {
    return 'invalid';
  }
  if (classified.errorCode === 'RESOURCE_EXHAUSTED' || classified.errorCode === 'UNAVAILABLE') {
    return 'cooldown';
  }
  return 'error';
}
