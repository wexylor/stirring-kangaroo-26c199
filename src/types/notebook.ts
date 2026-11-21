export type FactTag = 'fact' | 'ai_inference' | 'updated';

export interface FactHistoryEntry {
  text: string;
  changedAt: string;
  reason?: string;
}

export interface Fact {
  id: string;
  text: string;
  isNew: boolean;
  tag: FactTag;
  reason: string;
  prevText: string;
  history?: FactHistoryEntry[];
}

export interface Column {
  id: string;
  title: string;
  icon: string;
  isNew: boolean;
  facts: Fact[];
}

export interface RawNote {
  id: string;
  createdAt: string;
  text: string;
}

export type MeetingType = 'meeting' | 'call' | 'message' | 'other';

export interface MeetingEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: MeetingType;
  summary: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  subtitle: string;
  colorId: string;
  updatedAt: string;
  isPinned?: boolean;
  group?: string;
  contactIntervalDays?: number; // 0 = disabled, default 30
  lastContactAt?: string;
  columns: Column[];
  rawNotes: RawNote[];
  meetings?: MeetingEntry[];
}

export interface AnalysisReport {
  personId: string;
  factsAdded: number;
  newColsCount: number;
  inferencesCount: number;
  updatedCount: number;
  duplicatesSkipped: number;
  engineName: string;
  usedFallback?: boolean;
  fallbackReason?: string;
  snapshotBefore: Person;
}

export interface DossierData {
  reportTitle: string;
  block1Title: string;
  block1Text: string;
  block2Title: string;
  block2Text: string;
  block3Title: string;
  block3Text: string;
  block4Title: string;
  block4Text: string;
  block5Title: string;
  block5Text: string;
  block6Title: string;
  block6Text: string;
  engineUsed?: string;
}

export type CloudSyncStatus = 'connecting' | 'online' | 'pending' | 'error' | 'local';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface UpcomingDateReminder {
  id: string;
  personId: string;
  personName: string;
  personColorId: string;
  factText: string;
  columnTitle: string;
  day: number;
  month: number; // 1-12
  daysUntil: number;
  isBirthday: boolean;
  formattedDate: string;
}
