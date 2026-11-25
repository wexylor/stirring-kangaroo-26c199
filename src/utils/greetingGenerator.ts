import type { Person } from '../types/notebook';
import type { AppLang } from './preferences';

export type GreetingOccasion = 'birthday' | 'reconnect' | 'invite';
export type GreetingTone = 'warm' | 'friendly' | 'formal';

function collectPersonHighlights(person: Person): string[] {
  const priorityTitles = [
    'нравится',
    'увлечения',
    'еда',
    'напитки',
    'подар',
    'хочет',
    'мечт',
    'likes',
    'hobbies',
    'food',
  ];
  const highlights: string[] = [];

  for (const col of person.columns) {
    const titleLower = col.title.toLowerCase();
    if (titleLower.includes('не нрав') || titleLower.includes('аллерг') || titleLower.includes('табу')) {
      continue;
    }
    const isPriority = priorityTitles.some((kw) => titleLower.includes(kw));
    if (isPriority) {
      for (const fact of col.facts) {
        if (fact.text.trim()) highlights.push(fact.text.trim());
      }
    }
  }

  if (highlights.length === 0) {
    for (const col of person.columns) {
      if (col.title.toLowerCase().includes('не нрав')) continue;
      for (const fact of col.facts) {
        if (fact.text.trim()) highlights.push(fact.text.trim());
      }
    }
  }

  return highlights.slice(0, 3);
}

