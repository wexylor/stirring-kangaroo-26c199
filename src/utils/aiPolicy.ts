import { resolveAiKeyRouteMode, type AiKeyRouteMode } from './aiKeyRouter.ts';
import {
  sanitizeAiPromptStyle,
  sanitizeAnnouncement,
  sanitizePoll,
  sanitizeSampleTemplate,
  sanitizeUiDefaults,
  sanitizeVersionString,
  type AiPromptStyleConfig,
  type FeaturePoll,
  type GlobalAnnouncement,
  type SampleContactTemplate,
  type UiDefaultsConfig,
} from './adminOps.ts';

export const ADMIN_UID = 'wpjbyZa4sxgd08ONeEgK5MHBexS2';
export const STORAGE_ANALYZER_MODE = 'smart_people_notebook_analyzer_mode';

export type AnalyzerPreferenceMode = 'auto' | 'local';
export type AiModelPreset = 'fast' | 'balanced' | 'accurate';

export interface AiModelOptionSpec {
  preset: AiModelPreset;
  modelId: 'gemini-3.1-flash-lite' | 'gemini-4-hydrogen';
  thinkingLevel: 'MINIMAL' | 'LOW' | 'HIGH';
}

export const AI_MODEL_SPECS: Record<AiModelPreset, AiModelOptionSpec> = {
  fast: {
    preset: 'fast',
    modelId: 'gemini-3.1-flash-lite',
    thinkingLevel: 'MINIMAL',
  },
  balanced: {
    preset: 'balanced',
    modelId: 'gemini-4-hydrogen',
    thinkingLevel: 'LOW',
  },
  accurate: {
    preset: 'accurate',
    modelId: 'gemini-4-hydrogen',
    thinkingLevel: 'HIGH',
  },
};

export function resolveAiModelPreset(raw: unknown): AiModelPreset {
  if (raw === 'fast' || raw === 'balanced' || raw === 'accurate') {
    return raw;
  }
  return 'balanced';
}

export function getAiModelSpec(preset: unknown): AiModelOptionSpec {
  return AI_MODEL_SPECS[resolveAiModelPreset(preset)];
}

export interface GlobalAiConfig {
  sharedAiEnabled: boolean;
  guestAiEnabled: boolean;
  readOnlyMode: boolean;
  keyRouteMode?: AiKeyRouteMode;
  aiModelPreset?: AiModelPreset;
  aiPromptStyle?: AiPromptStyleConfig;
  uiDefaults?: UiDefaultsConfig;
  minClientVersion?: string;
  extraAdminUids?: string[];
  extraAdminEmails?: string[];
  announcement?: GlobalAnnouncement;
  sampleTemplate?: SampleContactTemplate;
  poll?: FeaturePoll;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ServerAiStatus {
  sharedAiEnabled: boolean;
  guestAiEnabled: boolean;
  readOnlyMode: boolean;
  serverKeyConfigured: boolean;
  isAdmin?: boolean;
  keyRouteMode?: AiKeyRouteMode;
  aiModelPreset?: AiModelPreset;
  aiPromptStyle?: AiPromptStyleConfig;
  uiDefaults?: UiDefaultsConfig;
  minClientVersion?: string;
  serverStartedAtMs?: number;
  geminiModel?: string;
  announcement?: GlobalAnnouncement;
  sampleTemplate?: SampleContactTemplate;
  poll?: FeaturePoll;
}

export type CloudFallbackReasonCode =
  | 'LOCAL_ONLY_MODE'
  | 'OFFLINE'
  | 'AI_DISABLED_BY_ADMIN'
  | 'GUEST_AI_DISABLED'
  | 'NO_API_KEY';

export function parseAdminList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .map((v) => String(v || '').trim())
          .filter(Boolean)
          .slice(0, 25)
      )
    );
  }
  if (typeof raw === 'string') {
    return Array.from(
      new Set(
        raw
          .split(/[\s,;]+/)
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, 25)
      )
    );
  }
  return [];
}

