import type { Column, Person } from '../types/notebook';
import { uid } from '../utils/storage';
import {
  createDefaultSampleTemplate,
  sanitizeSampleTemplate,
  type SampleContactTemplate,
} from '../utils/adminOps';

export const AVATAR_COLORS = [
  { id: 'violet', bg: '#3f3f46' },
  { id: 'emerald', bg: '#2f4f4f' },
  { id: 'amber', bg: '#78562a' },
  { id: 'rose', bg: '#7c3f38' },
  { id: 'sky', bg: '#3b4d61' },
  { id: 'fuchsia', bg: '#583b5e' },
];

export const DEFAULT_GROUPS = ['Семья', 'Друзья', 'Работа', 'Университет'];

export function getAvatarGradient(colorId: string): string {
  const found = AVATAR_COLORS.find((c) => c.id === colorId);
  return found ? found.bg : AVATAR_COLORS[0].bg;
}

export const DEMO_SAMPLE_TEXT = createDefaultSampleTemplate().demoNoteText;

export function createDefaultSampleState(customTemplate?: SampleContactTemplate | null): {
  activePersonId: string;
  people: Person[];
} {
  const tpl = customTemplate
    ? sanitizeSampleTemplate(customTemplate)
    : createDefaultSampleTemplate();
  const personId = uid('person');
  const now = new Date();
  const upcomingBday = new Date(now.getTime() + 5 * 86400000);
  const monthNamesGenitive = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const sampleBdayLabel = `${upcomingBday.getDate()} ${monthNamesGenitive[upcomingBday.getMonth()]}`;

  const oldMeetingDate = new Date(now.getTime() - 10 * 86400000)
    .toISOString()
    .slice(0, 10);

  const groupedCols = new Map<string, Column>();
  for (const item of tpl.facts) {
    const existing = groupedCols.get(item.columnTitle);
    const factEntry = {
      id: uid('fact'),
      text: item.text,
      isNew: false,
      tag: 'fact' as const,
      reason: '',
      prevText: '',
    };
    if (existing) {
      existing.facts.push(factEntry);
    } else {
      groupedCols.set(item.columnTitle, {
        id: uid('col'),
        title: item.columnTitle,
        icon: item.icon || '📌',
        isNew: false,
        facts: [factEntry],
      });
    }
  }

  if (!groupedCols.has('Важные даты')) {
    groupedCols.set('Важные даты', {
      id: uid('col'),
      title: 'Важные даты',
      icon: '📅',
      isNew: false,
      facts: [
        {
          id: uid('fact'),
          text: `День рождения — ${sampleBdayLabel}`,
          isNew: false,
          tag: 'fact',
          reason: '',
          prevText: '',
        },
      ],
    });
  }

  return {
    activePersonId: personId,
    people: [
      {
        id: personId,
        name: tpl.name,
        subtitle: tpl.subtitle,
        colorId: 'violet',
        updatedAt: now.toISOString(),
        isPinned: true,
        group: tpl.group,
        contactIntervalDays: 14,
        lastContactAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
        columns: Array.from(groupedCols.values()),
        rawNotes: [
          {
            id: uid('note'),
            createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
            text: tpl.demoNoteText,
          },
        ],
        meetings: [
          {
            id: uid('meet'),
            date: oldMeetingDate,
            type: 'meeting',
            summary: 'Первая встреча и знакомство.',
            createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
          },
        ],
      },
    ],
  };
}
