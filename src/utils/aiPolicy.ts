export const ADMIN_UID = 'wpjbyZa4sxgd08ONeEgK5MHBexS2';
export const STORAGE_ANALYZER_MODE = 'smart_people_notebook_analyzer_mode';

export type AnalyzerPreferenceMode = 'auto' | 'local';

export interface GlobalAiConfig {
  sharedAiEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ServerAiStatus {
  sharedAiEnabled: boolean;
  serverKeyConfigured: boolean;
}

export type CloudFallbackReasonCode =
  | 'LOCAL_ONLY_MODE'
  | 'OFFLINE'
  | 'AI_DISABLED_BY_ADMIN'
  | 'NO_API_KEY';

export function isAdminUid(uid?: string | null, adminUid = ADMIN_UID): boolean {
  if (!uid || !adminUid) return false;
  return uid.trim() === adminUid.trim();
}

export function resolveAnalyzerMode(raw?: string | null): AnalyzerPreferenceMode {
  return raw === 'local' ? 'local' : 'auto';
}

export function parseGlobalAiConfig(raw: unknown): GlobalAiConfig {
  if (!raw || typeof raw !== 'object') {
    return { sharedAiEnabled: true };
  }
  const obj = raw as {
    sharedAiEnabled?: unknown;
    updatedAt?: unknown;
    updatedBy?: unknown;
  };
  return {
    sharedAiEnabled: typeof obj.sharedAiEnabled === 'boolean' ? obj.sharedAiEnabled : true,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    updatedBy: typeof obj.updatedBy === 'string' ? obj.updatedBy : undefined,
  };
}

export function shouldUseCloudAi(params: {
  preferenceMode: AnalyzerPreferenceMode;
  isOnline: boolean;
  sharedAiEnabled: boolean;
  serverKeyConfigured: boolean;
}): { useCloud: boolean; reason?: CloudFallbackReasonCode } {
  if (params.preferenceMode === 'local') {
    return { useCloud: false, reason: 'LOCAL_ONLY_MODE' };
  }
  if (!params.isOnline) {
    return { useCloud: false, reason: 'OFFLINE' };
  }
  if (!params.sharedAiEnabled) {
    return { useCloud: false, reason: 'AI_DISABLED_BY_ADMIN' };
  }
  if (!params.serverKeyConfigured) {
    return { useCloud: false, reason: 'NO_API_KEY' };
  }
  return { useCloud: true };
}

export type GeminiUpstreamErrorCode =
  | 'UNAVAILABLE'
  | 'RESOURCE_EXHAUSTED'
  | 'API_KEY_INVALID'
  | 'PERMISSION_DENIED'
  | 'MODEL_NOT_FOUND'
  | 'UPSTREAM_ERROR';

export interface UpstreamErrorClassification {
  httpStatus: number;
  errorCode: GeminiUpstreamErrorCode;
  retryable: boolean;
}

export function classifyGeminiError(rawMessage: string): UpstreamErrorClassification {
  const msg = String(rawMessage || '');
  const upper = msg.toUpperCase();

  if (
    upper.includes('UNAVAILABLE') ||
    upper.includes('"CODE":503') ||
    upper.includes('HIGH DEMAND') ||
    upper.includes('503')
  ) {
    return { httpStatus: 503, errorCode: 'UNAVAILABLE', retryable: true };
  }
  if (upper.includes('RESOURCE_EXHAUSTED') || upper.includes('"CODE":429') || upper.includes('429')) {
    return { httpStatus: 429, errorCode: 'RESOURCE_EXHAUSTED', retryable: true };
  }
  if (upper.includes('API_KEY_INVALID') || upper.includes('API KEY NOT VALID')) {
    return { httpStatus: 400, errorCode: 'API_KEY_INVALID', retryable: false };
  }
  if (upper.includes('PERMISSION_DENIED') || upper.includes('"CODE":403')) {
    return { httpStatus: 403, errorCode: 'PERMISSION_DENIED', retryable: false };
  }
  if (upper.includes('NOT_FOUND') || upper.includes('"CODE":404')) {
    return { httpStatus: 404, errorCode: 'MODEL_NOT_FOUND', retryable: false };
  }
  return { httpStatus: 502, errorCode: 'UPSTREAM_ERROR', retryable: false };
}
