import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalGreeting } from './greetingGenerator.ts';
import type { Person } from '../types/notebook.ts';

const mockPerson: Person = {
  id: 'p1',
  name: 'Алина',
  subtitle: 'Дизайнер',
  colorId: 'violet',
  group: 'Друзья',
  updatedAt: '2026-11-25T10:00:00Z',
  rawNotes: [],
  meetings: [],
  columns: [
    {
      id: 'c1',
      title: 'Нравится',
      icon: '❤️',
      isNew: false,
      facts: [{ id: 'f1', text: 'Джаз и плёночная фотография', isNew: false, tag: 'fact', reason: '', prevText: '' }],
    },
    {
      id: 'c2',
      title: 'Не нравится',
      icon: '👎',
      isNew: false,
      facts: [{ id: 'f2', text: 'Шумные торговые центры', isNew: false, tag: 'fact', reason: '', prevText: '' }],
    },
  ],
};

test('buildLocalGreeting personalizes birthday, reconnect, and invite drafts without dislikes', () => {
  const bdayRu = buildLocalGreeting({
    person: mockPerson,
    occasion: 'birthday',
    tone: 'warm',
    lang: 'ru',
  });
  assert.ok(bdayRu.includes('Алина'));
  assert.ok(bdayRu.includes('джаз') || bdayRu.includes('фотография'));
  assert.ok(!bdayRu.includes('Шумные торговые центры'));

  const reconnectEn = buildLocalGreeting({
    person: mockPerson,
    occasion: 'reconnect',
    tone: 'formal',
    lang: 'en',
  });
  assert.ok(reconnectEn.includes('Hello Алина'));
});
