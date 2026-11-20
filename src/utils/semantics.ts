import type { DossierData, FactTag, Person } from '../types/notebook';

const RU_STOPWORDS = new Set([
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она', 'так',
  'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'было',
  'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну', 'ли',
  'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'опять', 'вам', 'ведь', 'там',
  'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы',
  'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под',
  'будет', 'тогда', 'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь',
  'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем', 'всех', 'можно',
  'при', 'наконец', 'об', 'другой', 'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас',
  'про', 'всего', 'них', 'какая', 'много', 'эту', 'моя', 'впрочем', 'хорошо', 'свою', 'этой', 'перед',
  'иногда', 'лучше', 'чуть', 'том', 'нельзя', 'такой', 'им', 'более', 'всегда', 'конечно', 'всю',
  'очень', 'просто', 'кстати', 'оказывается', 'сегодня', 'вчера', 'позавчера', 'давно', 'пока',
  'сильн', 'сильная', 'сильный', 'сильно', 'дома', 'живет', 'живёт',
]);

const CANONICAL_STEM_GROUPS = [
  { canon: 'любить', roots: ['люб', 'обожа', 'нрав', 'фанат', 'восторг', 'тащит'] },
  { canon: 'нелюбить', roots: ['ненавид', 'раздража', 'бес', 'вынос'] },
  { canon: 'бег', roots: ['бег', 'пробежк', 'пробеж', 'бега', 'марафон'] },
  { canon: 'утро', roots: ['утр', 'утрен', 'утренн'] },
  { canon: 'вечер', roots: ['вечер', 'вечерн'] },
  { canon: 'кофе', roots: ['коф', 'раф', 'латт', 'капучин', 'американо', 'эспрессо'] },
  { canon: 'кот', roots: ['кот', 'кошк', 'котен', 'котя'] },
  { canon: 'собака', roots: ['собак', 'пес', 'пса', 'щен'] },
  { canon: 'аллергия', roots: ['аллерг', 'неперенос', 'противопоказан'] },
  { canon: 'мечта', roots: ['мечт', 'хочет', 'хотел', 'жела', 'грезит'] },
  { canon: 'поездка', roots: ['поехат', 'съездит', 'слетат', 'путешеств', 'поездк'] },
  { canon: 'пунктуальность', roots: ['пунктуальн', 'заранее', 'опаздан', 'опоздан'] },
  { canon: 'планы', roots: ['план', 'планир', 'расписан'] },
  { canon: 'фото', roots: ['фот', 'фотограф', 'снима', 'камер', 'пленк', 'пленочн'] },
  { canon: 'музыка', roots: ['музык', 'песн', 'трек', 'слуша', 'альбом'] },
  { canon: 'книги', roots: ['книг', 'чита', 'чтен', 'роман', 'литератур'] },
  { canon: 'кино', roots: ['кин', 'фильм', 'сериал', 'смотр'] },
];

export function stemRu(word: string): string {
  let w = String(word || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9-]/g, '');
  if (w.length <= 3) return w;

  const suffixes = [
    'ованию', 'еванию', 'ировать', 'оваться', 'еваться',
    'аться', 'яться', 'иться', 'еться', 'уться',
    'ющими', 'ащими', 'ящими', 'ыми', 'ими', 'ого', 'его', 'ому', 'ему',
    'ами', 'ями', 'ах', 'ях', 'ом', 'ем', 'ой', 'ей', 'ую', 'юю',
    'ать', 'ять', 'ить', 'еть', 'уть', 'ешь', 'ишь', 'ете', 'ите',
    'ют', 'ут', 'ят', 'ат', 'ет', 'ит', 'ла', 'ло', 'ли',
    'ов', 'ев', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие',
    'ам', 'ям', 'ка', 'ку', 'ки', 'ке', 'кой',
    'а', 'я', 'о', 'е', 'ы', 'и', 'у', 'ю', 'ь',
  ];

  for (const suf of suffixes) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      w = w.slice(0, w.length - suf.length);
      break;
    }
  }
  if (w.length >= 4 && w[w.length - 1] === w[w.length - 2]) {
    w = w.slice(0, -1);
  }
  return w;
}

export function canonicalizeStem(stem: string): string {
  for (const grp of CANONICAL_STEM_GROUPS) {
    if (grp.roots.some((r) => stem === r || stem.startsWith(r))) {
      return grp.canon;
    }
  }
  return stem;
}

export function extractStems(text: string): Set<string> {
  const words = String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[^а-яa-z0-9-]+/)
    .filter((w) => w.length >= 2 && !RU_STOPWORDS.has(w));
  return new Set(
    words
      .map(stemRu)
      .filter((s) => s.length >= 2 && !RU_STOPWORDS.has(s))
      .map(canonicalizeStem)
  );
}

export function detectPolarity(text: string): -1 | 1 {
  const low = String(text || '').toLowerCase().replace(/ё/g, 'е');
  const hasNeg =
    /(?:^|[^а-яa-z])(?:не|нет|никогда|без|отказал(?:ся|ась)\s+от|бросил[а]?|перестал[а]?|больше\s+не|терпеть\s+не\s+может|ненавидит|раздражает|избегает)(?:[^а-яa-z]|$)/i.test(
      low
    );
  return hasNeg ? -1 : 1;
}

