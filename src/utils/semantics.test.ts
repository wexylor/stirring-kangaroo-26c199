import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeTextLocally,
  compareFacts,
  deduplicatePersonFacts,
} from './semantics';
import type { Person } from '../types/notebook';

function makeBasePerson(): Person {
  return {
    id: 'p_test',
    name: 'Алина',
    subtitle: 'Подруга',
    colorId: 'violet',
    updatedAt: '2026-11-19T10:00:00Z',
    columns: [
      {
        id: 'c_food',
        title: 'Еда и напитки',
        icon: '☕',
        isNew: false,
        facts: [
          {
            id: 'f_coffee',
            text: 'Пьёт раф-кофе на кокосовом молоке без сахара',
            isNew: false,
            tag: 'fact',
            reason: '',
            prevText: '',
          },
        ],
      },
    ],
    rawNotes: [],
  };
}

test('compareFacts detects duplicates, enrichments, and contradictions', () => {
  assert.equal(
    compareFacts('Утренние пробежки в парке', 'Любит бегать по утрам в парке'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Есть кот', 'Дома живёт рыжий кот по кличке Персик'),
    'enrich'
  );
  assert.equal(
    compareFacts('Пьёт кофе по утрам', 'Не пьёт кофе по утрам'),
    'contradict'
  );
  assert.equal(
    compareFacts('Любит джаз', 'Аллергия на арахис'),
    'distinct'
  );
});

test('analyzeTextLocally extracts atomic facts, inferences, and detects updates', () => {
  const person = makeBasePerson();
  const result = analyzeTextLocally(
    person,
    'Она недавно отказалась от кофе и теперь пьёт только матчу на овсяном молоке. У неё сильная аллергия на арахис.'
  );

  const allFacts = result.updates.flatMap((u) => u.facts);
  assert.ok(allFacts.length >= 2);
  assert.ok(allFacts.some((f) => /аллергия на арахис/i.test(f.text)));
  assert.ok(allFacts.some((f) => f.tag === 'ai_inference'));
});

test('deduplicatePersonFacts removes semantic duplicates across columns', () => {
  const person: Person = {
    id: 'p2',
    name: 'Катя',
    subtitle: '',
    colorId: 'emerald',
    updatedAt: '2026-11-19T10:00:00Z',
    columns: [
      {
        id: 'c1',
        title: 'Нравится',
        icon: '❤️',
        isNew: false,
        facts: [
          { id: 'f1', text: 'Утренние пробежки в парке', isNew: false, tag: 'fact', reason: '', prevText: '' },
        ],
      },
      {
        id: 'c2',
        title: 'Привычки',
        icon: '⏰',
        isNew: false,
        facts: [
          { id: 'f2', text: 'Утренние пробежки в парке', isNew: false, tag: 'fact', reason: '', prevText: '' },
        ],
      },
    ],
    rawNotes: [],
  };

  const removed = deduplicatePersonFacts(person);
  assert.equal(removed, 1);
  assert.equal(person.columns[1].facts.length, 0);
});
