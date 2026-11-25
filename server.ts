import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { createServer as createHttpServer } from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type, type GenerateContentParameters } from '@google/genai';
import {
  ADMIN_UID as DEFAULT_ADMIN_UID,
  DEFAULT_ADMIN_EMAIL,
  classifyGeminiError,
  getAiModelSpec,
  isVerifiedAdminIdentity,
  parseAdminList,
  resolveAiModelPreset,
  type AiModelPreset,
} from './src/utils/aiPolicy.ts';
import {
  buildKeyExecutionPlan,
  getSlotCooldownMs,
  isRouteConfigured,
  mapErrorToSlotHealth,
  resolveAiKeyRouteMode,
  resolveServerGeminiKeys,
  shouldFailoverToNextSlot,
  type AiKeyRouteMode,
  type AiKeySlot,
  type KeySlotTelemetry,
  type ServerKeyStatusSnapshot,
} from './src/utils/aiKeyRouter.ts';
import {
  ALLOWED_FEATURE_EVENTS,
  APP_VERSION,
  DEFAULT_AI_PROMPT_STYLE,
  buildAdminExportCsv,
  buildAdvisorCacheKey,
  buildDossierCacheKey,
  computeEndpointStats,
  computeErrorBreakdown,
  createDefaultSampleTemplate,
  createDefaultUiDefaults,
  createEmptyActivityHeatmap,
  createEmptyFeatureCounters,
  isTrafficSpike,
  maskWebhookUrl,
  recordActivitySlot,
  sanitizeAiPromptStyle,
  sanitizeAnnouncement,
  sanitizePoll,
  sanitizeSampleTemplate,
  sanitizeTicketTags,
  sanitizeUiDefaults,
  sanitizeVersionString,
  validateSafeWebhookUrl,
  type ActivityHeatmapStats,
  type AdminSystemEvent,
  type AiEndpointName,
  type AiPromptStyleConfig,
  type AiTelemetryRecord,
  type AlertWebhookTriggers,
  type DailyDigestSummary,
  type FeatureEventKey,
  type FeaturePoll,
  type FeedbackTicket,
  type GlobalAnnouncement,
  type SafeWebhookStatus,
  type SampleContactTemplate,
  type ServiceProbeEntry,
  type ServicesHealthSnapshot,
  type TicketTag,
  type UiDefaultsConfig,
  type UserFeedbackTicketSummary,
} from './src/utils/adminOps.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveListenPort(): number {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 65535) return parsed;
    }
    if (arg.startsWith('--port=')) {
      const parsed = Number(arg.slice('--port='.length));
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 65535) return parsed;
    }
  }
  const npmPort = Number(process.env.npm_config_port);
  if (Number.isFinite(npmPort) && npmPort > 0 && npmPort <= 65535) {
    return npmPort;
  }
  for (const arg of args) {
    if (/^\d+$/.test(arg)) {
      const parsed = Number(arg);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 65535) return parsed;
    }
  }
  const envPort = Number(process.env.PORT);
  if (Number.isFinite(envPort) && envPort > 0 && envPort <= 65535) {
    if (process.env.NGINX_PORT && Number(process.env.NGINX_PORT) === envPort) {
      return Number(process.env.DEFAULT_APP_PORT) || 3000;
    }
    return envPort;
  }
  return Number(process.env.DEFAULT_APP_PORT) || 3000;
}

const PORT = resolveListenPort();
const SERVER_STARTED_AT_MS = Date.now();
const ENV_ADMIN_UID_TOKENS = parseAdminList(process.env.ADMIN_UID);
const ENV_ADMIN_EMAIL_TOKENS = parseAdminList(process.env.ADMIN_EMAIL);

function buildAdminPolicy(cfg?: Pick<RtdbAiConfig, 'extraAdminUids' | 'extraAdminEmails'>) {
  const allowedUids = Array.from(
    new Set([
      DEFAULT_ADMIN_UID,
      ...ENV_ADMIN_UID_TOKENS.filter((v) => !v.includes('@')),
      ...(cfg?.extraAdminUids || []),
    ])
  );
  const allowedEmails = Array.from(
    new Set(
      [
        DEFAULT_ADMIN_EMAIL,
        ...ENV_ADMIN_UID_TOKENS.filter((v) => v.includes('@')),
        ...ENV_ADMIN_EMAIL_TOKENS.filter((v) => v.includes('@')),
        ...(cfg?.extraAdminEmails || []),
      ].map((v) => v.toLowerCase())
    )
  );
  return { allowedUids, allowedEmails };
}

function checkIsAdminIdentity(
  identity: { uid?: string | null; email?: string | null; emailVerified?: boolean } | null | undefined,
  cfg?: Pick<RtdbAiConfig, 'extraAdminUids' | 'extraAdminEmails'>
): boolean {
  return isVerifiedAdminIdentity(identity, buildAdminPolicy(cfg));
}

const FIREBASE_RTDB_URL =
  'https://friends-37e97-default-rtdb.europe-west1.firebasedatabase.app';
const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY || 'AIzaSyCZzb83vFUDEruoR4KMFBG-7CVnyBwkRDc';

interface RtdbAiConfig {
  sharedAiEnabled: boolean;
  guestAiEnabled: boolean;
  readOnlyMode: boolean;
  keyRouteMode: AiKeyRouteMode;
  aiModelPreset: AiModelPreset;
  aiPromptStyle: AiPromptStyleConfig;
  uiDefaults: UiDefaultsConfig;
  minClientVersion: string;
  dailyDigestHourUtc: number;
  extraAdminUids: string[];
  extraAdminEmails: string[];
  announcement: GlobalAnnouncement;
  sampleTemplate: SampleContactTemplate;
  poll: FeaturePoll;
}

interface MemoryConfigState extends RtdbAiConfig {
  updatedAt: string;
  persistedToRtdb: boolean;
}

const defaultRtdbConfig: RtdbAiConfig = {
  sharedAiEnabled: true,
  guestAiEnabled: true,
  readOnlyMode: false,
  keyRouteMode: 'auto',
  aiModelPreset: 'balanced',
  aiPromptStyle: { ...DEFAULT_AI_PROMPT_STYLE },
  uiDefaults: createDefaultUiDefaults(),
  minClientVersion: APP_VERSION,
  dailyDigestHourUtc: 18,
  extraAdminUids: [],
  extraAdminEmails: [],
  announcement: { enabled: false, text: '', tone: 'info' },
  sampleTemplate: createDefaultSampleTemplate(),
  poll: { id: 'default-poll', enabled: false, question: '', options: [] },
};

let memoryOverride: MemoryConfigState | null = null;
let rtdbCache: { value: RtdbAiConfig; fetchedAt: number; latencyMs: number; ok: boolean } | null = null;

const slotTelemetry: Record<AiKeySlot, KeySlotTelemetry> = {
  primary: { configured: false, health: 'untested', cooldownUntilMs: 0 },
  backup: { configured: false, health: 'untested', cooldownUntilMs: 0 },
};

let lastFallbackInfo: {
  at: string;
  from: AiKeySlot;
  to: AiKeySlot;
  reason: string;
} | null = null;

// Cache (15 min TTL, max 200 entries)
const CACHE_TTL_MS = 15 * 60 * 1000;
const advisorCache = new Map<string, { data: unknown; cachedAt: number; estTokens: number }>();
const dossierCache = new Map<string, { data: unknown; cachedAt: number; estTokens: number }>();

// Telemetry & Feature Analytics
const telemetryRecords: AiTelemetryRecord[] = [];
const featureCounters = createEmptyFeatureCounters();
const activityHeatmap: ActivityHeatmapStats = createEmptyActivityHeatmap();
let dossierRebuildCount = 0;
let advisorCacheHits = 0;
let dossierCacheHits = 0;
let tokensSavedEstimate = 0;
const aiRequestTimestamps: number[] = [];

// Daily active tracking (anonymized SHA-256 hash)
let activeDayKey = new Date().toISOString().slice(0, 10);
const dailyVisitorHashes = new Set<string>();
const notifiedNewUserUids = new Set<string>();

// Feedback Inbox & Poll Voter Dedup
let ticketsStore: FeedbackTicket[] = [];
let ticketsLoadedFromRtdb = false;
const pollVotersMap = new Map<string, Set<string>>();

// Admin Event Log
const systemEventsLog: AdminSystemEvent[] = [];

function pushSystemEvent(level: AdminSystemEvent['level'], message: string) {
  systemEventsLog.unshift({
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    message: message.slice(0, 240),
  });
  if (systemEventsLog.length > 60) {
    systemEventsLog.length = 60;
  }
}

// Webhook Alerts State
function resolveEnvWebhookUrl(): string {
  const direct = String(process.env.ALERT_WEBHOOK_URL || '').trim();
  if (direct) return direct;
  const tgToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const tgChat = String(process.env.TELEGRAM_CHAT_ID || '').trim();
  if (tgToken && tgChat) {
    return `https://api.telegram.org/bot${tgToken}/sendMessage?chat_id=${encodeURIComponent(tgChat)}`;
  }
  return '';
}

const webhookConfig: {
  url: string;
  triggers: AlertWebhookTriggers;
  dailyDigestHourUtc: number;
  lastAutoDigestDateKey?: string;
  lastSentAt?: string;
  lastError?: string;
} = {
  url: resolveEnvWebhookUrl(),
  triggers: {
    onInvalidKey: true,
    onQuotaExceeded: true,
    onTrafficSpike: true,
    onNewUser: false,
    onNewTicket: true,
    dailyDigestEnabled: false,
  },
  dailyDigestHourUtc: 18,
};

const alertThrottleMap = new Map<string, number>();

function getSafeWebhookStatus(hourOverride?: number): SafeWebhookStatus {
  const validation = validateSafeWebhookUrl(webhookConfig.url);
  const hour =
    typeof hourOverride === 'number' && Number.isFinite(hourOverride)
      ? hourOverride
      : webhookConfig.dailyDigestHourUtc;
  if (!webhookConfig.url || !validation.valid || !validation.normalizedUrl) {
    return {
      configured: false,
      triggers: { ...webhookConfig.triggers },
      dailyDigestHourUtc: hour,
      lastAutoDigestDateKey: webhookConfig.lastAutoDigestDateKey,
      lastSentAt: webhookConfig.lastSentAt,
      lastError: webhookConfig.lastError,
    };
  }
  return {
    configured: true,
    provider: validation.provider,
    maskedTarget: maskWebhookUrl(validation.normalizedUrl),
    triggers: { ...webhookConfig.triggers },
    dailyDigestHourUtc: hour,
    lastAutoDigestDateKey: webhookConfig.lastAutoDigestDateKey,
    lastSentAt: webhookConfig.lastSentAt,
    lastError: webhookConfig.lastError,
  };
}