function getCharNgrams(text: string, n: number): Set<string> {
  const clean = String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const grams = new Set<string>();
  if (clean.length < n) {
    if (clean) grams.add(clean);
    return grams;
  }
  for (let i = 0; i <= clean.length - n; i++) {
    grams.add(clean.slice(i, i + n));
  }
  return grams;
}

function charDiceSimilarity(a: string, b: string): number {
  const gA = getCharNgrams(a, 3);
  const gB = getCharNgrams(b, 3);
  if (gA.size === 0 || gB.size === 0) return 0;
  let hit = 0;
  gB.forEach((g) => {
    if (gA.has(g)) hit++;
  });
  return (2 * hit) / (gA.size + gB.size);
}

export type FactRelationType = 'duplicate' | 'enrich' | 'contradict' | 'distinct';

export function compareFacts(existingText: string, candidateText: string): FactRelationType {
  const norm = (s: string) =>
    String(s || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[.,!?;:«»"()—–-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const a = norm(existingText);
  const b = norm(candidateText);
  if (!b || b.length < 2) return 'duplicate';
  if (a === b) return 'duplicate';

  const polA = detectPolarity(a);
  const polB = detectPolarity(b);

  const stemsA = extractStems(a);
  const stemsB = extractStems(b);

  if (stemsA.size === 0 || stemsB.size === 0) {
    return charDiceSimilarity(a, b) >= 0.72 ? 'duplicate' : 'distinct';
  }

  let intersection = 0;
  stemsB.forEach((s) => {
    if (stemsA.has(s)) intersection++;
  });

  const union = stemsA.size + stemsB.size - intersection;
  const jaccard = union > 0 ? intersection / union : 0;
  const recallOfExisting = intersection / stemsA.size;
  const recallOfCandidate = intersection / stemsB.size;
  const minRecall = Math.max(recallOfExisting, recallOfCandidate);
  const dice3 = charDiceSimilarity(a, b);

  if (polA !== polB && intersection >= 1 && (minRecall >= 0.5 || dice3 >= 0.45)) {
    return 'contradict';
  }

  if (polA === polB) {
    if (a.length >= 10 && a.includes(b)) return 'duplicate';
    if (b.length >= 10 && b.includes(a)) {
      return b.length > a.length + 7 ? 'enrich' : 'duplicate';
    }
  }

  if (
    polA === polB &&
    stemsB.size > stemsA.size &&
    recallOfExisting >= 0.85 &&
    b.length > a.length + 7
  ) {
    return 'enrich';
  }

  const isSemanticDup =
    jaccard >= 0.5 ||
    (Math.min(stemsA.size, stemsB.size) >= 2 && minRecall >= 0.72) ||
    (dice3 >= 0.64 && intersection >= 1) ||
    (jaccard >= 0.38 && dice3 >= 0.52);

  if (isSemanticDup && polA === polB) {
    return 'duplicate';
  }

  return 'distinct';
}

export function findFactRelationAcrossPerson(
  person: Person,
  candidateText: string,
  replacesHint: string
) {
  if (replacesHint) {
    for (const col of person.columns) {
      for (const fact of col.facts) {
        const rel = compareFacts(fact.text, replacesHint);
        if (rel === 'duplicate' || rel === 'enrich' || rel === 'contradict') {
          return { type: 'contradict' as const, col, fact };
        }
      }
    }
  }

  for (const col of person.columns) {
    for (const fact of col.facts) {
      if (compareFacts(fact.text, candidateText) === 'duplicate') {
        return { type: 'duplicate' as const, col, fact };
      }
    }
  }

  for (const col of person.columns) {
    for (const fact of col.facts) {
      if (compareFacts(fact.text, candidateText) === 'enrich') {
        return { type: 'enrich' as const, col, fact };
      }
    }
  }

  const hasChangeMarker =
    /(?:теперь|переш[её]л на|перешла на|отказал(?:ся|ась) от|больше не|вместо|бросил[а]?|сменил[а]?|пь[её]т только)/i.test(
      candidateText
    );
  const newStems = extractStems(candidateText);
  const domainPairs = [
    ['кофе', 'матч', 'ча'],
    ['вегетариан', 'мяс', 'веган', 'рыб'],
    ['живет', 'переехал', 'город', 'квартир'],
    ['работа', 'должност', 'компан', 'уволил'],
  ];

  for (const col of person.columns) {
    for (const existing of col.facts) {
      if (compareFacts(existing.text, candidateText) === 'contradict') {
        return { type: 'contradict' as const, col, fact: existing };
      }

      if (hasChangeMarker && newStems.size > 0) {
        const oldStems = extractStems(existing.text);
        let overlap = 0;
        newStems.forEach((s) => {
          if (oldStems.has(s)) overlap++;
        });

        let sameDomain = overlap >= 1;
        if (!sameDomain) {
          domainPairs.forEach((group) => {
            const hasNew = group.some((g) => Array.from(newStems).some((s) => s.startsWith(g)));
            const hasOld = group.some((g) => Array.from(oldStems).some((s) => s.startsWith(g)));
            if (hasNew && hasOld) sameDomain = true;
          });
        }

        if (sameDomain) {
          return { type: 'contradict' as const, col, fact: existing };
        }
      }
    }
  }

  return { type: 'distinct' as const, col: null, fact: null };
}

export function deduplicatePersonFacts(person: Person): number {
  if (!person) return 0;
  const keptFacts: Person['columns'][number]['facts'] = [];
  let removedCount = 0;

  person.columns.forEach((col) => {
    const cleanList: Person['columns'][number]['facts'] = [];
    col.facts.forEach((fact) => {
      const dupIndex = keptFacts.findIndex((k) => {
        const rel = compareFacts(k.text, fact.text);
        return rel === 'duplicate' || rel === 'enrich';
      });

      if (dupIndex !== -1) {
        if (
          fact.text.length > keptFacts[dupIndex].text.length + 7 &&
          compareFacts(keptFacts[dupIndex].text, fact.text) === 'enrich'
        ) {
          keptFacts[dupIndex].text = fact.text;
        }
        removedCount++;
      } else {
        keptFacts.push(fact);
        cleanList.push(fact);
      }
    });
    col.facts = cleanList;
  });

  return removedCount;
}

export interface AnalysisUpdateFact {
  text: string;
  tag: FactTag;
  reason?: string;
  replacesOldFact?: string;
}

export interface AnalysisUpdateColumn {
  columnTitle: string;
  isNewColumn: boolean;
  icon: string;
  facts: AnalysisUpdateFact[];
}

export interface AnalysisResultPayload {
  summary: string;
  suggestedSubtitle?: string;
  updates: AnalysisUpdateColumn[];
}

function normalizeClauseToAtomicFact(clause: string, personName: string): string {
  let s = String(clause || '').trim();
  if (!s) return '';

  const leadIns = [
    /^(?:сегодня|вчера|позавчера|недавно|на днях|кстати|оказывается|как выяснилось)[,\s]+/i,
    /^(?:долго\s+)?(?:болтали|поболтали|говорили|поговорили|общались|переписывались|встречались)\s+с\s+[А-ЯЁA-Za-z-]+[.,!\s]*/i,
    /^(?:я\s+)?(?:узнал[а]?|выяснил[а]?|заметил[а]?|понял[а]?|вспомнил[а]?)[,\s]+что\s+/i,
    /^(?:ещё|также|кроме того)\s+/i,
  ];
  leadIns.forEach((rx) => {
    s = s.replace(rx, '').trim();
  });

  if (personName) {
    const escapedName = personName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePrefixRx = new RegExp(
      `^${escapedName}\\s+(?:признал(?:ся|ась),\\s+что|сказал[а]?,\\s+что|рассказал[а]?,\\s+что|отметил[а]?,\\s+что)\\s+`,
      'i'
    );
    s = s.replace(namePrefixRx, '').trim();
    const plainNameRx = new RegExp(`^${escapedName}\\s+`, 'i');
    s = s.replace(plainNameRx, '').trim();
  }

  s = s
    .replace(/^(?:он|она)\s+(?:недавно\s+)?/i, '')
    .replace(/^у\s+(?:неё|него)\s+(?:сильная\s+|есть\s+)?/i, '')
    .replace(/^дома\s+у\s+(?:неё|него)\s+жив[её]т\s+/i, 'Дома живёт ')
    .replace(/^всё\s+время\s+/i, 'Всегда ')
    .trim();

  if (s.length < 3) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function splitSentenceIntoSmartClauses(sentence: string, personName: string): string[] {
  const rawParts = sentence.split(
    /(?:,\s*(?=а вот|но |а ещё|ещё |также |кроме того|зато |при этом|однако |а осенью|а летом|а зимой|а весной|а по )|\s+и теперь\s+|\s+и (?=(?:строит|бегает|работает|любит|не любит|хочет|мечтает|планирует|увлекается|коллекционирует|занимается|обожает|ненавидит|водит|учится|жив[её]т|пь[её]т|ест)\b))/i
  );

  const merged: string[] = [];
  for (const rawPart of rawParts) {
    const part = rawPart.trim();
    if (!part) continue;

    const isDependentQualifier =
      /^(?:но\s+пока|пока\s+не|потому\s+что|так\s+как|хотя\s+пока|но\s+очень\s+редко)/i.test(part);
    if (isDependentQualifier && merged.length > 0) {
      const cleanTail = part.replace(/^но\s+/i, '').trim();
      merged[merged.length - 1] = `${merged[merged.length - 1]} (${cleanTail.toLowerCase()})`;
      continue;
    }

    const normalized = normalizeClauseToAtomicFact(part, personName);
    if (normalized.length >= 3) {
      merged.push(normalized);
    }
  }
  return merged;
}

export function analyzeTextLocally(
  person: Person,
  rawText: string,
  allPeople: Person[] = []
): AnalysisResultPayload {
  const categories = [
    {
      title: 'Аллергии и здоровье',
      icon: '🩺',
      stems: [
        'аллерг', 'неперенос', 'противопоказан', 'здоров', 'диет', 'лактоз', 'глютен',
        'таблетк', 'давлен', 'витамин', 'вегетариан', 'веган',
      ],
      patterns: [/аллерг/i, /не перенос/i, /противопоказан/i, /нельзя есть/i, /вегетариан/i, /веган/i],
    },
    {
      title: 'Еда и напитки',
      icon: '☕',
      stems: [
        'коф', 'раф', 'латт', 'капучин', 'американо', 'ча', 'матч', 'ед', 'блюд',
        'кухн', 'пицц', 'суш', 'паст', 'десерт', 'сладк', 'вин', 'напит', 'молок', 'овсян',
      ],
      patterns: [/кофе/i, /раф/i, /матч/i, /напит/i, /блюд/i, /пь[её]т/i, /ест\b/i, /отказал(?:ся|ась) от кофе/i],
    },
    {
      title: 'Питомцы',
      icon: '🐾',
      stems: ['кот', 'кошк', 'котен', 'собак', 'пес', 'щен', 'корги', 'питом', 'попуга', 'хомяк', 'кличк'],
      patterns: [/кот\b/i, /кошк/i, /собак/i, /питом/i, /кличк/i],
    },
    {
      title: 'Семья и окружение',
      icon: '👨‍👩‍👧',
      stems: ['мам', 'пап', 'родител', 'брат', 'сестр', 'муж', 'жен', 'сын', 'доч', 'сем', 'бабушк', 'дедушк', 'подруг', 'друг', 'познакомил'],
      patterns: [/мама/i, /папа/i, /родител/i, /сестр/i, /брат\b/i, /семь/i, /дружит с/i],
    },
    {
      title: 'Мечты и цели',
      icon: '🚀',
      stems: ['мечт', 'цел', 'науч', 'поступ', 'переехат', 'побыват', 'увидет', 'достич'],
      patterns: [/мечтает/i, /хочет научиться/i, /поставил[а]? цель/i],
    },
    {
      title: 'Путешествия',
      icon: '✈️',
      stems: ['путешеств', 'поехат', 'слетат', 'съездит', 'япон', 'киот', 'токи', 'итал', 'исланд', 'отпуск', 'поход', 'маршрут', 'стран'],
      patterns: [/путешеств/i, /поехать в/i, /съездить в/i, /слетать/i, /япони/i, /киото/i],
    },
    {
      title: 'Культура и медиа',
      icon: '🎬',
      stems: ['фильм', 'кин', 'сериал', 'книг', 'музык', 'слуша', 'чита', 'смотр', 'нолан', 'инди', 'джаз', 'рок', 'аниме', 'игр', 'укулел', 'гитар'],
      patterns: [/фильм/i, /сериал/i, /книг/i, /музык/i, /слушает/i, /смотрит/i, /читает/i, /играть на/i],
    },
    {
      title: 'Привычки и режим',
      icon: '⏰',
      stems: ['утрен', 'вечер', 'режим', 'привычк', 'пробежк', 'бега', 'зарядк', 'просыпа', 'ложит', 'заранее', 'план'],
      patterns: [/приходит .* заранее/i, /по утрам/i, /по субботам/i, /режим/i, /привычк/i, /строит планы/i],
    },
    {
      title: 'Характер и ценности',
      icon: '🧠',
      stems: ['характер', 'ценност', 'интроверт', 'экстраверт', 'пунктуальн', 'ответствен', 'добр', 'честн', 'перфекционист', 'организован'],
      patterns: [/по характеру/i, /ценит/i, /интроверт/i, /экстраверт/i, /пунктуальн/i],
    },
    {
      title: 'Идеи подарков',
      icon: '🎁',
      stems: ['подар', 'подарит', 'вишлист', 'сертификат', 'обрадовал'],
      patterns: [/подарок/i, /подарить/i, /обрадовал(?:ся|ась) бы/i, /сертификат/i],
    },
    {
      title: 'Важные даты',
      icon: '📅',
      stems: ['рожден', 'годовщин', 'юбиле', 'праздник', 'октябр', 'ноябр', 'декабр', 'январ', 'феврал', 'март', 'апрел', 'июн', 'июл', 'август', 'сентябр'],
      patterns: [/день рождения/i, /\bдр\b/i, /годовщин/i, /\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i],
    },
    {
      title: 'Работа и карьера',
      icon: '💼',
      stems: ['работа', 'должност', 'менеджер', 'разработчик', 'дизайнер', 'стартап', 'компан', 'офис', 'удаленк', 'професс', 'карьер', 'проект'],
      patterns: [/работает/i, /менеджер/i, /дизайнер/i, /разработчик/i, /стартап/i, /карьер/i],
    },
    {
      title: 'Не нравится',
      icon: '👎',
      stems: ['ненавид', 'бес', 'раздража', 'вынос'],
      patterns: [/не нравится/i, /не любит/i, /терпеть не может/i, /ненавидит/i, /раздражает/i, /не выносит/i],
    },
    {
      title: 'Нравится',
      icon: '❤️',
      stems: ['нрав', 'люб', 'обожа', 'фанат', 'восторг', 'кайф'],
      patterns: [/нравится/i, /любит/i, /обожает/i, /в восторге/i],
    },
  ];

  const grouped = new Map<string, AnalysisUpdateColumn>();
  const batchTexts: string[] = [];
  let suggestedSubtitle = '';

  function ensureGroup(colTitle: string, icon: string): AnalysisUpdateColumn {
    const cleanTitle = colTitle.trim();
    if (!grouped.has(cleanTitle)) {
      const existingCol = person.columns.find(
        (c) => c.title.trim().toLowerCase() === cleanTitle.toLowerCase()
      );
      grouped.set(cleanTitle, {
        columnTitle: existingCol ? existingCol.title : cleanTitle,
        isNewColumn: !existingCol,
        icon: existingCol ? existingCol.icon : icon || '📌',
        facts: [],
      });
    }
    return grouped.get(cleanTitle)!;
  }

  function pushFactItem(
    colTitle: string,
    icon: string,
    factText: string,
    preferredTag: FactTag,
    reasonText: string
  ) {
    const cleanFact = String(factText || '').trim();
    if (cleanFact.length < 3) return;
    const formatted = cleanFact.charAt(0).toUpperCase() + cleanFact.slice(1);

    if (
      batchTexts.some((prev) => {
        const rel = compareFacts(prev, formatted);
        return rel === 'duplicate' || rel === 'enrich';
      })
    ) {
      return;
    }

    const relAcross = findFactRelationAcrossPerson(person, formatted, '');
    if (relAcross.type === 'duplicate') {
      return;
    }

    const group = ensureGroup(colTitle, icon);
    let finalTag: FactTag = preferredTag || 'fact';
    let replacesOldFact = '';
    let finalReason = reasonText || '';

    if (relAcross.type === 'enrich' && relAcross.fact) {
      finalTag = 'updated';
      replacesOldFact = relAcross.fact.text;
      if (!finalReason) finalReason = 'Дополнено деталями из новой заметки';
    } else if (relAcross.type === 'contradict' && relAcross.fact) {
      finalTag = 'updated';
      replacesOldFact = relAcross.fact.text;
      if (!finalReason) finalReason = 'Обновлено на основе новой заметки';
    }

    batchTexts.push(formatted);
    group.facts.push({
      text: formatted,
      tag: finalTag,
      reason: finalReason,
      replacesOldFact,
    });
  }

  allPeople.forEach((other) => {
    if (other.id === person.id) return;
    const escaped = other.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`(?:^|[^А-ЯЁа-яё])${escaped}(?:[^А-ЯЁа-яё]|$)`, 'i');
    if (rx.test(rawText)) {
      pushFactItem(
        'Семья и окружение',
        '👨‍👩‍👧',
        `Знакома/общается с «${other.name}»`,
        'ai_inference',
        `Упоминание в заметке о ${person.name}`
      );
    }
  });

  const sentences = rawText
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  sentences.forEach((sentence) => {
    if (
      /^(?:сегодня|вчера|позавчера)?\s*(?:долго\s+)?(?:болтали|поболтали|говорили|поговорили|встречались|сидели)\s+с\s+[А-ЯЁA-Za-z-]+$/i.test(
        sentence
      )
    ) {
      return;
    }

    const colonMatch = sentence.match(/^([А-ЯЁA-Za-z0-9\s-]{2,32}):\s*(.+)$/);
    if (colonMatch && !/^\d{1,2}$/.test(colonMatch[1].trim())) {
      pushFactItem(colonMatch[1].trim(), '📌', colonMatch[2].trim(), 'fact', '');
      return;
    }

    const clauses = splitSentenceIntoSmartClauses(sentence, person.name);

    clauses.forEach((normalized) => {
      if (normalized.length < 3) return;

      const roleMatch = normalized.match(
        /(?:работает|устроилась|устроился|стала|стал)\s+([а-яёa-z0-9\s-]{4,40})/i
      );
      if (
        roleMatch &&
        (!person.subtitle ||
          person.subtitle.includes('Личная карточка') ||
          person.subtitle.includes('Пример вкладки'))
      ) {
        suggestedSubtitle =
          roleMatch[1].trim().charAt(0).toUpperCase() + roleMatch[1].trim().slice(1);
      }

      const clauseStems = extractStems(normalized);
      const hasNegation =
        /(?:не любит|не нравится|терпеть не может|ненавидит|раздражает|не ест|не пь[её]т|отказал(?:ся|ась) от)/i.test(
          normalized
        );

      let bestCat: (typeof categories)[number] | null = null;
      let bestScore = 0;

      categories.forEach((cat) => {
        if (hasNegation && cat.title === 'Нравится') return;

        let score = 0;
        if (cat.patterns.some((rx) => rx.test(normalized))) {
          score += 3;
        }
        cat.stems.forEach((st) => {
          if (clauseStems.has(st)) score += 2;
        });

        if (score > bestScore) {
          bestScore = score;
          bestCat = cat;
        }
      });

      if (bestCat) {
        pushFactItem((bestCat as (typeof categories)[number]).title, (bestCat as (typeof categories)[number]).icon, normalized, 'fact', '');
      } else {
        pushFactItem('Разные заметки', '📝', normalized, 'fact', '');
      }

      if (/аллерг.*(?:арахис|орех|м[её]д|лактоз|глютен|цитрус)/i.test(normalized)) {
        const allergenMatch = normalized.match(/аллерг[а-я]*\s+на\s+([^,.!?()]+)/i);
        const allergen = allergenMatch ? allergenMatch[1].trim() : 'аллергены';
        pushFactItem(
          'Идеи подарков',
          '🎁',
          `Строго без продуктов, содержащих ${allergen}`,
          'ai_inference',
          `Из-за выявленной аллергии (${normalized})`
        );
      }

      const dreamMatch = normalized.match(
        /(?:мечтает\s+научиться\s+играть\s+на|мечтает\s+о|мечтает\s+купить|давно\s+хочет|хотел[а]?\s+бы|сломал(?:ся|ась)|не\s+решал(?:ся|ась)\s+купить)\s+([^,.!?()]+)/i
      );
      if (dreamMatch && dreamMatch[1]) {
        const targetObj = dreamMatch[1].trim();
        if (/укулел/i.test(normalized)) {
          pushFactItem(
            'Идеи подарков',
            '🎁',
            'Укулеле (сопрано или концерт) и чехол/тюнер',
            'ai_inference',
            'Из мечты научиться играть на укулеле'
          );
        } else if (targetObj.length >= 3 && targetObj.length <= 55) {
          pushFactItem(
            'Идеи подарков',
            '🎁',
            `Подарок по теме: «${targetObj}»`,
            'ai_inference',
            'Выведено из желания или мечты'
          );
        }
      }

      if (/(?:япони|киот|токи)/i.test(normalized)) {
        pushFactItem(
          'Идеи подарков',
          '🎁',
          'Авторский путеводитель по Киото или компактный тревел-органайзер',
          'ai_inference',
          'Из планов поехать в Японию'
        );
      }

      if (/(?:матч[ауе]|овсяном молоке)/i.test(normalized)) {
        pushFactItem(
          'Идеи подарков',
          '🎁',
          'Церемониальный японский чай матча и бамбуковый венчик (тясэн)',
          'ai_inference',
          'Из перехода на матчу на овсяном молоке'
        );
      }

      if (/(?:приходит .* заранее|не любит опоздан|терпеть не может опоздан|строит планы)/i.test(normalized)) {
        pushFactItem(
          'Характер и ценности',
          '🧠',
          'Высокая пунктуальность, системность и любовь к планированию',
          'ai_inference',
          'Приходит заранее и строит планы на месяц вперёд'
        );
      } else if (/(?:тихие кофейни|шумные торговые|вечера дома с .* книгой)/i.test(normalized)) {
        pushFactItem(
          'Характер и ценности',
          '🧠',
          'Ценит спокойную атмосферу, тишину и глубокое общение',
          'ai_inference',
          'Предпочитает тихие кофейни и книги шумным местам'
        );
      }
    });
  });

  return {
    summary: 'Текст разобран локальным семантическим ИИ.',
    suggestedSubtitle,
    updates: Array.from(grouped.values()),
  };
}

export function buildLocalAdvisorAnswer(person: Person, question: string): string {
  const lowQ = question.toLowerCase();
  const allFacts: { col: string; text: string; reason: string }[] = [];
  const limits: string[] = [];
  const gifts: string[] = [];
  const likes: string[] = [];

  person.columns.forEach((c) => {
    const lowCol = c.title.toLowerCase();
    c.facts.forEach((f) => {
      allFacts.push({ col: c.title, text: f.text, reason: f.reason });
      if (lowCol.includes('аллерг') || lowCol.includes('здоров') || lowCol.includes('не нравится')) {
        limits.push(`• [${c.title}] ${f.text}`);
      } else if (lowCol.includes('подар')) {
        gifts.push(`• ${f.text}${f.reason ? ` (${f.reason})` : ''}`);
      } else if (
        lowCol.includes('нравится') ||
        lowCol.includes('еда') ||
        lowCol.includes('увлеч') ||
        lowCol.includes('мечт')
      ) {
        likes.push(`• [${c.title}] ${f.text}`);
      }
    });
  });

  if (/подар|подарит|др|день рожден|сюрприз/i.test(lowQ)) {
    const lines: string[] = [];
    if (gifts.length > 0) {
      lines.push(`Лучшие идеи подарков для ${person.name}:\n${gifts.join('\n')}`);
    } else if (likes.length > 0) {
      lines.push(`Опирайтесь на интересы ${person.name}:\n${likes.slice(0, 4).join('\n')}`);
    } else {
      lines.push(`Пока мало данных об увлечениях ${person.name} — добавьте пару фактов о хобби.`);
    }
    if (limits.length > 0) {
      lines.push(`\n⚠️ Обязательно учтите ограничения:\n${limits.join('\n')}`);
    }
    return lines.join('\n');
  }

  if (/пойти|встреч|свидан|кафе|ресторан|куда|погулят/i.test(lowQ)) {
    const lines = [`Рекомендации для встречи с ${person.name}:`];
    if (likes.length > 0) {
      lines.push(`• Ориентиры по атмосфере и вкусам:\n${likes.slice(0, 4).join('\n')}`);
    }
    if (limits.length > 0) {
      lines.push(`• Чего избегать:\n${limits.join('\n')}`);
    }
    lines.push('• Совет: приходите вовремя (или чуть заранее) и выбирайте место со спокойной обстановкой.');
    return lines.join('\n');
  }

  if (/поговорит|спросит|тема|обсуд|диалог/i.test(lowQ)) {
    return likes.length > 0
      ? `Беспроигрышные темы для разговора с ${person.name}:\n${likes.slice(0, 5).join('\n')}`
      : 'Спросите о недавних впечатлениях, книгах, фильмах или планах на ближайший отпуск.';
  }

  if (/табу|нельзя|аллерг|запрет|избегат/i.test(lowQ)) {
    return limits.length > 0
      ? `Важные ограничения и триггеры для ${person.name}:\n${limits.join('\n')}`
      : `В карточке ${person.name} пока не зафиксировано аллергий или строгих табу.`;
  }

  const qStems = extractStems(question);
  const matched = allFacts.filter((item) => {
    const fStems = extractStems(`${item.text} ${item.col}`);
    return Array.from(qStems).some((s) => fStems.has(s));
  });

  if (matched.length > 0) {
    return (
      `Найдено в досье ${person.name} по вашему запросу:\n` +
      matched.map((m) => `• [${m.col}] ${m.text}`).join('\n')
    );
  }

  return `В досье ${person.name} сейчас собрано ${allFacts.length} фактов. Попробуйте уточнить вопрос (например, про подарки, еду, встречи или табу).`;
}

export function buildDossierLocally(
  mode: 'single' | 'all',
  activePerson: Person | null,
  allPeople: Person[]
): DossierData {
  const targets = mode === 'all' ? allPeople : activePerson ? [activePerson] : [];

  if (targets.length === 0) {
    return {
      reportTitle: 'Блокнот пока пуст',
      block1Title: '1. Портрет',
      block1Text: 'В блокноте пока нет ни одной вкладки.',
      block2Title: '2. Точки контакта',
      block2Text: '—',
      block3Title: '3. Табу и ограничения',
      block3Text: '—',
      block4Title: '4. Идеи подарков',
      block4Text: '—',
      block5Title: '5. Что ещё стоит узнать',
      block5Text: 'Создайте первую вкладку с именем человека.',
      block6Title: '6. Готовые сценарии',
      block6Text: '—',
    };
  }

  if (mode === 'all') {
    const totalFactsAll = targets.reduce(
      (acc, p) => acc + p.columns.reduce((s, c) => s + c.facts.length, 0),
      0
    );

    const stemPeopleMap = new Map<string, Map<string, string>>();
    targets.forEach((p) => {
      p.columns.forEach((c) => {
        const lowTitle = c.title.toLowerCase();
        if (lowTitle.includes('не нравится') || lowTitle.includes('аллерг')) return;
        c.facts.forEach((f) => {
          extractStems(f.text).forEach((st) => {
            if (st.length < 4) return;
            if (!stemPeopleMap.has(st)) stemPeopleMap.set(st, new Map());
            const pMap = stemPeopleMap.get(st)!;
            if (!pMap.has(p.name)) pMap.set(p.name, f.text);
          });
        });
      });
    });

    const sharedLines: string[] = [];
    const usedPairs = new Set<string>();
    stemPeopleMap.forEach((pMap, stem) => {
      if (pMap.size >= 2) {
        const names = Array.from(pMap.keys());
        const pairKey = `${names.slice().sort().join('|')}:${stem}`;
        if (!usedPairs.has(pairKey) && sharedLines.length < 6) {
          usedPairs.add(pairKey);
          const details = names.map((n) => `${n} («${pMap.get(n)}»)`).join(' и ');
          sharedLines.push(`• Общая тема [${stem}]: ${details}`);
        }
      }
    });

    const jointIdeas =
      sharedLines.length > 0
        ? '• Организовать совместную встречу вокруг общих интересов, найденных выше.\n• Обменяться рекомендациями по любимым местам, книгам или хобби.'
        : '• Пока пересечений между людьми немного — добавьте больше фактов об увлечениях каждого человека, чтобы ИИ нашёл точки соприкосновения.';

    const limitsAll: string[] = [];
    targets.forEach((p) => {
      p.columns.forEach((c) => {
        const low = c.title.toLowerCase();
        if ((low.includes('аллерг') || low.includes('не нравится')) && c.facts.length > 0) {
          limitsAll.push(`• ${p.name} (${c.title}): ${c.facts.map((f) => f.text).join('; ')}`);
        }
      });
    });

    const shortCards = targets
      .map((p) => {
        const cnt = p.columns.reduce((s, c) => s + c.facts.length, 0);
        return `• ${p.name}${p.subtitle ? ` (${p.subtitle})` : ''} — категорий: ${p.columns.length}, фактов: ${cnt}.`;
      })
      .join('\n');

    return {
      reportTitle: `Общая сводка по всем людям (${targets.length} чел.)`,
      block1Title: '1. Обзор базы и статистика',
      block1Text: `В персональном блокноте собрано ${targets.length} досье и ${totalFactsAll} структурированных фактов.`,
      block2Title: '2. Общие интересы между людьми',
      block2Text:
        sharedLines.join('\n') ||
        'Явных совпадений интересов между людьми пока не найдено (или в базе только 1 человек).',
      block3Title: '3. Идеи совместных встреч и активностей',
      block3Text: jointIdeas,
      block4Title: '4. Важные ограничения и табу по базе',
      block4Text:
        limitsAll.join('\n') || 'Критичных аллергий и ограничений в базе пока не зафиксировано.',
      block5Title: '5. Краткие карточки людей',
      block5Text: shortCards,
      block6Title: '6. Рекомендации по развитию связей',
      block6Text:
        '• Регулярно пополняйте карточки после встреч — ИИ автоматически найдёт новые общие интересы для совместных мероприятий.',
    };
  }

  const p = targets[0];
  const likes: string[] = [];
  const hobbies: string[] = [];
  const character: string[] = [];
  const limits: string[] = [];
  const gifts: string[] = [];
  const extraFacts: string[] = [];

  p.columns.forEach((c) => {
    const low = c.title.toLowerCase();
    c.facts.forEach((f) => {
      if (low.includes('аллерг') || low.includes('здоров') || low.includes('не нравится')) {
        limits.push(`• [${c.title}] ${f.text}`);
      } else if (low.includes('подар')) {
        gifts.push(`• ${f.text}${f.reason ? ` (${f.reason})` : ''}`);
      } else if (low.includes('характер') || low.includes('ценност')) {
        character.push(f.text);
      } else if (low.includes('увлеч') || low.includes('мечт') || low.includes('культ')) {
        hobbies.push(f.text);
      } else if (low.includes('нравится') || low.includes('еда') || low.includes('напит') || low.includes('путешеств')) {
        likes.push(f.text);
      } else {
        extraFacts.push(`${c.title}: ${f.text}`);
      }
    });
  });

  let portrait = `${p.name}${p.subtitle ? ` — ${p.subtitle}` : ''}. `;
  if (character.length > 0) {
    portrait += `Ключевые черты и ценности: ${character.slice(0, 2).join('; ')}. `;
  }
  if (hobbies.length > 0 || likes.length > 0) {
    const coreInterests = [...hobbies, ...likes].slice(0, 3).join(', ');
    portrait += `В повседневной жизни человека вдохновляют: ${coreInterests}.`;
  } else {
    portrait += 'Карточка пока содержит базовые сведения — добавьте пару заметок после общения для более точного портрета.';
  }

  const contactPoints: string[] = [];
  [...likes, ...hobbies].slice(0, 4).forEach((item) => {
    contactPoints.push(`• Обсудить или предложить формат вокруг темы: «${item}»`);
  });
  extraFacts.slice(0, 2).forEach((item) => {
    contactPoints.push(`• Поинтересоваться новостями по теме — ${item}`);
  });

  const giftIdeas = [...gifts];
  hobbies.slice(0, 2).forEach((h) => {
    const candidate = `• Аксессуар или сертификат по теме «${h}» — вывод на основе активного увлечения`;
    if (!giftIdeas.some((existing) => compareFacts(existing, candidate) !== 'distinct')) {
      giftIdeas.push(candidate);
    }
  });

  const existingTitlesLow = p.columns.map((c) => c.title.toLowerCase());
  const suggestedQuestions: string[] = [];
  if (!existingTitlesLow.some((t) => t.includes('аллерг') || t.includes('здоров'))) {
    suggestedQuestions.push(
      '• «Есть ли у тебя какие-то пищевые аллергии или продукты, которые ты совсем не ешь?» — чтобы безопасно выбирать кафе и угощения.'
    );
  }
  if (!existingTitlesLow.some((t) => t.includes('дат') || t.includes('рожден'))) {
    suggestedQuestions.push(
      '• «Когда у тебя день рождения и как ты обычно любишь его отмечать?» — чтобы вовремя подготовить поздравление.'
    );
  }
  if (!existingTitlesLow.some((t) => t.includes('культ') || t.includes('фильм') || t.includes('книг') || t.includes('музык'))) {
    suggestedQuestions.push(
      '• «Какой фильм, книга или музыкальный альбом зацепили тебя за последнее время?» — откроет новые темы для бесед.'
    );
  }
  if (!existingTitlesLow.some((t) => t.includes('мечт') || t.includes('путешеств'))) {
    suggestedQuestions.push(
      '• «Куда бы ты мечтала/мечтал поехать в идеальный отпуск, если бы не было никаких ограничений?» — поможет узнать главные цели.'
    );
  }
  if (suggestedQuestions.length < 3) {
    suggestedQuestions.push(
      '• «Какой идеальный выходной день помогает тебе по-настоящему перезагрузиться?» — покажет глубинные привычки отдыха.'
    );
  }

  const hookTopic = likes[0] || hobbies[0] || 'любимое хобби';
  const scenarios = [
    `• Сообщение-заход: «Привет, ${p.name}! Вспомнил про тебя — видел классное место/подборку по теме «${hookTopic}». Как твоя неделя?»`,
    '• Формат встречи: спокойное место без лишнего шума, где можно комфортно пообщаться (учитывая известные предпочтения и ограничения).',
  ];

  return {
    reportTitle: `ИИ-Досье: ${p.name}`,
    block1Title: '1. Краткий психологический портрет',
    block1Text: portrait,
    block2Title: '2. Точки контакта (о чём поговорить и чем порадовать)',
    block2Text:
      contactPoints.join('\n') || '• Спросите о текущих проектах, любимых местах в городе и планах на выходные.',
    block3Title: '3. Табу, аллергии и триггеры (чего избегать)',
    block3Text: limits.join('\n') || '• Явных запретов и аллергий пока не зафиксировано.',
    block4Title: '4. Персонализированные идеи подарков и сюрпризов',
    block4Text:
      giftIdeas.join('\n') ||
      '• Добавьте немного фактов об увлечениях или мечтах, чтобы ИИ сформировал точные идеи подарков.',
    block5Title: '5. Что ещё стоит узнать (вопросы для следующей встречи)',
    block5Text: suggestedQuestions.slice(0, 4).join('\n'),
    block6Title: '6. Готовые заходы и сценарии встречи',
    block6Text: scenarios.join('\n'),
  };
}
