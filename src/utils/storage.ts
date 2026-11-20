import type { MeetingEntry, Person } from '../types/notebook';

const memoryStore = new Map<string, string>();
let persistentAvailable = false;

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const probe = '__smart_notebook_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    persistentAvailable = true;
  }
} catch {
  persistentAvailable = false;
}

export const safeStorage = {
  isPersistent: persistentAvailable,
  getItem(key: string): string | null {
    if (persistentAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStore.has(key) ? memoryStore.get(key)! : null;
      }
    }
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    const strVal = String(value);
    memoryStore.set(key, strVal);
    if (persistentAvailable) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch {
        // Ignore quota/security errors
      }
    }
  },
  removeItem(key: string): void {
    memoryStore.delete(key);
    if (persistentAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    }
  },
};

export const STORAGE_DATA_PREFIX = 'smart_people_notebook_data_v6_';
export const STORAGE_TAB_PREFIX = 'smart_people_notebook_tab_v6_';
export const STORAGE_PENDING_PREFIX = 'smart_people_notebook_pending_v1_';
export const STORAGE_API_KEY = 'smart_people_notebook_gemini_key';
export const STORAGE_THEME_KEY = 'smart_people_notebook_theme';

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getInitials(name: string): string {
  const clean = String(name || '?').trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function formatDateTime(isoStr?: string): string {
  if (!isoStr) return 'только что';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return 'недавно';
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'недавно';
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getTodayInputDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val.filter(Boolean) as T[];
  if (val && typeof val === 'object') return Object.values(val).filter(Boolean) as T[];
  return [];
}

export function computeLatestContactIso(person: {
  meetings?: MeetingEntry[];
  rawNotes?: { createdAt: string }[];
  lastContactAt?: string;
  updatedAt?: string;
}): string {
  const timestamps: number[] = [];

  if (Array.isArray(person.meetings)) {
    for (const m of person.meetings) {
      if (m.date) {
        const ms = new Date(`${m.date}T12:00:00`).getTime();
        if (!Number.isNaN(ms)) timestamps.push(ms);
      }
      if (m.createdAt) {
        const ms = new Date(m.createdAt).getTime();
        if (!Number.isNaN(ms)) timestamps.push(ms);
      }
    }
  }

  if (Array.isArray(person.rawNotes)) {
    for (const n of person.rawNotes) {
      if (n.createdAt) {
        const ms = new Date(n.createdAt).getTime();
        if (!Number.isNaN(ms)) timestamps.push(ms);
      }
    }
  }

  if (person.lastContactAt) {
    const ms = new Date(person.lastContactAt).getTime();
    if (!Number.isNaN(ms)) timestamps.push(ms);
  }

  if (timestamps.length === 0 && person.updatedAt) {
    const ms = new Date(person.updatedAt).getTime();
    if (!Number.isNaN(ms)) timestamps.push(ms);
  }

  if (timestamps.length === 0) return new Date().toISOString();
  return new Date(Math.max(...timestamps)).toISOString();
}

export function normalizePeople(rawList: unknown): Person[] {
  return toArray<Partial<Person>>(rawList).map((p) => {
    const meetings: MeetingEntry[] = toArray<Partial<MeetingEntry>>(p.meetings).map((m) => ({
      id: m.id || uid('meet'),
      date: m.date || getTodayInputDate(),
      type: m.type === 'call' || m.type === 'message' || m.type === 'other' ? m.type : 'meeting',
      summary: m.summary || '',
      createdAt: m.createdAt || new Date().toISOString(),
    }));

    meetings.sort((a, b) => b.date.localeCompare(a.date));

    const rawNotes = toArray<{ id?: string; createdAt?: string; text?: string }>(p.rawNotes).map((n) => ({
      id: n.id || uid('note'),
      createdAt: n.createdAt || new Date().toISOString(),
      text: n.text || '',
    }));

    const updatedAt = p.updatedAt || new Date().toISOString();
    const lastContactAt = computeLatestContactIso({
      meetings,
      rawNotes,
      lastContactAt: p.lastContactAt,
      updatedAt,
    });

    return {
      id: p.id || uid('person'),
      name: p.name || 'Без имени',
      subtitle: p.subtitle || '',
      colorId: p.colorId || 'violet',
      updatedAt,
      isPinned: Boolean(p.isPinned),
      group: typeof p.group === 'string' ? p.group : '',
      contactIntervalDays:
        typeof p.contactIntervalDays === 'number' ? p.contactIntervalDays : 30,
      lastContactAt,
      columns: toArray<{
        id?: string;
        title?: string;
        icon?: string;
        isNew?: boolean;
        facts?: unknown;
      }>(p.columns).map((c) => ({
        id: c.id || uid('col'),
        title: c.title || 'Без названия',
        icon: c.icon || '📌',
        isNew: Boolean(c.isNew),
        facts: toArray<{
          id?: string;
          text?: string;
          isNew?: boolean;
          tag?: string;
          reason?: string;
          prevText?: string;
        }>(c.facts).map((f) => ({
          id: f.id || uid('fact'),
          text: f.text || '',
          isNew: Boolean(f.isNew),
          tag:
            f.tag === 'ai_inference' || f.tag === 'updated'
              ? f.tag
              : 'fact',
          reason: f.reason || '',
          prevText: f.prevText || '',
        })),
      })),
      rawNotes,
      meetings,
    };
  });
}

export function getEffectiveApiKey(): string {
  const saved = safeStorage.getItem(STORAGE_API_KEY) || '';
  return saved.trim();
}