export function isVerifiedAdminIdentity(
  identity: { uid?: string | null; email?: string | null; emailVerified?: boolean } | null | undefined,
  policy: {
    allowedUids: string[];
    allowedEmails?: string[];
  }
): boolean {
  if (!identity) return false;
  const uid = String(identity.uid || '').trim();
  if (uid && policy.allowedUids.some((allowed) => allowed.trim() === uid)) {
    return true;
  }
  const email = String(identity.email || '').trim().toLowerCase();
  if (
    email &&
    identity.emailVerified === true &&
    Array.isArray(policy.allowedEmails) &&
    policy.allowedEmails.some((allowed) => allowed.trim().toLowerCase() === email)
  ) {
    return true;
  }
  return false;
}

export function isAdminUid(uid?: string | null, adminUid = ADMIN_UID): boolean {
  if (!uid || !adminUid) return false;
  const trimmedUid = uid.trim();
  return parseAdminList(adminUid).includes(trimmedUid);
}

export function resolveAnalyzerMode(raw?: string | null): AnalyzerPreferenceMode {
  return raw === 'local' ? 'local' : 'auto';
}

export function parseGlobalAiConfig(raw: unknown): GlobalAiConfig {
  if (!raw || typeof raw !== 'object') {
    return {
      sharedAiEnabled: true,
      guestAiEnabled: true,
      readOnlyMode: false,
      keyRouteMode: 'auto',
      aiModelPreset: 'balanced',
    };
  }
  const obj = raw as {
    sharedAiEnabled?: unknown;
    guestAiEnabled?: unknown;
    readOnlyMode?: unknown;
    keyRouteMode?: unknown;
    aiModelPreset?: unknown;
    aiPromptStyle?: unknown;
    uiDefaults?: unknown;
    minClientVersion?: unknown;
    extraAdminUids?: unknown;
    extraAdminEmails?: unknown;
    announcement?: unknown;
    sampleTemplate?: unknown;
    poll?: unknown;
    updatedAt?: unknown;
    updatedBy?: unknown;
  };
  const extraUids = parseAdminList(obj.extraAdminUids).filter((v) => !v.includes('@'));
  const extraEmails = parseAdminList(obj.extraAdminEmails)
    .filter((v) => v.includes('@'))
    .map((v) => v.toLowerCase());

  const cleanMinVer =
    typeof obj.minClientVersion === 'string' && obj.minClientVersion.trim()
      ? sanitizeVersionString(obj.minClientVersion)
      : undefined;

  return {
    sharedAiEnabled: typeof obj.sharedAiEnabled === 'boolean' ? obj.sharedAiEnabled : true,
    guestAiEnabled: typeof obj.guestAiEnabled === 'boolean' ? obj.guestAiEnabled : true,
    readOnlyMode: typeof obj.readOnlyMode === 'boolean' ? obj.readOnlyMode : false,
    keyRouteMode: resolveAiKeyRouteMode(obj.keyRouteMode),
    aiModelPreset: resolveAiModelPreset(obj.aiModelPreset),
    ...(obj.aiPromptStyle ? { aiPromptStyle: sanitizeAiPromptStyle(obj.aiPromptStyle) } : {}),
    ...(obj.uiDefaults ? { uiDefaults: sanitizeUiDefaults(obj.uiDefaults) } : {}),
    ...(cleanMinVer ? { minClientVersion: cleanMinVer } : {}),
    ...(extraUids.length > 0 ? { extraAdminUids: extraUids } : {}),
    ...(extraEmails.length > 0 ? { extraAdminEmails: extraEmails } : {}),
    announcement: obj.announcement ? sanitizeAnnouncement(obj.announcement) : undefined,
    sampleTemplate: obj.sampleTemplate ? sanitizeSampleTemplate(obj.sampleTemplate) : undefined,
    poll: obj.poll ? sanitizePoll(obj.poll) : undefined,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    updatedBy: typeof obj.updatedBy === 'string' ? obj.updatedBy : undefined,
  };
}

export function shouldUseCloudAi(params: {
  preferenceMode: AnalyzerPreferenceMode;
  isOnline: boolean;
  sharedAiEnabled: boolean;
  serverKeyConfigured: boolean;
  isGuest?: boolean;
  guestAiEnabled?: boolean;
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
  if (params.isGuest && params.guestAiEnabled === false) {
    return { useCloud: false, reason: 'GUEST_AI_DISABLED' };
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
