import type { Person } from '../types/notebook';
import { uid } from '../utils/storage';

export const AVATAR_COLORS = [
  { id: 'violet', bg: 'linear-gradient(135deg, #7c3aed, #4f46e5)' },
  { id: 'emerald', bg: 'linear-gradient(135deg, #10b981, #0d9488)' },
  { id: 'amber', bg: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
  { id: 'rose', bg: 'linear-gradient(135deg, #f43f5e, #db2777)' },
  { id: 'sky', bg: 'linear-gradient(135deg, #0ea5e9, #2563eb)' },
  { id: 'fuchsia', bg: 'linear-gradient(135deg, #c026d3, #7e22ce)' },
];

export const DEFAULT_GROUPS = ['Семья', 'Друзья', 'Работа', 'Университет'];

export function getAvatarGradient(colorId: string): string {
  const found = AVATAR_COLORS.find((c) => c.id === colorId);
  return found ? found.bg : AVATAR_COLORS[0].bg;
}

export const DEMO_SAMPLE_TEXT =
  'Сегодня долго болтали с Алиной! Оказывается, она недавно полностью отказалась от кофе и теперь пьёт только японскую матчу на овсяном молоке. ' +
  'Выяснил, что у неё сильная аллергия на арахис и мёд. Дома у неё живёт рыжий кот по кличке Персик. ' +
  'Она всегда приходит на встречи за 10 минут заранее и строит планы на месяц вперёд. ' +
  'Ещё Алина призналась, что давно мечтает научиться играть на укулеле, но пока не решалась купить инструмент, а осенью хочет съездить в Японию и увидеть Киото.';

export function createDefaultSampleState(): {
  activePersonId: string;
  people: Person[];
} {
  const personId = uid('person');
  const now = new Date();
  // Create a sample birthday 5 days from today so the smart reminder works out-of-the-box for testing
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

  return {
    activePersonId: personId,
    people: [
      {
        id: personId,
        name: 'Алина',
        subtitle: 'Подруга и продакт-дизайнер · Пример вкладки',
        colorId: 'violet',
        updatedAt: now.toISOString(),
        isPinned: true,
        group: 'Друзья',
        contactIntervalDays: 14,
        lastContactAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
        columns: [
          {
            id: uid('col'),
            title: 'Нравится',
            icon: '❤️',
            isNew: false,
            facts: [
              {
                id: uid('fact'),
                text: 'Уютные кофейни с тихим джазом',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
              {
                id: uid('fact'),
                text: 'Скандинавский минимализм и тёплый свет',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
              {
                id: uid('fact'),
                text: 'Дождливые вечера дома с хорошей книгой',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
            ],
          },
          {
            id: uid('col'),
            title: 'Не нравится',
            icon: '👎',
            isNew: false,
            facts: [
              {
                id: uid('fact'),
                text: 'Когда опаздывают на встречи без предупреждения',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
              {
                id: uid('fact'),
                text: 'Шумные торговые центры по выходным',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
            ],
          },
          {
            id: uid('col'),
            title: 'Увлечения',
            icon: '🎯',
            isNew: false,
            facts: [
              {
                id: uid('fact'),
                text: 'Плёночная фотография (снимает на старый Olympus)',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
              {
                id: uid('fact'),
                text: 'Утренние пробежки в парке по субботам',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
            ],
          },
          {
            id: uid('col'),
            title: 'Еда и напитки',
            icon: '☕',
            isNew: false,
            facts: [
              {
                id: uid('fact'),
                text: 'Пьёт раф-кофе на кокосовом молоке без сахара',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
              {
                id: uid('fact'),
                text: 'Любит пасту с морепродуктами',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
            ],
          },
          {
            id: uid('col'),
            title: 'Идеи подарков',
            icon: '🎁',
            isNew: false,
            facts: [
              {
                id: uid('fact'),
                text: 'Цветная фотоплёнка Kodak Portra 400 (35 мм)',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
              {
                id: uid('fact'),
                text: 'Сертификат на гончарный мастер-класс',
                isNew: false,
                tag: 'fact',
                reason: '',
                prevText: '',
              },
            ],
          },
          {
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
          },
        ],
        rawNotes: [
          {
            id: uid('note'),
            createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
            text: 'Познакомились на выставке плёночной фотографии. Алина снимает на старый Olympus, обожает тихие кофейни с джазом и кокосовый раф без сахара, бегает по субботам в парке и очень не любит, когда люди опаздывают.',
          },
        ],
        meetings: [
          {
            id: uid('meet'),
            date: oldMeetingDate,
            type: 'meeting',
            summary: 'Пили кофе после выставки, обсуждали плёночную фотографию и планы на осень.',
            createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
          },
        ],
      },
    ],
  };
}