async function dispatchWebhookMessage(title: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const validation = validateSafeWebhookUrl(webhookConfig.url);
  if (!webhookConfig.url) {
    return { ok: false, error: 'Webhook URL is not configured' };
  }
  if (!validation.valid || !validation.normalizedUrl) {
    return { ok: false, error: validation.error || 'Unsafe or invalid webhook URL' };
  }

  const targetUrl = new URL(validation.normalizedUrl);
  const fullText = `${title}\n${body}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    let payload: Record<string, unknown>;
    if (validation.provider === 'discord') {
      payload = { content: `**${title}**\n${body}` };
    } else if (validation.provider === 'telegram') {
      const chatId = targetUrl.searchParams.get('chat_id');
      payload = {
        ...(chatId ? { chat_id: chatId } : {}),
        text: fullText,
        disable_web_page_preview: true,
      };
    } else {
      payload = { title, text: body, timestamp: new Date().toISOString(), appVersion: APP_VERSION };
    }

    const res = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = `HTTP ${res.status}`;
      webhookConfig.lastError = errText;
      return { ok: false, error: errText };
    }
    webhookConfig.lastSentAt = new Date().toISOString();
    webhookConfig.lastError = undefined;
    return { ok: true };
  } catch (err) {
    const errText = err instanceof Error ? err.message : 'Network error';
    webhookConfig.lastError = errText;
    return { ok: false, error: errText };
  } finally {
    clearTimeout(timer);
  }
}

async function triggerAlertEvent(
  alertKey: string,
  title: string,
  body: string,
  cooldownMs = 60_000
): Promise<void> {
  pushSystemEvent('warning', `${title}: ${body}`);
  if (!webhookConfig.url) return;
  const now = Date.now();
  const prev = alertThrottleMap.get(alertKey) ?? 0;
  if (now - prev < cooldownMs) return;
  alertThrottleMap.set(alertKey, now);
  await dispatchWebhookMessage(title, body);
}

function rotateDayIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== activeDayKey) {
    activeDayKey = today;
    dailyVisitorHashes.clear();
  }
}

function trackVisitorFromReq(req: Request, explicitKey?: string) {
  rotateDayIfNeeded();
  const raw =
    explicitKey ||
    `${req.ip || '0.0.0.0'}|${String(req.headers['user-agent'] || '').slice(0, 80)}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  dailyVisitorHashes.add(hash);
}

function buildDailyDigest(): DailyDigestSummary {
  rotateDayIfNeeded();
  const todayPrefix = activeDayKey;
  const todayAi = telemetryRecords.filter((r) => r.timestamp.startsWith(todayPrefix));
  return {
    dateKey: activeDayKey,
    activeVisitors: dailyVisitorHashes.size,
    aiRequests: todayAi.length,
    aiErrors: todayAi.filter((r) => !r.ok).length,
    cacheHits: todayAi.filter((r) => r.cacheHit).length,
    tokensSavedEstimate,
    openTickets: ticketsStore.filter((t) => t.status === 'open').length,
  };
}

function recordAiTelemetry(entry: Omit<AiTelemetryRecord, 'id' | 'timestamp'>) {
  const rec: AiTelemetryRecord = {
    ...entry,
    id: `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  telemetryRecords.unshift(rec);
  if (telemetryRecords.length > 120) {
    telemetryRecords.length = 120;
  }
}

function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function syncConfiguredFlags() {
  const keys = resolveServerGeminiKeys(process.env);
  slotTelemetry.primary.configured = Boolean(keys.primaryKey);
  if (!keys.primaryKey) {
    slotTelemetry.primary.health = 'unconfigured';
    slotTelemetry.primary.cooldownUntilMs = 0;
  } else if (slotTelemetry.primary.health === 'unconfigured') {
    slotTelemetry.primary.health = 'untested';
  }

  slotTelemetry.backup.configured = Boolean(keys.backupKey);
  if (!keys.backupKey) {
    slotTelemetry.backup.health = 'unconfigured';
    slotTelemetry.backup.cooldownUntilMs = 0;
  } else if (slotTelemetry.backup.health === 'unconfigured') {
    slotTelemetry.backup.health = 'untested';
  }
  return keys;
}

async function fetchRtdbAiConfig(forceRefresh = false): Promise<{
  config: RtdbAiConfig | null;
  ok: boolean;
  latencyMs: number;
}> {
  const now = Date.now();
  if (!forceRefresh && rtdbCache && now - rtdbCache.fetchedAt < 4000) {
    return { config: rtdbCache.value, ok: rtdbCache.ok, latencyMs: rtdbCache.latencyMs };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  const start = Date.now();
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/appConfig/aiSettings.json`, {
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { config: null, ok: false, latencyMs };
    }
    const data = (await res.json()) as Record<string, unknown> | null;
    if (data && typeof data === 'object') {
      const hourRaw = Number(data.dailyDigestHourUtc);
      const dailyDigestHourUtc =
        Number.isFinite(hourRaw) && hourRaw >= 0 && hourRaw <= 23
          ? Math.floor(hourRaw)
          : 18;
      const cfg: RtdbAiConfig = {
        sharedAiEnabled:
          typeof data.sharedAiEnabled === 'boolean' ? data.sharedAiEnabled : true,
        guestAiEnabled:
          typeof data.guestAiEnabled === 'boolean' ? data.guestAiEnabled : true,
        readOnlyMode:
          typeof data.readOnlyMode === 'boolean' ? data.readOnlyMode : false,
        keyRouteMode: resolveAiKeyRouteMode(data.keyRouteMode),
        aiModelPreset: resolveAiModelPreset(data.aiModelPreset),
        aiPromptStyle: sanitizeAiPromptStyle(data.aiPromptStyle),
        uiDefaults: sanitizeUiDefaults(data.uiDefaults),
        minClientVersion: data.minClientVersion
          ? sanitizeVersionString(data.minClientVersion)
          : APP_VERSION,
        dailyDigestHourUtc,
        extraAdminUids: parseAdminList(data.extraAdminUids).filter((v) => !v.includes('@')),
        extraAdminEmails: parseAdminList(data.extraAdminEmails)
          .filter((v) => v.includes('@'))
          .map((v) => v.toLowerCase()),
        announcement: sanitizeAnnouncement(data.announcement),
        sampleTemplate: sanitizeSampleTemplate(data.sampleTemplate),
        poll: sanitizePoll(data.poll),
      };
      rtdbCache = { value: cfg, fetchedAt: now, latencyMs, ok: true };
      return { config: cfg, ok: true, latencyMs };
    }
    rtdbCache = { value: defaultRtdbConfig, fetchedAt: now, latencyMs, ok: true };
    return { config: null, ok: true, latencyMs };
  } catch {
    const latencyMs = Date.now() - start;
    return { config: null, ok: false, latencyMs };
  } finally {
    clearTimeout(timer);
  }
}

async function patchRtdbConfig(token: string, patchPayload: Record<string, unknown>): Promise<boolean> {
  try {
    const rtdbRes = await fetch(
      `${FIREBASE_RTDB_URL}/appConfig/aiSettings.json?auth=${encodeURIComponent(token)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload),
      }
    );
    return rtdbRes.ok;
  } catch {
    return false;
  }
}

async function loadTicketsFromRtdbOnce() {
  if (ticketsLoadedFromRtdb) return;
  ticketsLoadedFromRtdb = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/appConfig/tickets.json`, {
      signal: controller.signal,
    });
    if (!res.ok) return;
    const data = (await res.json()) as Record<string, FeedbackTicket> | null;
    if (data && typeof data === 'object') {
      const parsed = Object.values(data)
        .filter((t): t is FeedbackTicket => Boolean(t && typeof t === 'object' && t.id && t.text))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      if (parsed.length > 0 && ticketsStore.length === 0) {
        ticketsStore = parsed.slice(0, 100);
      }
    }
  } catch {
    // Ignore RTDB read errors if rules deny public read
  } finally {
    clearTimeout(timer);
  }
}