export function buildLocalGreeting(params: {
  person: Person;
  occasion: GreetingOccasion;
  tone: GreetingTone;
  lang: AppLang;
}): string {
  const { person, occasion, tone, lang } = params;
  const firstName = person.name.trim() || (lang === 'en' ? 'Friend' : 'Друг');
  const highlights = collectPersonHighlights(person);
  const topFact = highlights[0] || '';
  const secondFact = highlights[1] || '';

  if (lang === 'en') {
    if (occasion === 'birthday') {
      if (tone === 'formal') {
        const extra = topFact ? ` Wishing you great inspiration around ${topFact.toLowerCase()} and fulfilling new goals.` : '';
        return `Dear ${firstName}, happy birthday! Wishing you good health, steady success, and joyful moments all year long.${extra}`;
      }
      if (tone === 'warm') {
        const extra = topFact ? ` May this year bring more of what you love — especially ${topFact.toLowerCase()}!` : '';
        return `${firstName}, happy birthday! Thinking of you today and wishing warmth, cozy evenings, and unforgettable adventures ahead.${extra}`;
      }
      const extra = topFact ? ` Let's celebrate soon — maybe something involving ${topFact.toLowerCase()}!` : '';
      return `Hey ${firstName}! Happy birthday! Hope your day is full of good energy and favorite people.${extra}`;
    }

    if (occasion === 'invite') {
      const spotHint = topFact ? ` Thought of you because of ${topFact.toLowerCase()}.` : '';
      if (tone === 'formal') {
        return `Hello ${firstName}! Would you have time to meet for coffee or lunch this week?${spotHint} Let me know what day suits you best.`;
      }
      return `Hey ${firstName}! Let's catch up soon!${spotHint} Are you free this week or on the weekend?`;
    }

    // reconnect
    const memory = topFact ? ` Just remembered ${topFact.toLowerCase()} and realized we haven't caught up in a while.` : ` Realized we haven't talked in a while!`;
    if (tone === 'formal') {
      return `Hello ${firstName}! Hope everything is going smoothly.${memory} Would love to hear how things are going when you have a moment.`;
    }
    const extra2 = secondFact ? ` Also curious how things are with ${secondFact.toLowerCase()}.` : '';
    return `Hey ${firstName}!${memory}${extra2} How have you been?`;
  }

  if (lang === 'kk') {
    if (occasion === 'birthday') {
      if (tone === 'formal') {
        const extra = topFact ? ` Алдағы уақытта қуаныш сыйлайтын сәттер көп болсын (${topFact.toLowerCase()}).` : '';
        return `Құрметті ${firstName}, туған күніңізбен! Сізге зор денсаулық, толағай табыс және барлық бастамаларыңызға сәттілік тілеймін.${extra}`;
      }
      const extra = topFact ? ` Жақсы көретін нәрселерің көп болсын: ${topFact.toLowerCase()}!` : '';
      return `${firstName}, туған күніңмен! Әр күнің жылулыққа, шабытқа және қуанышқа толы болсын.${extra}`;
    }
    if (occasion === 'invite') {
      const hint = topFact ? ` Осы ретте: ${topFact.toLowerCase()}.` : '';
      if (tone === 'formal') {
        return `Сәлеметсіз бе, ${firstName}! Осы аптада кездесіп сөйлесуге уақытыңыз бола ма?${hint}`;
      }
      return `Сәлем, ${firstName}! Жақында кездесіп, кофе ішіп қайтсақ қалай қарайсың?${hint} Қай күн ыңғайлы?`;
    }
    const mem = topFact ? ` Жақында есіме «${topFact}» түсіп кетті.` : '';
    return `Сәлем, ${firstName}! Көптен бері хабарласпай кеттік.${mem} Қалың қалай, не жаңалық бар?`;
  }

  // Russian (default)
  if (occasion === 'birthday') {
    if (tone === 'formal') {
      const extra = topFact
        ? ` Желаю, чтобы всегда оставалось время на то, что по-настоящему радует (например, ${topFact.toLowerCase()}).`
        : '';
      return `${firstName}, примите искренние поздравления с днём рождения! Крепкого здоровья, вдохновения, ярких проектов и гармоничного года.${extra}`;
    }
    if (tone === 'warm') {
      const extra = topFact
        ? ` Пусть в новом году будет побольше уютных поводов для радости — в том числе и таких, как ${topFact.toLowerCase()}!`
        : '';
      return `${firstName}, с днём рождения! Обнимаю и желаю, чтобы каждый день приносил спокойствие, тепло рядом с близкими и исполнение заветных планов.${extra}`;
    }
    const extra = topFact
      ? ` Обязательно нужно отметить — с меня что-нибудь в духе «${topFact}»!`
      : '';
    return `Привет, ${firstName}! С днём рождения! Крутых впечатлений, отличного настроения и чтобы всё задуманное складывалось легко.${extra}`;
  }

  if (occasion === 'invite') {
    const contextHint = topFact
      ? ` Как раз подумал(а) про тебя в контексте: ${topFact.toLowerCase()}.`
      : '';
    if (tone === 'formal') {
      return `Здравствуйте, ${firstName}! Буду рад(а) увидеться и пообщаться лично на этой неделе.${contextHint} Подскажите, какой день и формат будут удобны?`;
    }
    if (tone === 'warm') {
      return `${firstName}, привет! Давно не виделись — очень хочется встретиться в спокойном месте, попить чай или кофе и поболтать.${contextHint} Как насчёт этих выходных или буднего вечера?`;
    }
    return `Привет, ${firstName}! Давай выберемся куда-нибудь на этой неделе!${contextHint} Когда тебе удобнее пересечься?`;
  }

  // reconnect
  const reasonLine = topFact
    ? ` Сегодня вспомнил(а) про «${topFact}» и сразу подумал(а) о тебе.`
    : '';
  const followUp = secondFact ? ` Как, кстати, дела с темой «${secondFact}»?` : '';
  if (tone === 'formal') {
    return `Здравствуйте, ${firstName}! Давно не списывались — надеюсь, у вас всё отлично.${reasonLine} Буду рад(а) узнать, как продвигаются дела.`;
  }
  if (tone === 'warm') {
    return `${firstName}, привет! Поймал(а) себя на мысли, что мы уже давно не общались.${reasonLine}${followUp} Как ты, что нового в жизни?`;
  }
  return `Привет, ${firstName}! Сто лет не списывались!${reasonLine}${followUp} Рассказывай, как дела?`;
}
