import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeTextLocally,
  buildLocalAdvisorAnswer,
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

test('compareFacts recognizes Russian synonyms and idioms (любит/обожает, не любит/раздражает)', () => {
  assert.equal(
    compareFacts('Любит джаз', 'Обожает джаз'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Очень любит читать книги', 'В восторге от чтения книг'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Увлекается плёночной фотографией', 'Без ума от плёночной фотографии'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Не любит шумные места', 'Раздражают шумные места'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Не переносит громкую музыку', 'Терпеть не может громкую музыку'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Обожает джазовую музыку', 'Терпеть не может джазовую музыку'),
    'contradict'
  );
  assert.equal(
    compareFacts('Который год работает дизайнером', 'У неё есть кот'),
    'distinct'
  );
  assert.equal(
    compareFacts('Часто ходит в кино', 'Пьёт зелёный чай'),
    'distinct'
  );
  assert.equal(
    compareFacts('Любит кофе', 'Не любит книги'),
    'distinct'
  );
  assert.equal(
    compareFacts('Любит кофе', 'Любит книги'),
    'distinct'
  );
});

test('analyzeTextLocally classifies synonym phrases into Нравится / Не нравится and blocks synonym duplicates', () => {
  const person: Person = {
    id: 'p_syn',
    name: 'Катя',
    subtitle: '',
    colorId: 'emerald',
    updatedAt: '2026-11-19T10:00:00Z',
    columns: [
      {
        id: 'c_likes',
        title: 'Нравится',
        icon: '❤️',
        isNew: false,
        facts: [
          {
            id: 'f_jazz',
            text: 'Любит джазовую музыку',
            isNew: false,
            tag: 'fact',
            reason: '',
            prevText: '',
          },
        ],
      },
      {
        id: 'c_dislikes',
        title: 'Не нравится',
        icon: '👎',
        isNew: false,
        facts: [],
      },
    ],
    rawNotes: [],
  };

  const res = analyzeTextLocally(
    person,
    'Она обожает джазовую музыку, в восторге от гончарного дела; на дух не переносит громкую музыку.'
  );

  const likesUpdate = res.updates.find((u) => u.columnTitle === 'Нравится');
  const dislikesUpdate = res.updates.find((u) => u.columnTitle === 'Не нравится');

  // «Обожает джазовую музыку» must be filtered out as a synonym duplicate of «Любит джазовую музыку»
  assert.ok(
    !res.updates.some((u) => u.facts.some((f) => /джазов/i.test(f.text))),
    'Synonym duplicate should not be added'
  );
  assert.ok(likesUpdate?.facts.some((f) => /гончарн/i.test(f.text)));
  assert.ok(dislikesUpdate?.facts.some((f) => /громкую музыку/i.test(f.text)));
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
          { id: 'f3', text: 'Любит бегать по утрам в парке', isNew: false, tag: 'fact', reason: '', prevText: '' },
        ],
      },
    ],
    rawNotes: [],
  };

  const removed = deduplicatePersonFacts(person);
  assert.equal(removed, 2);
  assert.equal(person.columns[1].facts.length, 0);
});

test('buildLocalAdvisorAnswer matches synonymous questions (питомец -> кот, чай -> матча)', () => {
  const person: Person = {
    id: 'p3',
    name: 'Алина',
    subtitle: '',
    colorId: 'violet',
    updatedAt: '2026-11-19T10:00:00Z',
    columns: [
      {
        id: 'c_pets',
        title: 'Питомцы',
        icon: '🐾',
        isNew: false,
        facts: [
          { id: 'fp1', text: 'Дома живёт рыжий кот Персик', isNew: false, tag: 'fact', reason: '', prevText: '' },
        ],
      },
      {
        id: 'c_food',
        title: 'Еда и напитки',
        icon: '☕',
        isNew: false,
        facts: [
          { id: 'ff1', text: 'Пьёт японскую матчу на овсяном молоке', isNew: false, tag: 'fact', reason: '', prevText: '' },
        ],
      },
    ],
    rawNotes: [],
  };

  const petAns = buildLocalAdvisorAnswer(person, 'Какое у неё домашнее животное?');
  assert.match(petAns, /Персик/);

  const teaAns = buildLocalAdvisorAnswer(person, 'Какой чай она предпочитает?');
  assert.match(teaAns, /матчу/);
});