async function persistTicketsToRtdb(token?: string) {
  if (!token) return;
  const mapObj: Record<string, FeedbackTicket> = {};
  for (const t of ticketsStore.slice(0, 100)) {
    mapObj[t.id] = t;
  }
  await fetch(
    `${FIREBASE_RTDB_URL}/appConfig/tickets.json?auth=${encodeURIComponent(token)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapObj),
    }
  ).catch(() => {});
}

async function getEffectiveControlState(forceRtdb = false): Promise<{
  config: RtdbAiConfig;
  serverKeyConfigured: boolean;
  rtdbOk: boolean;
  rtdbLatencyMs: number;
}> {
  const keys = syncConfiguredFlags();
  const rtdbRes = await fetchRtdbAiConfig(forceRtdb);
  const rtdbVal = rtdbRes.config;

  const useMemoryOverride =
    memoryOverride &&
    (!memoryOverride.persistedToRtdb ||
      Date.now() - Date.parse(memoryOverride.updatedAt) < 15000);

  const base = rtdbVal || memoryOverride || defaultRtdbConfig;
  const config: RtdbAiConfig = useMemoryOverride && memoryOverride
    ? {
        sharedAiEnabled: memoryOverride.sharedAiEnabled,
        guestAiEnabled: memoryOverride.guestAiEnabled,
        readOnlyMode: memoryOverride.readOnlyMode,
        keyRouteMode: memoryOverride.keyRouteMode,
        aiModelPreset: memoryOverride.aiModelPreset,
        aiPromptStyle: memoryOverride.aiPromptStyle,
        uiDefaults: memoryOverride.uiDefaults,
        minClientVersion: memoryOverride.minClientVersion,
        dailyDigestHourUtc: memoryOverride.dailyDigestHourUtc,
        extraAdminUids: memoryOverride.extraAdminUids,
        extraAdminEmails: memoryOverride.extraAdminEmails,
        announcement: memoryOverride.announcement,
        sampleTemplate: memoryOverride.sampleTemplate,
        poll: memoryOverride.poll,
      }
    : base;

  return {
    config,
    serverKeyConfigured: isRouteConfigured(keys, config.keyRouteMode),
    rtdbOk: rtdbRes.ok,
    rtdbLatencyMs: rtdbRes.latencyMs,
  };
}

function commitMemoryOverride(next: RtdbAiConfig, rtdbSynced: boolean) {
  const nowIso = new Date().toISOString();
  memoryOverride = {
    ...next,
    updatedAt: nowIso,
    persistedToRtdb: rtdbSynced,
  };
  rtdbCache = {
    value: next,
    fetchedAt: Date.now(),
    latencyMs: rtdbCache?.latencyMs ?? 0,
    ok: true,
  };
}

function buildSafeServerKeySnapshot(routeMode: AiKeyRouteMode): ServerKeyStatusSnapshot {
  const keys = syncConfiguredFlags();
  const now = Date.now();
  const plan = buildKeyExecutionPlan({
    keys,
    routeMode,
    primaryCooldownUntilMs: slotTelemetry.primary.cooldownUntilMs,
    backupCooldownUntilMs: slotTelemetry.backup.cooldownUntilMs,
    nowMs: now,
  });

  const formatSlot = (slot: AiKeySlot, configured: boolean) => {
    const info = slotTelemetry[slot];
    const cooldownRemainingSec =
      info.cooldownUntilMs > now ? Math.ceil((info.cooldownUntilMs - now) / 1000) : 0;
    const effectiveHealth = !configured
      ? 'unconfigured'
      : cooldownRemainingSec > 0 && info.health === 'cooldown'
      ? 'cooldown'
      : cooldownRemainingSec === 0 && info.health === 'cooldown'
      ? 'untested'
      : info.health;

    return {
      configured,
      health: effectiveHealth,
      cooldownRemainingSec,
      cooldownUntilMs: info.cooldownUntilMs,
      lastErrorCode: info.lastErrorCode,
      lastCheckedAt: info.lastCheckedAt,
      lastLatencyMs: info.lastLatencyMs,
    };
  };

  return {
    primaryConfigured: Boolean(keys.primaryKey),
    backupConfigured: Boolean(keys.backupKey),
    anyKeyConfigured: Boolean(keys.primaryKey || keys.backupKey),
    routeMode,
    effectiveSlot: plan[0] ?? null,
    lastFallbackAt: lastFallbackInfo?.at,
    lastFallbackFrom: lastFallbackInfo?.from,
    lastFallbackTo: lastFallbackInfo?.to,
    lastFallbackReason: lastFallbackInfo?.reason,
    slots: {
      primary: formatSlot('primary', Boolean(keys.primaryKey)),
      backup: formatSlot('backup', Boolean(keys.backupKey)),
    },
  };
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: GenerateContentParameters,
  maxAttempts = 2
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err || '');
      const info = classifyGeminiError(msg);
      if (!info.retryable || attempt >= maxAttempts) {
        throw err;
      }
      await waitMs(450 * attempt);
    }
  }
  throw lastError;
}

async function executeGeminiWithFallback(
  routeMode: AiKeyRouteMode,
  params: GenerateContentParameters
): Promise<{
  response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>;
  slotUsed: AiKeySlot;
  latencyMs: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}> {
  const keys = syncConfiguredFlags();
  const plan = buildKeyExecutionPlan({
    keys,
    routeMode,
    primaryCooldownUntilMs: slotTelemetry.primary.cooldownUntilMs,
    backupCooldownUntilMs: slotTelemetry.backup.cooldownUntilMs,
    nowMs: Date.now(),
  });

  if (plan.length === 0) {
    throw new Error('NO_API_KEY');
  }

  let lastError: unknown;
  for (let i = 0; i < plan.length; i++) {
    const slot = plan[i];
    const apiKey = slot === 'primary' ? keys.primaryKey : keys.backupKey;
    if (!apiKey) continue;

    const client = createGeminiClient(apiKey);
    const hasNextSlot = i + 1 < plan.length;
    const startMs = Date.now();

    try {
      const response = await generateContentWithRetry(client, params, hasNextSlot ? 1 : 2);
      const latencyMs = Date.now() - startMs;
      slotTelemetry[slot] = {
        configured: true,
        health: 'ok',
        cooldownUntilMs: 0,
        lastCheckedAt: new Date().toISOString(),
        lastLatencyMs: latencyMs,
      };
      const usage = response.usageMetadata as
        | {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            totalTokenCount?: number;
          }
        | undefined;
      const promptTokens = usage?.promptTokenCount ?? 0;
      const candidatesTokens = usage?.candidatesTokenCount ?? 0;
      const totalTokens = usage?.totalTokenCount ?? promptTokens + candidatesTokens;

      return { response, slotUsed: slot, latencyMs, promptTokens, candidatesTokens, totalTokens };
    } catch (err) {
      lastError = err;
      const latencyMs = Date.now() - startMs;
      const rawMsg = err instanceof Error ? err.message : String(err || '');
      const classified = classifyGeminiError(rawMsg);
      const cooldownMs = getSlotCooldownMs(classified.errorCode);
      const now = Date.now();

      slotTelemetry[slot] = {
        configured: true,
        health: mapErrorToSlotHealth(rawMsg),
        cooldownUntilMs: cooldownMs > 0 ? now + cooldownMs : 0,
        lastErrorCode: classified.errorCode,
        lastCheckedAt: new Date(now).toISOString(),
        lastLatencyMs: latencyMs,
      };

      if (
        (classified.errorCode === 'API_KEY_INVALID' || classified.errorCode === 'PERMISSION_DENIED') &&
        webhookConfig.triggers.onInvalidKey
      ) {
        void triggerAlertEvent(
          `invalid_${slot}`,
          '⚠️ Ошибка ключа Gemini',
          `Слот ${slot} вернул ${classified.errorCode}. Проверьте настройки ключей.`
        );
      } else if (
        classified.errorCode === 'RESOURCE_EXHAUSTED' &&
        webhookConfig.triggers.onQuotaExceeded
      ) {
        void triggerAlertEvent(
          `quota_${slot}`,
          '⚠️ Исчерпана квота Gemini',
          `Слот ${slot} получил 429 RESOURCE_EXHAUSTED.`
        );
      }

      if (hasNextSlot && shouldFailoverToNextSlot(classified.errorCode)) {
        const nextSlot = plan[i + 1];
        lastFallbackInfo = {
          at: new Date(now).toISOString(),
          from: slot,
          to: nextSlot,
          reason: classified.errorCode,
        };
        pushSystemEvent(
          'warning',
          `Автопереход ключа: ${slot} -> ${nextSlot} (${classified.errorCode})`
        );
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error('NO_API_KEY');
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string; emailVerified: boolean } | null> {
  if (!idToken) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        FIREBASE_WEB_API_KEY
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const user = data?.users?.[0];
    if (!user?.localId) return null;
    return {
      uid: user.localId,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function extractBearerUser(
  req: Request
): Promise<{ uid: string; email?: string; emailVerified: boolean; token: string } | null> {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;
  const verified = await verifyFirebaseIdToken(token);
  if (!verified) return null;
  return { ...verified, token };
}

function cleanAndParseJson<T>(rawText: string): T {
  const cleaned = String(rawText || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

function getLanguageInstruction(lang: string): string {
  if (lang === 'kk') return 'Отвечай строго на казахском языке (қазақ тілінде).';
  if (lang === 'en') return 'Respond strictly in English.';
  return 'Отвечай на русском языке.';
}

function getServerMemoryMb(): { rssMb: number; heapUsedMb: number } {
  const mem = process.memoryUsage();
  return {
    rssMb: Math.round((mem.rss / (1024 * 1024)) * 10) / 10,
    heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 10) / 10,
  };
}

async function probeGoogleAuthService(): Promise<ServiceProbeEntry> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  const start = Date.now();
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        FIREBASE_WEB_API_KEY
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'health_probe' }),
        signal: controller.signal,
      }
    );
    const latencyMs = Date.now() - start;
    // 400 INVALID_ID_TOKEN proves Google Auth endpoint responded normally
    const ok = res.ok || res.status === 400;
    return { ok, latencyMs, detail: ok ? 'accounts:lookup' : `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : 'Timeout',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function buildServicesHealthSnapshot(
  state: { config: RtdbAiConfig; rtdbOk: boolean; rtdbLatencyMs: number },
  activeGeminiProbe = false
): Promise<ServicesHealthSnapshot> {
  const googleAuth = await probeGoogleAuthService();
  let gemini: ServiceProbeEntry;

  if (activeGeminiProbe) {
    const start = Date.now();
    try {
      const modelSpec = getAiModelSpec(state.config.aiModelPreset);
      const exec = await executeGeminiWithFallback(state.config.keyRouteMode, {
        model: modelSpec.modelId,
        contents: 'Reply with a single word: OK',
      });
      gemini = {
        ok: Boolean(exec.response.text),
        latencyMs: exec.latencyMs,
        detail: `${exec.slotUsed} · ${modelSpec.modelId}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ERR';
      gemini = {
        ok: false,
        latencyMs: Date.now() - start,
        detail: classifyGeminiError(msg).errorCode,
      };
    }
  } else {
    const keySnap = buildSafeServerKeySnapshot(state.config.keyRouteMode);
    const activeSlot = keySnap.effectiveSlot || 'primary';
    const slotInfo = keySnap.slots[activeSlot];
    gemini = {
      ok: keySnap.anyKeyConfigured && slotInfo.health !== 'invalid' && slotInfo.health !== 'error',
      latencyMs: slotInfo.lastLatencyMs || 0,
      detail: slotInfo.health,
    };
  }

  return {
    checkedAt: new Date().toISOString(),
    rtdb: { ok: state.rtdbOk, latencyMs: state.rtdbLatencyMs, detail: 'RTDB' },
    googleAuth,
    gemini,
  };
}

function toUserTicketSummary(ticket: FeedbackTicket): UserFeedbackTicketSummary {
  return {
    id: ticket.id,
    type: ticket.type,
    text: ticket.text,
    status: ticket.status,
    tags: ticket.tags,
    createdAt: ticket.createdAt,
    resolvedAt: ticket.resolvedAt,
    adminReply: ticket.adminReply,
  };
}

async function runScheduledDailyDigestTick() {
  try {
    if (!webhookConfig.triggers.dailyDigestEnabled || !webhookConfig.url) return;
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    if (webhookConfig.lastAutoDigestDateKey === todayKey) return;

    const state = await getEffectiveControlState();
    const targetHour =
      typeof state.config.dailyDigestHourUtc === 'number'
        ? state.config.dailyDigestHourUtc
        : webhookConfig.dailyDigestHourUtc;

    if (now.getUTCHours() !== targetHour) return;

    webhookConfig.lastAutoDigestDateKey = todayKey;
    const d = buildDailyDigest();
    const errStats = computeErrorBreakdown(telemetryRecords);
    const result = await dispatchWebhookMessage(
      `📊 Автосводка дня (${d.dateKey})`,
      `Активных пользователей: ${d.activeVisitors}\nЗапросов к Gemini: ${d.aiRequests} (ошибок: ${d.aiErrors}, 429: ${errStats.quota429}, timeout/503: ${errStats.timeout503})\nПопаданий в кэш: ${d.cacheHits} (~${d.tokensSavedEstimate} ток. сэкономлено)\nОткрытых тикетов: ${d.openTickets}`
    );
    pushSystemEvent(
      result.ok ? 'info' : 'warning',
      result.ok
        ? `Автосводка за ${d.dateKey} отправлена по расписанию (${targetHour}:00 UTC)`
        : `Автосводка не отправлена: ${result.error || 'ошибка'}`
    );
  } catch {
    // Ignore scheduler errors
  }
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json({ limit: '1mb' }));

  void loadTicketsFromRtdbOnce();
  const digestSchedulerTimer = setInterval(() => {
    void runScheduledDailyDigestTick();
  }, 60_000);
  digestSchedulerTimer.unref?.();

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, uptimeSec: Math.floor((Date.now() - SERVER_STARTED_AT_MS) / 1000) });
  });

  app.get('/api/ai/status', async (req: Request, res: Response) => {
    trackVisitorFromReq(req);
    const [state, bearerUser] = await Promise.all([
      getEffectiveControlState(),
      extractBearerUser(req).catch(() => null),
    ]);
    const isAdmin = checkIsAdminIdentity(bearerUser, state.config);
    res.json({
      ok: true,
      sharedAiEnabled: state.config.sharedAiEnabled,
      guestAiEnabled: state.config.guestAiEnabled,
      readOnlyMode: state.config.readOnlyMode,
      serverKeyConfigured: state.serverKeyConfigured,
      isAdmin,
      keyRouteMode: state.config.keyRouteMode,
      aiModelPreset: state.config.aiModelPreset,
      aiPromptStyle: state.config.aiPromptStyle,
      uiDefaults: state.config.uiDefaults,
      minClientVersion: state.config.minClientVersion,
      serverStartedAtMs: SERVER_STARTED_AT_MS,
      geminiModel: getAiModelSpec(state.config.aiModelPreset).modelId,
      announcement: state.config.announcement,
      sampleTemplate: state.config.sampleTemplate,
      poll: state.config.poll,
    });
  });

  // Public telemetry / feedback / poll endpoints
  app.post('/api/telemetry/feature', (req: Request, res: Response) => {
    trackVisitorFromReq(req);
    const body = req.body as { feature?: unknown } | undefined;
    const key = String(body?.feature || '') as FeatureEventKey;
    if (!ALLOWED_FEATURE_EVENTS.includes(key)) {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'Unknown feature key' });
      return;
    }
    featureCounters[key] = (featureCounters[key] || 0) + 1;
    res.json({ ok: true });
  });

  app.post('/api/telemetry/new-user', async (req: Request, res: Response) => {
    const user = await extractBearerUser(req);
    if (!user) {
      res.status(401).json({ errorCode: 'UNAUTHORIZED' });
      return;
    }
    trackVisitorFromReq(req, user.uid);
    if (!notifiedNewUserUids.has(user.uid)) {
      notifiedNewUserUids.add(user.uid);
      pushSystemEvent('info', `Новая регистрация: ${user.email || user.uid.slice(0, 8)}`);
      if (webhookConfig.triggers.onNewUser) {
        void triggerAlertEvent(
          `new_user_${user.uid}`,
          '👤 Новый пользователь',
          `Зарегистрирован аккаунт: ${user.email || user.uid.slice(0, 10)}`,
          5000
        );
      }
    }
    res.json({ ok: true });
  });

  app.post('/api/feedback', async (req: Request, res: Response) => {
    trackVisitorFromReq(req);
    await loadTicketsFromRtdbOnce();
    const user = await extractBearerUser(req).catch(() => null);
    const body = req.body as {
      type?: unknown;
      text?: unknown;
      lang?: unknown;
      authorLabel?: unknown;
      appVersion?: unknown;
    } | undefined;

    const text = String(body?.text || '').trim().slice(0, 800);
    if (text.length < 3) {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'Feedback text too short' });
      return;
    }
    const ticketType: 'bug' | 'idea' = body?.type === 'idea' ? 'idea' : 'bug';
    const ticket: FeedbackTicket = {
      id: `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: ticketType,
      text,
      authorLabel:
        String(body?.authorLabel || (user ? user.email || 'Пользователь' : 'Гость'))
          .trim()
          .slice(0, 60) || 'Гость',
      ...(user?.uid ? { authorUid: user.uid } : {}),
      isGuest: !user,
      lang: String(body?.lang || 'ru').slice(0, 8),
      appVersion: String(body?.appVersion || APP_VERSION).slice(0, 20),
      status: 'open',
      tags: [],
      createdAt: new Date().toISOString(),
    };
    ticketsStore.unshift(ticket);
    if (ticketsStore.length > 100) {
      ticketsStore.length = 100;
    }
    if (user?.token) {
      void persistTicketsToRtdb(user.token).catch(() => {});
    }
    pushSystemEvent(
      'info',
      `Новое обращение (${ticket.type === 'bug' ? 'Проблема' : 'Идея'}) от ${ticket.authorLabel}`
    );
    if (webhookConfig.triggers.onNewTicket) {
      void triggerAlertEvent(
        `ticket_${ticket.id}`,
        `📩 Новый тикет (${ticket.type === 'bug' ? 'Баг' : 'Идея'})`,
        `От: ${ticket.authorLabel} (${ticket.lang}, v${ticket.appVersion})\n${ticket.text}`,
        3000
      );
    }
    res.json({ ok: true, ticketId: ticket.id, ticket: toUserTicketSummary(ticket) });
  });

  app.get('/api/feedback/my', async (req: Request, res: Response) => {
    await loadTicketsFromRtdbOnce();
    const user = await extractBearerUser(req).catch(() => null);
    const idsParam = String(req.query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);

    const matched: FeedbackTicket[] = ticketsStore.filter((tk) => {
      if (user?.uid && tk.authorUid === user.uid) return true;
      if (idsParam.includes(tk.id) && tk.isGuest) return true;
      return false;
    });

    res.json({
      ok: true,
      tickets: matched.map(toUserTicketSummary),
    });
  });

  app.post('/api/poll/vote', async (req: Request, res: Response) => {
    trackVisitorFromReq(req);
    const state = await getEffectiveControlState();
    const poll = state.config.poll;
    if (!poll.enabled || poll.options.length < 2) {
      res.status(400).json({ errorCode: 'POLL_INACTIVE', error: 'No active poll' });
      return;
    }

    const body = req.body as { pollId?: unknown; optionId?: unknown; voterKey?: unknown } | undefined;
    const pollId = String(body?.pollId || '').trim();
    const optionId = String(body?.optionId || '').trim();
    const voterRaw = String(body?.voterKey || req.ip || 'anon').trim();

    if (pollId !== poll.id) {
      res.status(400).json({ errorCode: 'POLL_MISMATCH', error: 'Poll ID mismatch' });
      return;
    }
    const targetOption = poll.options.find((o) => o.id === optionId);
    if (!targetOption) {
      res.status(400).json({ errorCode: 'OPTION_NOT_FOUND', error: 'Invalid poll option' });
      return;
    }

    let voters = pollVotersMap.get(poll.id);
    if (!voters) {
      voters = new Set<string>();
      pollVotersMap.set(poll.id, voters);
    }
    const voterHash = crypto.createHash('sha256').update(`${poll.id}:${voterRaw}`).digest('hex');
    if (voters.has(voterHash)) {
      res.json({ ok: true, alreadyVoted: true, poll });
      return;
    }
    voters.add(voterHash);

    const updatedPoll: FeaturePoll = {
      ...poll,
      options: poll.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      ),
      updatedAt: new Date().toISOString(),
    };
    const nextConfig: RtdbAiConfig = { ...state.config, poll: updatedPoll };
    commitMemoryOverride(nextConfig, false);
    res.json({ ok: true, alreadyVoted: false, poll: updatedPoll });
  });

  async function requireVerifiedAdmin(req: Request, res: Response): Promise<{ uid: string; token: string } | null> {
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ errorCode: 'UNAUTHORIZED', error: 'Missing auth token' });
      return null;
    }
    const [verified, state] = await Promise.all([
      verifyFirebaseIdToken(token),
      getEffectiveControlState(),
    ]);
    if (!verified || !checkIsAdminIdentity(verified, state.config)) {
      res.status(403).json({ errorCode: 'FORBIDDEN', error: 'Admin access required' });
      return null;
    }
    return { uid: verified.uid, token };
  }

  app.get('/api/admin/overview', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    await loadTicketsFromRtdbOnce();
    const state = await getEffectiveControlState(true);
    const endpointStats = computeEndpointStats(telemetryRecords);
    const nonCacheRecords = telemetryRecords.filter((r) => !r.cacheHit);
    const avgLatencyMs =
      nonCacheRecords.length > 0
        ? Math.round(nonCacheRecords.reduce((s, r) => s + r.latencyMs, 0) / nonCacheRecords.length)
        : 0;
    const totalTokens = telemetryRecords.reduce((s, r) => s + r.totalTokens, 0);
    const servicesHealth = await buildServicesHealthSnapshot(state, false);

    res.json({
      ok: true,
      appVersion: APP_VERSION,
      minClientVersion: state.config.minClientVersion,
      serverStartedAtMs: SERVER_STARTED_AT_MS,
      serverNowMs: Date.now(),
      geminiModel: getAiModelSpec(state.config.aiModelPreset).modelId,
      rtdbStatus: {
        connected: state.rtdbOk,
        latencyMs: state.rtdbLatencyMs,
      },
      servicesHealth,
      memoryUsage: getServerMemoryMb(),
      cacheStats: {
        advisorCacheCount: advisorCache.size,
        dossierCacheCount: dossierCache.size,
      },
      flags: {
        sharedAiEnabled: state.config.sharedAiEnabled,
        guestAiEnabled: state.config.guestAiEnabled,
        readOnlyMode: state.config.readOnlyMode,
        keyRouteMode: state.config.keyRouteMode,
        aiModelPreset: state.config.aiModelPreset,
      },
      aiPromptStyle: state.config.aiPromptStyle,
      uiDefaults: state.config.uiDefaults,
      keyStatus: buildSafeServerKeySnapshot(state.config.keyRouteMode),
      telemetry: {
        totalRequests: telemetryRecords.length,
        avgLatencyMs,
        totalTokens,
        advisorCacheHits,
        dossierCacheHits,
        dossierRebuildCount,
        tokensSavedEstimate,
        endpointStats,
        errorBreakdown: computeErrorBreakdown(telemetryRecords),
        activityHeatmap: {
          hours: [...activityHeatmap.hours],
          weekdays: [...activityHeatmap.weekdays],
          totalCount: activityHeatmap.weekdays.reduce((acc, n) => acc + n, 0),
        },
        recentRequests: telemetryRecords.slice(0, 20),
        featureCounters: { ...featureCounters },
        dailyDigest: buildDailyDigest(),
      },
      announcement: state.config.announcement,
      sampleTemplate: state.config.sampleTemplate,
      poll: state.config.poll,
      extraAdminUids: state.config.extraAdminUids,
      extraAdminEmails: state.config.extraAdminEmails,
      tickets: ticketsStore,
      webhook: getSafeWebhookStatus(state.config.dailyDigestHourUtc),
      events: systemEventsLog.slice(0, 25),
    });
  });

  app.get('/api/admin/health-probe', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    const state = await getEffectiveControlState(true);
    const servicesHealth = await buildServicesHealthSnapshot(state, true);
    pushSystemEvent(
      servicesHealth.rtdb.ok && servicesHealth.googleAuth.ok && servicesHealth.gemini.ok
        ? 'info'
        : 'warning',
      `Проверка сервисов: RTDB ${servicesHealth.rtdb.latencyMs}мс, Auth ${servicesHealth.googleAuth.latencyMs}мс, Gemini ${servicesHealth.gemini.latencyMs}мс`
    );
    res.json({
      ok: true,
      servicesHealth,
      memoryUsage: getServerMemoryMb(),
      cacheStats: {
        advisorCacheCount: advisorCache.size,
        dossierCacheCount: dossierCache.size,
      },
    });
  });

  app.post('/api/admin/cache/clear', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    const prevAdvisor = advisorCache.size;
    const prevDossier = dossierCache.size;
    advisorCache.clear();
    dossierCache.clear();
    pushSystemEvent(
      'info',
      `AI-кэш очищен вручную (Советник: ${prevAdvisor}, Досье: ${prevDossier})`
    );
    res.json({
      ok: true,
      clearedAdvisor: prevAdvisor,
      clearedDossier: prevDossier,
      cacheStats: {
        advisorCacheCount: advisorCache.size,
        dossierCacheCount: dossierCache.size,
      },
    });
  });

  app.post('/api/admin/access', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const body = req.body as {
      extraAdminUids?: unknown;
      extraAdminEmails?: unknown;
    } | undefined;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ errorCode: 'BAD_REQUEST' });
      return;
    }

    const extraAdminUids = parseAdminList(body.extraAdminUids).filter(
      (v) => !v.includes('@') && v.length >= 6 && v.length <= 128
    );
    const extraAdminEmails = parseAdminList(body.extraAdminEmails)
      .filter((v) => v.includes('@') && v.length <= 120)
      .map((v) => v.toLowerCase());

    const state = await getEffectiveControlState();
    const nextConfig: RtdbAiConfig = {
      ...state.config,
      extraAdminUids,
      extraAdminEmails,
    };
    const nowIso = new Date().toISOString();
    const rtdbSynced = await patchRtdbConfig(admin.token, {
      extraAdminUids,
      extraAdminEmails,
      updatedAt: nowIso,
      updatedBy: admin.uid,
    });
    commitMemoryOverride(nextConfig, rtdbSynced);
    pushSystemEvent(
      'info',
      `Обновлён список доступа к админке (UID: ${extraAdminUids.length}, Email: ${extraAdminEmails.length})`
    );
    res.json({ ok: true, extraAdminUids, extraAdminEmails, rtdbSynced });
  });

  app.post('/api/admin/flags', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const body = req.body as {
      sharedAiEnabled?: unknown;
      guestAiEnabled?: unknown;
      readOnlyMode?: unknown;
      aiModelPreset?: unknown;
      aiPromptStyle?: unknown;
      minClientVersion?: unknown;
    } | undefined;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ errorCode: 'BAD_REQUEST' });
      return;
    }

    const state = await getEffectiveControlState();
    const hasModelPatch =
      body.aiModelPreset === 'fast' ||
      body.aiModelPreset === 'balanced' ||
      body.aiModelPreset === 'accurate';
    const nextPreset: AiModelPreset = hasModelPatch
      ? resolveAiModelPreset(body.aiModelPreset)
      : state.config.aiModelPreset;
    const modelChanged = nextPreset !== state.config.aiModelPreset;

    const nextPromptStyle =
      body.aiPromptStyle && typeof body.aiPromptStyle === 'object'
        ? sanitizeAiPromptStyle(body.aiPromptStyle)
        : state.config.aiPromptStyle;
    const promptStyleChanged =
      nextPromptStyle.advisorVerbosity !== state.config.aiPromptStyle.advisorVerbosity ||
      nextPromptStyle.factGranularity !== state.config.aiPromptStyle.factGranularity;

    const nextMinVersion =
      typeof body.minClientVersion === 'string' && body.minClientVersion.trim()
        ? sanitizeVersionString(body.minClientVersion, state.config.minClientVersion)
        : state.config.minClientVersion;

    const nextConfig: RtdbAiConfig = {
      ...state.config,
      sharedAiEnabled:
        typeof body.sharedAiEnabled === 'boolean'
          ? body.sharedAiEnabled
          : state.config.sharedAiEnabled,
      guestAiEnabled:
        typeof body.guestAiEnabled === 'boolean'
          ? body.guestAiEnabled
          : state.config.guestAiEnabled,
      readOnlyMode:
        typeof body.readOnlyMode === 'boolean'
          ? body.readOnlyMode
          : state.config.readOnlyMode,
      aiModelPreset: nextPreset,
      aiPromptStyle: nextPromptStyle,
      minClientVersion: nextMinVersion,
    };

    if (modelChanged || promptStyleChanged) {
      advisorCache.clear();
      dossierCache.clear();
    }

    const nowIso = new Date().toISOString();
    const rtdbSynced = await patchRtdbConfig(admin.token, {
      sharedAiEnabled: nextConfig.sharedAiEnabled,
      guestAiEnabled: nextConfig.guestAiEnabled,
      readOnlyMode: nextConfig.readOnlyMode,
      aiModelPreset: nextConfig.aiModelPreset,
      aiPromptStyle: nextConfig.aiPromptStyle,
      minClientVersion: nextConfig.minClientVersion,
      updatedAt: nowIso,
      updatedBy: admin.uid,
    });
    commitMemoryOverride(nextConfig, rtdbSynced);
    const activeModelSpec = getAiModelSpec(nextConfig.aiModelPreset);
    pushSystemEvent(
      'info',
      modelChanged
        ? `Модель Gemini переключена: ${activeModelSpec.preset} (${activeModelSpec.modelId})`
        : promptStyleChanged
        ? `Стиль Gemini обновлён: ${nextPromptStyle.advisorVerbosity} / ${nextPromptStyle.factGranularity}`
        : nextMinVersion !== state.config.minClientVersion
        ? `Минимальная версия PWA обновлена: v${nextMinVersion}`
        : `Флаги обновлены: AI=${nextConfig.sharedAiEnabled ? 'on' : 'off'}, Гости=${
            nextConfig.guestAiEnabled ? 'on' : 'off'
          }, ReadOnly=${nextConfig.readOnlyMode ? 'on' : 'off'}`
    );

    res.json({
      ok: true,
      geminiModel: activeModelSpec.modelId,
      flags: {
        sharedAiEnabled: nextConfig.sharedAiEnabled,
        guestAiEnabled: nextConfig.guestAiEnabled,
        readOnlyMode: nextConfig.readOnlyMode,
        aiModelPreset: nextConfig.aiModelPreset,
      },
      aiPromptStyle: nextConfig.aiPromptStyle,
      minClientVersion: nextConfig.minClientVersion,
      rtdbSynced,
    });
  });

  app.post('/api/admin/ui-defaults', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const state = await getEffectiveControlState();
    const reset = Boolean((req.body as { reset?: unknown } | undefined)?.reset);
    const uiDefaults = reset
      ? createDefaultUiDefaults()
      : sanitizeUiDefaults(req.body);
    const nextConfig: RtdbAiConfig = { ...state.config, uiDefaults };
    const rtdbSynced = await patchRtdbConfig(admin.token, {
      uiDefaults,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.uid,
    });
    commitMemoryOverride(nextConfig, rtdbSynced);
    pushSystemEvent(
      'info',
      `Обновлены дефолтные группы (${uiDefaults.defaultGroups.length}), разделы (${uiDefaults.defaultSections.length}) и подсказки (${uiDefaults.quickAdvisorPrompts.length})`
    );
    res.json({ ok: true, uiDefaults, rtdbSynced });
  });

  app.post('/api/admin/announcement', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const state = await getEffectiveControlState();
    const announcement = sanitizeAnnouncement({
      ...(req.body as object),
      updatedAt: new Date().toISOString(),
    });
    const nextConfig: RtdbAiConfig = { ...state.config, announcement };
    const rtdbSynced = await patchRtdbConfig(admin.token, {
      announcement,
      updatedAt: announcement.updatedAt,
      updatedBy: admin.uid,
    });
    commitMemoryOverride(nextConfig, rtdbSynced);
    pushSystemEvent(
      'info',
      announcement.enabled
        ? `Опубликован баннер (${announcement.tone}): ${announcement.text}`
        : 'Глобальный баннер скрыт'
    );
    res.json({ ok: true, announcement, rtdbSynced });
  });

  app.post('/api/admin/sample-template', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const state = await getEffectiveControlState();
    const resetToDefault = Boolean((req.body as { reset?: unknown } | undefined)?.reset);
    const sampleTemplate = resetToDefault
      ? createDefaultSampleTemplate()
      : sanitizeSampleTemplate(req.body);
    const nextConfig: RtdbAiConfig = { ...state.config, sampleTemplate };
    const rtdbSynced = await patchRtdbConfig(admin.token, {
      sampleTemplate,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.uid,
    });
    commitMemoryOverride(nextConfig, rtdbSynced);
    pushSystemEvent('info', `Обновлён стартовый пример контакта («${sampleTemplate.name}»)`);
    res.json({ ok: true, sampleTemplate, rtdbSynced });
  });

  app.post('/api/admin/poll', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const state = await getEffectiveControlState();
    const body = req.body as {
      enabled?: unknown;
      question?: unknown;
      options?: unknown;
      resetVotes?: unknown;
    } | undefined;
    const resetVotes = Boolean(body?.resetVotes);
    const nextId = resetVotes
      ? `poll_${Date.now().toString(36)}`
      : state.config.poll.id || `poll_${Date.now().toString(36)}`;

    const sanitized = sanitizePoll({
      id: nextId,
      enabled: body?.enabled,
      question: body?.question,
      options: body?.options,
      updatedAt: new Date().toISOString(),
    });

    if (resetVotes) {
      sanitized.options = sanitized.options.map((o) => ({ ...o, votes: 0 }));
      pollVotersMap.delete(nextId);
    }

    const nextConfig: RtdbAiConfig = { ...state.config, poll: sanitized };
    const rtdbSynced = await patchRtdbConfig(admin.token, {
      poll: sanitized,
      updatedAt: sanitized.updatedAt,
      updatedBy: admin.uid,
    });
    commitMemoryOverride(nextConfig, rtdbSynced);
    pushSystemEvent('info', `Мини-опрос обновлён (${sanitized.enabled ? 'активен' : 'скрыт'})`);
    res.json({ ok: true, poll: sanitized, rtdbSynced });
  });

  app.post('/api/admin/tickets/update', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    await loadTicketsFromRtdbOnce();

    const body = req.body as {
      id?: unknown;
      action?: unknown;
      reply?: unknown;
      tags?: unknown;
      publishToBanner?: unknown;
    } | undefined;
    const id = String(body?.id || '').trim();
    const action = String(body?.action || '').trim();
    const idx = ticketsStore.findIndex((t) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ errorCode: 'NOT_FOUND', error: 'Ticket not found' });
      return;
    }

    if (action === 'delete') {
      ticketsStore.splice(idx, 1);
      await persistTicketsToRtdb(admin.token);
      res.json({ ok: true, tickets: ticketsStore });
      return;
    }

    const reply = String(body?.reply || '').trim().slice(0, 240);
    const existing = ticketsStore[idx];
    const nextTags =
      body?.tags !== undefined ? sanitizeTicketTags(body.tags) : existing.tags || [];
    const nextStatus: 'open' | 'resolved' =
      action === 'update'
        ? existing.status
        : action === 'reopen'
        ? 'open'
        : 'resolved';
    ticketsStore[idx] = {
      ...existing,
      status: nextStatus,
      tags: nextTags,
      resolvedAt: nextStatus === 'resolved' ? new Date().toISOString() : undefined,
      adminReply: reply || existing.adminReply,
    };
    await persistTicketsToRtdb(admin.token);

    let publishedAnnouncement: GlobalAnnouncement | undefined;
    if (body?.publishToBanner && reply) {
      const state = await getEffectiveControlState();
      publishedAnnouncement = sanitizeAnnouncement({
        enabled: true,
        text: reply,
        tone: 'info',
        updatedAt: new Date().toISOString(),
      });
      const nextConfig: RtdbAiConfig = { ...state.config, announcement: publishedAnnouncement };
      const rtdbSynced = await patchRtdbConfig(admin.token, {
        announcement: publishedAnnouncement,
        updatedAt: publishedAnnouncement.updatedAt,
        updatedBy: admin.uid,
      });
      commitMemoryOverride(nextConfig, rtdbSynced);
    }

    res.json({ ok: true, tickets: ticketsStore, announcement: publishedAnnouncement });
  });

  app.post('/api/admin/webhook', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const body = req.body as {
      webhookUrl?: unknown;
      clearUrl?: unknown;
      triggers?: Partial<AlertWebhookTriggers>;
      dailyDigestHourUtc?: unknown;
    } | undefined;

    if (body?.clearUrl) {
      webhookConfig.url = '';
      webhookConfig.lastError = undefined;
    } else if (typeof body?.webhookUrl === 'string' && body.webhookUrl.trim()) {
      const check = validateSafeWebhookUrl(body.webhookUrl);
      if (!check.valid || !check.normalizedUrl) {
        res.status(400).json({
          errorCode: check.error || 'INVALID_WEBHOOK_URL',
          error: 'Only valid external HTTPS webhook URLs are allowed',
        });
        return;
      }
      webhookConfig.url = check.normalizedUrl;
      webhookConfig.lastError = undefined;
    }

    if (body?.triggers && typeof body.triggers === 'object') {
      webhookConfig.triggers = {
        onInvalidKey: Boolean(body.triggers.onInvalidKey),
        onQuotaExceeded: Boolean(body.triggers.onQuotaExceeded),
        onTrafficSpike: Boolean(body.triggers.onTrafficSpike),
        onNewUser: Boolean(body.triggers.onNewUser),
        onNewTicket: Boolean(body.triggers.onNewTicket),
        dailyDigestEnabled: Boolean(body.triggers.dailyDigestEnabled),
      };
    }

    const state = await getEffectiveControlState();
    let nextHour = state.config.dailyDigestHourUtc;
    if (typeof body?.dailyDigestHourUtc === 'number' && Number.isFinite(body.dailyDigestHourUtc)) {
      nextHour = Math.max(0, Math.min(23, Math.floor(body.dailyDigestHourUtc)));
      webhookConfig.dailyDigestHourUtc = nextHour;
      const nextConfig: RtdbAiConfig = { ...state.config, dailyDigestHourUtc: nextHour };
      const rtdbSynced = await patchRtdbConfig(admin.token, {
        dailyDigestHourUtc: nextHour,
        updatedAt: new Date().toISOString(),
        updatedBy: admin.uid,
      });
      commitMemoryOverride(nextConfig, rtdbSynced);
    }

    pushSystemEvent('info', 'Настройки webhook-оповещений обновлены');
    res.json({ ok: true, webhook: getSafeWebhookStatus(nextHour) });
  });

  app.post('/api/admin/webhook/test', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const state = await getEffectiveControlState();
    const kind = (req.body as { kind?: unknown } | undefined)?.kind;
    if (kind === 'digest') {
      const d = buildDailyDigest();
      const errStats = computeErrorBreakdown(telemetryRecords);
      const result = await dispatchWebhookMessage(
        `📊 Ежедневная мини-сводка (${d.dateKey})`,
        `Активных пользователей: ${d.activeVisitors}\nЗапросов к Gemini: ${d.aiRequests} (ошибок: ${d.aiErrors}, 429: ${errStats.quota429}, timeout/503: ${errStats.timeout503})\nПопаданий в кэш: ${d.cacheHits} (~${d.tokensSavedEstimate} ток. сэкономлено)\nОткрытых тикетов: ${d.openTickets}`
      );
      res.status(result.ok ? 200 : 400).json({
        ok: result.ok,
        error: result.error,
        webhook: getSafeWebhookStatus(state.config.dailyDigestHourUtc),
      });
      return;
    }

    const result = await dispatchWebhookMessage(
      '✅ Тестовый алерт Умный блокнот',
      `Канал оповещений работает (версия v${APP_VERSION}).`
    );
    res.status(result.ok ? 200 : 400).json({
      ok: result.ok,
      error: result.error,
      webhook: getSafeWebhookStatus(state.config.dailyDigestHourUtc),
    });
  });

  app.get('/api/admin/export', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    await loadTicketsFromRtdbOnce();

    const format = String(req.query.format || 'json').toLowerCase() === 'csv' ? 'csv' : 'json';
    const dateSlug = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const csv = buildAdminExportCsv({
        requests: telemetryRecords,
        tickets: ticketsStore,
        events: systemEventsLog,
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="notebook-telemetry-${dateSlug}.csv"`
      );
      res.send(csv);
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      errorBreakdown: computeErrorBreakdown(telemetryRecords),
      activityHeatmap,
      dailyDigest: buildDailyDigest(),
      requests: telemetryRecords,
      tickets: ticketsStore,
      events: systemEventsLog,
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="notebook-telemetry-${dateSlug}.json"`
    );
    res.send(JSON.stringify(payload, null, 2));
  });

  app.get('/api/admin/config-export', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    await loadTicketsFromRtdbOnce();
    const state = await getEffectiveControlState(true);

    const bundle = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      appConfig: {
        sharedAiEnabled: state.config.sharedAiEnabled,
        guestAiEnabled: state.config.guestAiEnabled,
        readOnlyMode: state.config.readOnlyMode,
        keyRouteMode: state.config.keyRouteMode,
        aiModelPreset: state.config.aiModelPreset,
        aiPromptStyle: state.config.aiPromptStyle,
        uiDefaults: state.config.uiDefaults,
        minClientVersion: state.config.minClientVersion,
        dailyDigestHourUtc: state.config.dailyDigestHourUtc,
        extraAdminUids: state.config.extraAdminUids,
        extraAdminEmails: state.config.extraAdminEmails,
        announcement: state.config.announcement,
        sampleTemplate: state.config.sampleTemplate,
        poll: state.config.poll,
      },
      tickets: ticketsStore,
      webhookTriggers: webhookConfig.triggers,
    };

    res.json({ ok: true, bundle });
  });

  app.post('/api/admin/config-import', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    await loadTicketsFromRtdbOnce();

    const body = req.body as {
      bundle?: {
        appConfig?: Record<string, unknown>;
        tickets?: unknown;
        webhookTriggers?: Partial<AlertWebhookTriggers>;
      };
    } | undefined;
    const rawAppConfig = body?.bundle?.appConfig;
    if (!rawAppConfig || typeof rawAppConfig !== 'object') {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'Invalid backup bundle' });
      return;
    }

    const state = await getEffectiveControlState();
    const nowIso = new Date().toISOString();

    const extraAdminUids = parseAdminList(rawAppConfig.extraAdminUids).filter(
      (v) => !v.includes('@') && v.length >= 6 && v.length <= 128
    );
    const extraAdminEmails = parseAdminList(rawAppConfig.extraAdminEmails)
      .filter((v) => v.includes('@') && v.length <= 120)
      .map((v) => v.toLowerCase());

    const nextHour =
      typeof rawAppConfig.dailyDigestHourUtc === 'number' &&
      Number.isFinite(rawAppConfig.dailyDigestHourUtc)
        ? Math.max(0, Math.min(23, Math.floor(rawAppConfig.dailyDigestHourUtc)))
        : state.config.dailyDigestHourUtc;

    const nextConfig: RtdbAiConfig = {
      sharedAiEnabled:
        typeof rawAppConfig.sharedAiEnabled === 'boolean'
          ? rawAppConfig.sharedAiEnabled
          : state.config.sharedAiEnabled,
      guestAiEnabled:
        typeof rawAppConfig.guestAiEnabled === 'boolean'
          ? rawAppConfig.guestAiEnabled
          : state.config.guestAiEnabled,
      readOnlyMode:
        typeof rawAppConfig.readOnlyMode === 'boolean'
          ? rawAppConfig.readOnlyMode
          : state.config.readOnlyMode,
      keyRouteMode: resolveAiKeyRouteMode(rawAppConfig.keyRouteMode),
      aiModelPreset: resolveAiModelPreset(rawAppConfig.aiModelPreset),
      aiPromptStyle: sanitizeAiPromptStyle(rawAppConfig.aiPromptStyle),
      uiDefaults: sanitizeUiDefaults(rawAppConfig.uiDefaults),
      minClientVersion: sanitizeVersionString(
        rawAppConfig.minClientVersion,
        state.config.minClientVersion
      ),
      dailyDigestHourUtc: nextHour,
      extraAdminUids,
      extraAdminEmails,
      announcement: sanitizeAnnouncement(rawAppConfig.announcement),
      sampleTemplate: sanitizeSampleTemplate(rawAppConfig.sampleTemplate),
      poll: sanitizePoll(rawAppConfig.poll),
    };

    webhookConfig.dailyDigestHourUtc = nextHour;
    if (body?.bundle?.webhookTriggers && typeof body.bundle.webhookTriggers === 'object') {
      webhookConfig.triggers = {
        onInvalidKey: Boolean(body.bundle.webhookTriggers.onInvalidKey),
        onQuotaExceeded: Boolean(body.bundle.webhookTriggers.onQuotaExceeded),
        onTrafficSpike: Boolean(body.bundle.webhookTriggers.onTrafficSpike),
        onNewUser: Boolean(body.bundle.webhookTriggers.onNewUser),
        onNewTicket: Boolean(body.bundle.webhookTriggers.onNewTicket),
        dailyDigestEnabled: Boolean(body.bundle.webhookTriggers.dailyDigestEnabled),
      };
    }

    if (Array.isArray(body?.bundle?.tickets)) {
      const sanitizedTickets: FeedbackTicket[] = body.bundle.tickets
        .slice(0, 60)
        .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object'))
        .map((t) => ({
          id: String(t.id || `tkt_${Date.now().toString(36)}`).slice(0, 60),
          type: (t.type === 'bug' ? 'bug' : 'idea') as 'bug' | 'idea',
          text: String(t.text || '').trim().slice(0, 500),
          status: (t.status === 'resolved' ? 'resolved' : 'open') as 'open' | 'resolved',
          tags: sanitizeTicketTags(t.tags),
          lang: String(t.lang || 'ru').slice(0, 8),
          authorLabel: String(t.authorLabel || 'Гость').slice(0, 48),
          isGuest: Boolean(t.isGuest),
          ...(typeof t.authorUid === 'string' && t.authorUid.trim()
            ? { authorUid: t.authorUid.trim().slice(0, 128) }
            : {}),
          appVersion: String(t.appVersion || APP_VERSION).slice(0, 24),
          createdAt: String(t.createdAt || nowIso),
          ...(typeof t.resolvedAt === 'string' ? { resolvedAt: t.resolvedAt } : {}),
          ...(typeof t.adminReply === 'string' ? { adminReply: t.adminReply.slice(0, 240) } : {}),
        }))
        .filter((t) => Boolean(t.text));
      ticketsStore = sanitizedTickets;
      await persistTicketsToRtdb(admin.token);
    }

    advisorCache.clear();
    dossierCache.clear();

    const rtdbSynced = await patchRtdbConfig(admin.token, {
      ...nextConfig,
      updatedAt: nowIso,
      updatedBy: admin.uid,
    });
    commitMemoryOverride(nextConfig, rtdbSynced);
    pushSystemEvent('info', 'Конфигурация админки восстановлена из JSON-бэкапа');
    res.json({ ok: true, rtdbSynced });
  });

  app.post('/api/ai/admin/toggle', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const body = req.body as { sharedAiEnabled?: unknown } | undefined;
    if (!body || typeof body.sharedAiEnabled !== 'boolean') {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'sharedAiEnabled boolean required' });
      return;
    }

    const state = await getEffectiveControlState();
    const nowIso = new Date().toISOString();
    const rtdbSynced = await patchRtdbConfig(admin.token, {
      sharedAiEnabled: body.sharedAiEnabled,
      updatedAt: nowIso,
      updatedBy: admin.uid,
    });
    commitMemoryOverride(
      { ...state.config, sharedAiEnabled: body.sharedAiEnabled },
      rtdbSynced
    );

    res.json({
      ok: true,
      sharedAiEnabled: body.sharedAiEnabled,
      rtdbSynced,
      updatedAt: nowIso,
    });
  });

  app.get('/api/ai/admin/keys', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;
    const state = await getEffectiveControlState();
    res.json({
      ok: true,
      ...buildSafeServerKeySnapshot(state.config.keyRouteMode),
    });
  });

  app.post('/api/ai/admin/key-route', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const body = req.body as { routeMode?: unknown } | undefined;
    if (
      !body ||
      (body.routeMode !== 'auto' && body.routeMode !== 'primary' && body.routeMode !== 'backup')
    ) {
      res.status(400).json({
        errorCode: 'BAD_REQUEST',
        error: 'routeMode must be auto, primary, or backup',
      });
      return;
    }

    const nextMode = body.routeMode;
    const keys = syncConfiguredFlags();
    const state = await getEffectiveControlState();
    const nowIso = new Date().toISOString();

    slotTelemetry.primary.cooldownUntilMs = 0;
    slotTelemetry.backup.cooldownUntilMs = 0;

    const rtdbSynced = await patchRtdbConfig(admin.token, {
      keyRouteMode: nextMode,
      updatedAt: nowIso,
      updatedBy: admin.uid,
    });
    commitMemoryOverride({ ...state.config, keyRouteMode: nextMode }, rtdbSynced);
    pushSystemEvent('info', `Режим ключей переключён: ${nextMode}`);

    res.json({
      ok: true,
      serverKeyConfigured: isRouteConfigured(keys, nextMode),
      rtdbSynced,
      status: buildSafeServerKeySnapshot(nextMode),
    });
  });

  app.post('/api/ai/admin/check-keys', async (req: Request, res: Response) => {
    const admin = await requireVerifiedAdmin(req, res);
    if (!admin) return;

    const keys = syncConfiguredFlags();
    const state = await getEffectiveControlState();

    const probeSlot = async (slot: AiKeySlot, apiKey: string) => {
      if (!apiKey) {
        slotTelemetry[slot] = {
          configured: false,
          health: 'unconfigured',
          cooldownUntilMs: 0,
        };
        return;
      }
      const checkedAt = new Date().toISOString();
      const start = Date.now();
      const probeModelSpec = getAiModelSpec(state.config.aiModelPreset);
      let pingTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        const client = createGeminiClient(apiKey);
        const probeRes = await Promise.race([
          client.models.generateContent({
            model: probeModelSpec.modelId,
            contents: 'Reply with a single word: OK',
          }),
          new Promise<never>((_, reject) => {
            pingTimer = setTimeout(() => reject(new Error('PING_TIMEOUT')), 10_000);
          }),
        ]);
        const latencyMs = Date.now() - start;
        if (!probeRes.text) {
          slotTelemetry[slot] = {
            configured: true,
            health: 'error',
            cooldownUntilMs: 0,
            lastErrorCode: 'EMPTY_AI_RESPONSE',
            lastCheckedAt: checkedAt,
            lastLatencyMs: latencyMs,
          };
          return;
        }
        slotTelemetry[slot] = {
          configured: true,
          health: 'ok',
          cooldownUntilMs: 0,
          lastCheckedAt: checkedAt,
          lastLatencyMs: latencyMs,
        };
      } catch (err) {
        const latencyMs = Date.now() - start;
        const rawMsg = err instanceof Error ? err.message : String(err || '');
        const classified = classifyGeminiError(rawMsg);
        const cooldownMs = getSlotCooldownMs(classified.errorCode);
        slotTelemetry[slot] = {
          configured: true,
          health: mapErrorToSlotHealth(rawMsg),
          cooldownUntilMs: cooldownMs > 0 ? Date.now() + cooldownMs : 0,
          lastErrorCode: classified.errorCode,
          lastCheckedAt: checkedAt,
          lastLatencyMs: latencyMs,
        };
      } finally {
        if (pingTimer) clearTimeout(pingTimer);
      }
    };

    await Promise.all([
      probeSlot('primary', keys.primaryKey),
      probeSlot('backup', keys.backupKey),
    ]);

    pushSystemEvent(
      'info',
      `Test Ping Gemini: primary=${slotTelemetry.primary.health}, backup=${slotTelemetry.backup.health}`
    );

    res.json({
      ok: true,
      serverKeyConfigured: isRouteConfigured(keys, state.config.keyRouteMode),
      status: buildSafeServerKeySnapshot(state.config.keyRouteMode),
    });
  });

  async function enforceAiAccessAndTrack(req: Request, res: Response): Promise<RtdbAiConfig | null> {
    const state = await getEffectiveControlState();
    const cfg = state.config;

    if (!cfg.sharedAiEnabled) {
      res.status(503).json({
        errorCode: 'AI_DISABLED_BY_ADMIN',
        error: 'Cloud AI is currently disabled by the administrator.',
      });
      return null;
    }

    const user = await extractBearerUser(req);
    trackVisitorFromReq(req, user?.uid);

    if (!cfg.guestAiEnabled && !user) {
      res.status(403).json({
        errorCode: 'GUEST_AI_DISABLED',
        error: 'Cloud AI requires signing in because guest AI access is restricted.',
      });
      return null;
    }

    if (!state.serverKeyConfigured) {
      res.status(503).json({
        errorCode: 'NO_API_KEY',
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return null;
    }

    const now = Date.now();
    recordActivitySlot(activityHeatmap, new Date(now));
    aiRequestTimestamps.push(now);
    while (aiRequestTimestamps.length > 0 && now - aiRequestTimestamps[0] > 60_000) {
      aiRequestTimestamps.shift();
    }
    if (webhookConfig.triggers.onTrafficSpike && isTrafficSpike(aiRequestTimestamps, now)) {
      void triggerAlertEvent(
        'traffic_spike',
        '📈 Всплеск запросов в Gemini',
        `Зафиксировано ${aiRequestTimestamps.length} AI-запросов за последнюю минуту.`
      );
    }

    return cfg;
  }

  app.post('/api/ai/analyze', async (req: Request, res: Response) => {
    const cfg = await enforceAiAccessAndTrack(req, res);
    if (!cfg) return;

    const body = req.body as {
      personName?: string;
      personSubtitle?: string;
      existingCols?: Array<{ columnTitle: string; existingFacts: string[] }>;
      otherPeopleNames?: string[];
      rawText?: string;
    };

    const rawText = String(body?.rawText || '').trim();
    if (!rawText) {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'rawText is required' });
      return;
    }

    const personName = String(body?.personName || '').trim() || 'Контакт';
    const personSubtitle = String(body?.personSubtitle || '').trim();
    const existingCols = Array.isArray(body?.existingCols) ? body.existingCols : [];
    const otherPeopleNames = Array.isArray(body?.otherPeopleNames)
      ? body.otherPeopleNames
      : [];

    const granularityRule =
      cfg.aiPromptStyle.factGranularity === 'grouped'
        ? `2. СЕМАНТИЧЕСКАЯ ГРУППИРОВКА: Очищай текст от разговорного мусора и объединяй тесно связанные детали одной темы в цельные, ёмкие формулировки (1-2 факта на абзац вместо дробления на мелочи), без местоимений в начале.`
        : `2. АТОМАРНАЯ ДИСТИЛЛЯЦИЯ: Очищай текст от разговорного мусора («оказывается», «мы болтали», «призналась, что», переписочных приветствий и флуда). Разбивай сложные предложения на короткие, лаконичные, самодостаточные факты без местоимений в начале (например: «Отказалась от кофе», «Пьёт японскую матчу на овсяном молоке», «Аллергия на арахис и мёд»). Не создавай бессмысленных обрывков без контекста.`;

    const systemPrompt =
      `Ты — элитный когнитивный аналитик персонального блокнота о людях. Проанализируй заметку о человеке по имени "${personName}". Заметка может быть на русском, казахском или английском языке.\n` +
      `Текущий подзаголовок профиля: "${personSubtitle}"\n` +
      `Другие люди в блокноте: ${JSON.stringify(otherPeopleNames)}\n` +
      `Текущие колонки и ВСЕ уже известные факты:\n${JSON.stringify(existingCols, null, 2)}\n\n` +
      `Выполни 6 задач строго по правилам:\n` +
      `1. ЖЁСТКАЯ ЗАЩИТА ОТ ДУБЛИКАТОВ И СИНОНИМОВ: Никогда не возвращай факт, если аналогичная по смыслу информация УЖЕ присутствует в ЛЮБОЙ колонке existingCols — даже если она выражена синонимами или перефразирована (например: «любит / обожает / в восторге от / предпочитает / без ума от / увлекается», «не любит / ненавидит / терпеть не может / раздражает / бесит / на дух не переносит», «хочет / мечтает», «животное / питомец / кот», а также казахские и английские аналоги). Если в новом тексте нет ничего нового по сравнению с existingCols — верни пустой массив updates: [].\n` +
      `${granularityRule}\n` +
      `3. КАТЕГОРИЗАЦИЯ И НОВЫЕ КОЛОНКИ: Распределяй факты по существующим колонкам (используй точное columnTitle и isNewColumn: false) или создавай новые лаконичные колонки (isNewColumn: true) с подходящим эмодзи icon. Оценивай смысл, а не только точные слова: выражения вроде «обожает», «тащится от», «без ума от», «ұнатады», «adores» относятся к «Нравится» или профильной категории, а «бесит», «раздражает», «на дух не переносит», «жек көреді», «can't stand» — к «Не нравится».\n` +
      `4. НЕЯВНЫЕ ВЫВОДЫ С ОБОСНОВАНИЕМ (tag: "ai_inference"): Делай умные логические выводы (если их ещё нет в existingCols!) и в поле reason кратко пиши основание.\n` +
      `5. ОБНОВЛЕНИЕ И ОБОГАЩЕНИЕ (tag: "updated"): Если новый факт отменяет старый (в том числе через синоним-антоним: было «обожает кофе» -> стало «терпеть не может кофе» / «отказалась от кофе») или уточняет краткий старый факт, ставь tag: "updated", в replacesOldFact укажи точный текст старого факта из existingCols, а в reason — причину обновления.\n` +
      `6. КРОСС-СВЯЗИ И ПРОФИЛЬ: Если упоминается человек из otherPeopleNames — добавь связь в «Семья и окружение». Если раскрыта профессия, а текущий подзаголовок пустой/шаблонный — верни её в suggestedSubtitle.`;

    const reqStart = Date.now();
    const modelSpec = getAiModelSpec(cfg.aiModelPreset);
    try {
      const exec = await executeGeminiWithFallback(cfg.keyRouteMode, {
        model: modelSpec.modelId,
        contents: `${systemPrompt}\n\nНовый текст для анализа:\n${rawText}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel[modelSpec.thinkingLevel] },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              suggestedSubtitle: { type: Type.STRING },
              updates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    columnTitle: { type: Type.STRING },
                    isNewColumn: { type: Type.BOOLEAN },
                    icon: { type: Type.STRING },
                    facts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          tag: { type: Type.STRING },
                          reason: { type: Type.STRING },
                          replacesOldFact: { type: Type.STRING },
                        },
                        required: ['text', 'tag'],
                      },
                    },
                  },
                  required: ['columnTitle', 'isNewColumn', 'icon', 'facts'],
                },
              },
            },
            required: ['summary', 'updates'],
          },
        },
      });

      const text = exec.response.text;
      if (!text) {
        recordAiTelemetry({
          endpoint: 'analyze',
          latencyMs: Date.now() - reqStart,
          promptTokens: exec.promptTokens,
          candidatesTokens: exec.candidatesTokens,
          totalTokens: exec.totalTokens,
          cacheHit: false,
          ok: false,
          slotUsed: exec.slotUsed,
          errorCode: 'EMPTY_AI_RESPONSE',
        });
        res.status(502).json({ errorCode: 'EMPTY_AI_RESPONSE', error: 'Empty model response' });
        return;
      }

      recordAiTelemetry({
        endpoint: 'analyze',
        latencyMs: exec.latencyMs,
        promptTokens: exec.promptTokens,
        candidatesTokens: exec.candidatesTokens,
        totalTokens: exec.totalTokens,
        cacheHit: false,
        ok: true,
        slotUsed: exec.slotUsed,
      });
      res.json(cleanAndParseJson(text));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream Gemini error';
      const classified = classifyGeminiError(message);
      recordAiTelemetry({
        endpoint: 'analyze',
        latencyMs: Date.now() - reqStart,
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        cacheHit: false,
        ok: false,
        errorCode: message === 'NO_API_KEY' ? 'NO_API_KEY' : classified.errorCode,
      });
      if (message === 'NO_API_KEY') {
        res.status(503).json({ errorCode: 'NO_API_KEY', error: 'Gemini key is not configured.' });
        return;
      }
      res.status(classified.httpStatus).json({ errorCode: classified.errorCode, error: message });
    }
  });

  app.post('/api/ai/advisor', async (req: Request, res: Response) => {
    const cfg = await enforceAiAccessAndTrack(req, res);
    if (!cfg) return;

    const body = req.body as {
      person?: { name?: string; updatedAt?: string; columns?: unknown };
      question?: string;
      lang?: string;
    };
    const question = String(body?.question || '').trim();
    if (!question || !body?.person) {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'person and question required' });
      return;
    }

    const lang = String(body?.lang || 'ru');
    const verbosity = cfg.aiPromptStyle.advisorVerbosity;
    const cacheKey = buildAdvisorCacheKey({
      personName: body.person.name,
      personUpdatedAt: body.person.updatedAt,
      columns: body.person.columns,
      question: `${question} [style:${verbosity}]`,
      lang,
    });

    const cached = advisorCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      advisorCacheHits++;
      tokensSavedEstimate += cached.estTokens || 350;
      recordAiTelemetry({
        endpoint: 'advisor',
        latencyMs: 1,
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        cacheHit: true,
        ok: true,
        slotUsed: 'cache',
      });
      res.json(cached.data);
      return;
    }

    const verbosityRule =
      verbosity === 'detailed'
        ? 'Дай развёрнутый, содержательный ответ с конкретными деталями и аргументацией (6-8 строк с подпунктами).'
        : 'Ответ оформи максимально кратко по пунктам (3-4 лаконичных строки).';

    const prompt =
      `Ты — умный личный ассистент по отношениям и общению. У тебя есть полное досье на человека:\n` +
      `${JSON.stringify(body.person, null, 2)}\n\n` +
      `Ответь конкретно, практично и с опорой на факты из досье на вопрос пользователя:\n«${question}»\n\n` +
      `Если в досье есть аллергии, табу или особые привычки — обязательно учти их. ${verbosityRule} ${getLanguageInstruction(
        lang
      )}`;

    const reqStart = Date.now();
    const modelSpec = getAiModelSpec(cfg.aiModelPreset);
    try {
      const exec = await executeGeminiWithFallback(cfg.keyRouteMode, {
        model: modelSpec.modelId,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel[modelSpec.thinkingLevel] },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
            },
            required: ['answer'],
          },
        },
      });
      const text = exec.response.text;
      if (!text) {
        recordAiTelemetry({
          endpoint: 'advisor',
          latencyMs: Date.now() - reqStart,
          promptTokens: exec.promptTokens,
          candidatesTokens: exec.candidatesTokens,
          totalTokens: exec.totalTokens,
          cacheHit: false,
          ok: false,
          slotUsed: exec.slotUsed,
          errorCode: 'EMPTY_AI_RESPONSE',
        });
        res.status(502).json({ errorCode: 'EMPTY_AI_RESPONSE', error: 'Empty model response' });
        return;
      }

      const parsed = cleanAndParseJson(text);
      if (advisorCache.size >= 200) {
        const firstKey = advisorCache.keys().next().value;
        if (firstKey) advisorCache.delete(firstKey);
      }
      advisorCache.set(cacheKey, {
        data: parsed,
        cachedAt: Date.now(),
        estTokens: exec.totalTokens || 350,
      });

      recordAiTelemetry({
        endpoint: 'advisor',
        latencyMs: exec.latencyMs,
        promptTokens: exec.promptTokens,
        candidatesTokens: exec.candidatesTokens,
        totalTokens: exec.totalTokens,
        cacheHit: false,
        ok: true,
        slotUsed: exec.slotUsed,
      });
      res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream Gemini error';
      const classified = classifyGeminiError(message);
      recordAiTelemetry({
        endpoint: 'advisor',
        latencyMs: Date.now() - reqStart,
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        cacheHit: false,
        ok: false,
        errorCode: message === 'NO_API_KEY' ? 'NO_API_KEY' : classified.errorCode,
      });
      if (message === 'NO_API_KEY') {
        res.status(503).json({ errorCode: 'NO_API_KEY', error: 'Gemini key is not configured.' });
        return;
      }
      res.status(classified.httpStatus).json({ errorCode: classified.errorCode, error: message });
    }
  });

  app.post('/api/ai/dossier', async (req: Request, res: Response) => {
    const cfg = await enforceAiAccessAndTrack(req, res);
    if (!cfg) return;

    dossierRebuildCount++;

    const body = req.body as {
      mode?: 'single' | 'all';
      activePersonName?: string;
      people?: unknown[];
      lang?: string;
    };

    const mode = body?.mode === 'all' ? 'all' : 'single';
    const lang = String(body?.lang || 'ru');
    const serialized = Array.isArray(body?.people) ? body.people : [];
    const activeName = String(body?.activePersonName || '');

    const cacheKey = buildDossierCacheKey({
      mode,
      activePersonName: activeName,
      people: serialized,
      lang,
    });
    const cached = dossierCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      dossierCacheHits++;
      tokensSavedEstimate += cached.estTokens || 650;
      recordAiTelemetry({
        endpoint: 'dossier',
        latencyMs: 1,
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        cacheHit: true,
        ok: true,
        slotUsed: 'cache',
      });
      res.json(cached.data);
      return;
    }

    const prompt =
      mode === 'all'
        ? `Ты — аналитик социальных связей. Проанализируй базу всех людей из персонального блокнота:\n${JSON.stringify(
            serialized,
            null,
            2
          )}\n\n` +
          `Сформируй структурированную сводку (${getLanguageInstruction(lang)}) по 6 полям:\n` +
          `- block1Title: "1. Обзор базы и статистика" (переведи заголовок на целевой язык), block1Text: краткая сводка по людям и количеству фактов\n` +
          `- block2Title: "2. Общие интересы между людьми" (переведи заголовок), block2Text: какие люди в блокноте имеют общие увлечения, вкусы или цели\n` +
          `- block3Title: "3. Идеи совместных встреч и активностей" (переведи заголовок), block3Text: куда и кого можно позвать вместе на основе пересечений\n` +
          `- block4Title: "4. Важные ограничения и табу по базе" (переведи заголовок), block4Text: ключевые табу, аллергии и особенности\n` +
          `- block5Title: "5. Краткие карточки людей" (переведи заголовок), block5Text: по 1-2 предложения о каждом человеке\n` +
          `- block6Title: "6. Рекомендации по развитию связей" (переведи заголовок), block6Text: кого давно пора позвать на встречу или поздравить`
        : `Ты — глубокий психолог-аналитик и ассистент по отношениям. Составь полное ИИ-досье на человека по имени "${activeName}":\n${JSON.stringify(
            serialized,
            null,
            2
          )}\n\n` +
          `Сформируй глубокий разбор (${getLanguageInstruction(lang)}) строго по 6 блокам:\n` +
          `- block1Title: "1. Краткий психологический портрет" (переведи заголовок на целевой язык), block1Text: суть человека, его темперамент, ценности и стиль жизни в 2-3 ёмких предложениях\n` +
          `- block2Title: "2. Точки контакта" (переведи заголовок), block2Text: о чём лучше всего поговорить и чем искренне порадовать при встрече\n` +
          `- block3Title: "3. Табу, аллергии и триггеры" (переведи заголовок), block3Text: чего категорически стоит избегать\n` +
          `- block4Title: "4. Персонализированные идеи подарков и сюрпризов" (переведи заголовок), block4Text: конкретные идеи с объяснением, на основе каких фактов сделан вывод\n` +
          `- block5Title: "5. Что ещё стоит узнать" (переведи заголовок), block5Text: 3-4 деликатных вопроса для следующей встречи\n` +
          `- block6Title: "6. Готовые заходы и сценарии встречи" (переведи заголовок), block6Text: 2-3 готовых сообщения/приглашения`;

    const reqStart = Date.now();
    const modelSpec = getAiModelSpec(cfg.aiModelPreset);
    try {
      const exec = await executeGeminiWithFallback(cfg.keyRouteMode, {
        model: modelSpec.modelId,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel[modelSpec.thinkingLevel] },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportTitle: { type: Type.STRING },
              block1Title: { type: Type.STRING },
              block1Text: { type: Type.STRING },
              block2Title: { type: Type.STRING },
              block2Text: { type: Type.STRING },
              block3Title: { type: Type.STRING },
              block3Text: { type: Type.STRING },
              block4Title: { type: Type.STRING },
              block4Text: { type: Type.STRING },
              block5Title: { type: Type.STRING },
              block5Text: { type: Type.STRING },
              block6Title: { type: Type.STRING },
              block6Text: { type: Type.STRING },
            },
            required: [
              'reportTitle',
              'block1Title',
              'block1Text',
              'block2Title',
              'block2Text',
              'block3Title',
              'block3Text',
              'block4Title',
              'block4Text',
              'block5Title',
              'block5Text',
              'block6Title',
              'block6Text',
            ],
          },
        },
      });
      const text = exec.response.text;
      if (!text) {
        recordAiTelemetry({
          endpoint: 'dossier',
          latencyMs: Date.now() - reqStart,
          promptTokens: exec.promptTokens,
          candidatesTokens: exec.candidatesTokens,
          totalTokens: exec.totalTokens,
          cacheHit: false,
          ok: false,
          slotUsed: exec.slotUsed,
          errorCode: 'EMPTY_AI_RESPONSE',
        });
        res.status(502).json({ errorCode: 'EMPTY_AI_RESPONSE', error: 'Empty model response' });
        return;
      }

      const parsed = cleanAndParseJson(text);
      if (dossierCache.size >= 150) {
        const firstKey = dossierCache.keys().next().value;
        if (firstKey) dossierCache.delete(firstKey);
      }
      dossierCache.set(cacheKey, {
        data: parsed,
        cachedAt: Date.now(),
        estTokens: exec.totalTokens || 650,
      });

      recordAiTelemetry({
        endpoint: 'dossier',
        latencyMs: exec.latencyMs,
        promptTokens: exec.promptTokens,
        candidatesTokens: exec.candidatesTokens,
        totalTokens: exec.totalTokens,
        cacheHit: false,
        ok: true,
        slotUsed: exec.slotUsed,
      });
      res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream Gemini error';
      const classified = classifyGeminiError(message);
      recordAiTelemetry({
        endpoint: 'dossier',
        latencyMs: Date.now() - reqStart,
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        cacheHit: false,
        ok: false,
        errorCode: message === 'NO_API_KEY' ? 'NO_API_KEY' : classified.errorCode,
      });
      if (message === 'NO_API_KEY') {
        res.status(503).json({ errorCode: 'NO_API_KEY', error: 'Gemini key is not configured.' });
        return;
      }
      res.status(classified.httpStatus).json({ errorCode: classified.errorCode, error: message });
    }
  });

  app.post('/api/ai/greeting', async (req: Request, res: Response) => {
    const cfg = await enforceAiAccessAndTrack(req, res);
    if (!cfg) return;

    const body = req.body as {
      person?: { name?: string; subtitle?: string; columns?: unknown };
      occasion?: 'birthday' | 'reconnect' | 'invite';
      tone?: 'warm' | 'friendly' | 'formal';
      lang?: string;
    };
    if (!body?.person?.name) {
      res.status(400).json({ errorCode: 'BAD_REQUEST', error: 'person is required' });
      return;
    }

    const occasion =
      body.occasion === 'birthday' || body.occasion === 'invite' ? body.occasion : 'reconnect';
    const tone =
      body.tone === 'warm' || body.tone === 'formal' ? body.tone : 'friendly';
    const lang = String(body.lang || 'ru');

    const occasionDesc =
      occasion === 'birthday'
        ? 'Поздравление с днём рождения'
        : occasion === 'invite'
        ? 'Приглашение на встречу / событие с учётом интересов'
        : 'Тёплое первое сообщение после долгого перерыва в общении';
    const toneDesc =
      tone === 'warm'
        ? 'тёплый, душевный и искренний'
        : tone === 'formal'
        ? 'вежливый, уважительный и сдержанный'
        : 'дружеский, лёгкий и живой';

    const prompt =
      `Напиши готовое короткое сообщение (3-5 предложений, без клише и лишней воды) для отправки в мессенджер.\n` +
      `Повод: ${occasionDesc}.\n` +
      `Тон: ${toneDesc}.\n` +
      `Известное досье о человеке:\n${JSON.stringify(body.person, null, 2)}\n\n` +
      `Естественно вплети 1-2 уместных факта из досье (любимые напитки/интересы/хобби), избегая всего из раздела табу/не нравится. ${getLanguageInstruction(
        lang
      )}`;

    const reqStart = Date.now();
    const modelSpec = getAiModelSpec(cfg.aiModelPreset);
    try {
      const exec = await executeGeminiWithFallback(cfg.keyRouteMode, {
        model: modelSpec.modelId,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel[modelSpec.thinkingLevel] },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
            },
            required: ['message'],
          },
        },
      });
      const text = exec.response.text;
      if (!text) {
        recordAiTelemetry({
          endpoint: 'greeting',
          latencyMs: Date.now() - reqStart,
          promptTokens: exec.promptTokens,
          candidatesTokens: exec.candidatesTokens,
          totalTokens: exec.totalTokens,
          cacheHit: false,
          ok: false,
          slotUsed: exec.slotUsed,
          errorCode: 'EMPTY_AI_RESPONSE',
        });
        res.status(502).json({ errorCode: 'EMPTY_AI_RESPONSE', error: 'Empty model response' });
        return;
      }

      const parsed = cleanAndParseJson<{ message: string }>(text);
      recordAiTelemetry({
        endpoint: 'greeting',
        latencyMs: exec.latencyMs,
        promptTokens: exec.promptTokens,
        candidatesTokens: exec.candidatesTokens,
        totalTokens: exec.totalTokens,
        cacheHit: false,
        ok: true,
        slotUsed: exec.slotUsed,
      });
      res.json({ message: String(parsed?.message || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream Gemini error';
      const classified = classifyGeminiError(message);
      recordAiTelemetry({
        endpoint: 'greeting',
        latencyMs: Date.now() - reqStart,
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0,
        cacheHit: false,
        ok: false,
        errorCode: message === 'NO_API_KEY' ? 'NO_API_KEY' : classified.errorCode,
      });
      if (message === 'NO_API_KEY') {
        res.status(503).json({ errorCode: 'NO_API_KEY', error: 'Gemini key is not configured.' });
        return;
      }
      res.status(classified.httpStatus).json({ errorCode: classified.errorCode, error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.on('error', (err) => {
    console.error('HTTP server failed:', err);
    process.exit(1);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