test('compareFacts and analyzeTextLocally support Kazakh (kk) and English (en) synonyms and contradictions', () => {
  assert.equal(
    compareFacts('Джаз музыкасын ұнатады', 'Джаз музыкасын жақсы көреді'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Джаз музыкасын қатты ұнатады', 'Джаз музыкасын жек көреді'),
    'contradict'
  );
  assert.equal(
    compareFacts('Loves ceramic pottery', 'Adores ceramic pottery'),
    'duplicate'
  );
  assert.equal(
    compareFacts('Adores loud bars', "Can't stand loud bars"),
    'contradict'
  );

  const person: Person = {
    id: 'p_multi',
    name: 'Айгерім',
    subtitle: '',
    colorId: 'amber',
    updatedAt: '2026-11-20T10:00:00Z',
    columns: [
      {
        id: 'c_likes',
        title: 'Нравится',
        icon: '❤️',
        isNew: false,
        facts: [
          {
            id: 'f_jazz',
            text: 'Джаз музыкасын ұнатады',
            isNew: false,
            tag: 'fact',
            reason: '',
            prevText: '',
          },
        ],
      },
      {
        id: 'c_dislikes',
        title: 'Не нравится',
        icon: '👎',
        isNew: false,
        facts: [],
      },
    ],
    rawNotes: [],
  };

  const kkRes = analyzeTextLocally(
    person,
    'Ол джаз музыкасын жақсы көреді; шулы жерлерді жек көреді; жаңғаққа аллергиясы бар.',
    [],
    'kk'
  );
  // Synonym duplicate "жақсы көреді" for jazz must be skipped
  assert.ok(
    !kkRes.updates.some((u) => u.facts.some((f) => /джаз/i.test(f.text))),
    'Kazakh synonym duplicate should be skipped'
  );
  const dislikes = kkRes.updates.find((u) => u.columnTitle === 'Не нравится');
  assert.ok(dislikes?.facts.some((f) => /шулы/i.test(f.text)));
  assert.ok(
    kkRes.updates.some(
      (u) => u.columnTitle === 'Аллергии и здоровье' && u.facts.some((f) => /аллергия/i.test(f.text))
    )
  );

  const enRes = analyzeTextLocally(
    person,
    "She adores ceramic pottery; can't stand crowded malls; allergic to peanuts.",
    [],
    'en'
  );
  assert.ok(
    enRes.updates.some(
      (u) => u.columnTitle === 'Нравится' && u.facts.some((f) => /pottery/i.test(f.text))
    )
  );
  assert.ok(
    enRes.updates.some(
      (u) => u.columnTitle === 'Не нравится' && u.facts.some((f) => /crowded malls/i.test(f.text))
    )
  );
  assert.ok(
    enRes.updates.some(
      (u) => u.columnTitle === 'Аллергии и здоровье' && u.facts.some((f) => /peanuts/i.test(f.text))
    )
  );
});

test('analyzeTextLocally automatically filters chat transcripts before extracting facts', () => {
  const person = makeBasePerson();
  const chat = [
    'Алина, [20.11.2026 14:10]',
    'Привет, как дела?',
    'Алина, [20.11.2026 14:11]',
    'Я теперь обожаю зелёную матчу, но не переношу шумные клубы.',
  ].join('\n');

  const res = analyzeTextLocally(person, chat, [], 'ru');
  const allTexts = res.updates.flatMap((u) => u.facts.map((f) => f.text)).join(' ');
  assert.match(allTexts, /матчу/i);
  assert.doesNotMatch(allTexts, /как дела|привет/i);
});

test('analyzeTextLocally isolates coffee beverage from coffeehouse and splits English and-clauses', () => {
  const person: Person = {
    id: 'p_split',
    name: 'Алина',
    subtitle: '',
    colorId: 'violet',
    updatedAt: '2026-11-20T10:00:00Z',
    columns: [
      {
        id: 'c_likes',
        title: 'Нравится',
        icon: '❤️',
        isNew: false,
        facts: [
          {
            id: 'f_cafe',
            text: 'Уютные кофейни с тихим джазом',
            isNew: false,
            tag: 'fact',
            reason: '',
            prevText: '',
          },
        ],
      },
      {
        id: 'c_dislikes',
        title: 'Не нравится',
        icon: '👎',
        isNew: false,
        facts: [],
      },
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

  const res = analyzeTextLocally(
    person,
    "Перешла на матчу на овсяном молоке, а от кофе отказалась. She adores ceramic pottery and can't stand loud bars.",
    [],
    'en'
  );

  const likes = res.updates.find((u) => u.columnTitle === 'Нравится');
  const dislikes = res.updates.find((u) => u.columnTitle === 'Не нравится');
  const allFacts = res.updates.flatMap((u) => u.facts);

  assert.ok(likes?.facts.some((f) => /ceramic pottery/i.test(f.text)));
  assert.ok(dislikes?.facts.some((f) => /loud bars/i.test(f.text)));

  const coffeeUpdate = allFacts.find((f) => f.replacesOldFact === 'Пьёт раф-кофе на кокосовом молоке без сахара');
  assert.ok(coffeeUpdate, 'Should update the coffee beverage fact rather than coffeehouse fact');
  assert.ok(!allFacts.some((f) => f.replacesOldFact === 'Уютные кофейни с тихим джазом'));
});


