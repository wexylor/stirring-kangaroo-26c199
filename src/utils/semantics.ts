import type { DossierData, FactTag, Person } from '../types/notebook';
import type { AppLang } from './preferences';
import { parseChatTranscript } from './chatParser';

const STOPWORDS = new Set([
  // Russian
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она', 'так',
  'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'её', 'мне', 'было',
  'вот', 'от', 'меня', 'еще', 'ещё', 'нет', 'о', 'об', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну', 'ли',
  'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'опять', 'вам', 'ведь', 'там',
  'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы',
  'тебя', 'их', 'чем', 'была', 'сам', 'сама', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под',
  'будет', 'тогда', 'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'какая', 'какие', 'совсем', 'ним', 'здесь',
  'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'неё', 'сейчас', 'были', 'куда', 'зачем', 'всех', 'можно',
  'при', 'наконец', 'другой', 'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас',
  'про', 'всего', 'них', 'много', 'эту', 'моя', 'впрочем', 'хорошо', 'свою', 'этой', 'перед',
  'иногда', 'лучше', 'чуть', 'том', 'нельзя', 'такой', 'им', 'более', 'всегда', 'конечно', 'всю',
  'очень', 'сильно', 'сильный', 'сильная', 'крайне', 'безумно', 'дико', 'жутко', 'ужасно', 'невероятно',
  'прямо', 'буквально', 'действительно', 'пожалуй', 'наверное', 'кажется', 'вообще', 'именно', 'особенно',
  'просто', 'кстати', 'оказывается', 'сегодня', 'вчера', 'позавчера', 'давно', 'пока',
  'дома', 'живет', 'живёт', 'который', 'которая', 'которое', 'которые', 'которой', 'которых', 'которую',
  'это', 'этом', 'этим', 'свой', 'своей', 'своих', 'этих', 'такие', 'такая', 'такое',
  // Kazakh
  'және', 'мен', 'бен', 'пен', 'ол', 'бұл', 'осы', 'сол', 'үшін', 'туралы', 'сияқты',
  'өте', 'қатты', 'қазір', 'бүгін', 'кеше', 'ертең', 'көп', 'аз', 'бар', 'жоқ', 'екен',
  'дейді', 'деп', 'да', 'де', 'та', 'те', 'ғой', 'ой', 'ішінде', 'бірге', 'тура', 'кейде',
  'ылғи', 'әрқашан', 'ешқашан', 'менде', 'онда', 'оның', 'оған', 'оны', 'менің', 'сенің',
  'біз', 'сіз', 'олар', 'енді', 'әлі', 'тек', 'мүлдем', 'ерекше', 'тіпті', 'жәй',
  // English
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'i', 'you',
  'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
  'their', 'our', 'and', 'or', 'but', 'if', 'so', 'very', 'really', 'quite', 'extremely',
  'super', 'actually', 'today', 'yesterday', 'tomorrow', 'with', 'for', 'about', 'from',
  'to', 'in', 'on', 'at', 'of', 'by', 'that', 'this', 'these', 'those', 'has', 'have',
  'had', 'do', 'does', 'did', 'into', 'onto', 'just', 'also', 'too', 'still', 'always',
  'sometimes', 'often', 'home', 'lives', 'live', 'who', 'which', 'what', 'when', 'where',
]);

interface StemGroup {
  canon: string;
  exact?: string[];
  prefixes?: string[];
}

const CANONICAL_STEM_GROUPS: StemGroup[] = [
  // Единая ось отношения/вкуса: полярность (+1 / -1) различает позитивное и негативное отношение
  {
    canon: 'любить',
    exact: [
      'радует', 'радуют', 'души', 'симпат', 'ценит', 'ценят', 'ценил', 'ценила', 'полюб',
      'құмар', 'риза', 'жақсы', 'like', 'likes', 'liked', 'love', 'loves', 'loved', 'fond', 'keen',
    ],
    prefixes: [
      // RU
      'люб', 'обожа', 'полюб', 'нрав', 'понрав', 'фанат', 'восторг', 'кайф', 'тащитс',
      'предпочита', 'боготвор', 'увлека', 'хобб', 'пристраст',
      'ненавид', 'раздража', 'взбес', 'бесит', 'бесят', 'бесил',
      'вынос', 'перенос', 'переварива', 'отвращ', 'напряга', 'утомля',
      // KK
      'ұнат', 'сүй', 'қызығ', 'қалай', 'жек', 'тітіркен', 'жеркен', 'шаршат', 'жақтыр', 'жүйке',
      // EN
      'lov', 'ador', 'enjoy', 'lik', 'prefer', 'crazi', 'obsess', 'passion',
      'hat', 'dislik', 'detest', 'loath', 'annoy', 'irritat', 'despis', 'stand',
    ],
  },
  {
    canon: 'бег',
    prefixes: ['бег', 'бега', 'пробеж', 'марафон', 'джоггинг', 'жүгір', 'run', 'jog'],
  },
  {
    canon: 'утро',
    prefixes: ['утр', 'утрен', 'рассвет', 'жаворон', 'таң', 'таңертең', 'morn'],
  },
  {
    canon: 'вечер',
    prefixes: ['вечер', 'вечерн', 'ноч', 'кеш', 'түн', 'even', 'night'],
  },
  {
    canon: 'кофе',
    exact: ['кофе', 'coffee'],
    prefixes: ['раф', 'латт', 'капучин', 'американо', 'эспрессо', 'мокко', 'coffe', 'latte', 'cappuccin', 'espresso'],
  },
  {
    canon: 'кофейня',
    prefixes: ['кофейн', 'кафе', 'cafe'],
  },
  {
    canon: 'чай',
    exact: ['чай', 'чая', 'чаю', 'чаем', 'чае', 'чаек', 'шай', 'tea'],
    prefixes: ['матч', 'улун', 'пуэр', 'эрл', 'чаепит', 'шай', 'matcha', 'oolong'],
  },
  {
    canon: 'алкоголь',
    exact: ['вино', 'вина', 'вину', 'вином', 'вине', 'пиво', 'пива', 'пивом', 'шарап', 'сыра', 'wine', 'beer'],
    prefixes: ['винн', 'пивн', 'коктейл', 'шампанск', 'виски', 'алкогол', 'спиртн', 'сидр', 'cocktail', 'whiske', 'alcohol'],
  },
  {
    canon: 'сладкое',
    prefixes: ['сладк', 'сладост', 'десерт', 'торт', 'пирожн', 'шоколад', 'конфет', 'выпечк', 'печень', 'морожен', 'тәтті', 'кәмпит', 'балмұздақ', 'sweet', 'dessert', 'cake', 'chocolat', 'cand', 'pastr'],
  },
  {
    canon: 'кот',
    exact: ['кот', 'кота', 'коту', 'котом', 'коте', 'котя', 'котик', 'кошечк', 'мысық', 'cat', 'cats'],
    prefixes: ['кошк', 'котен', 'котищ', 'мурлы', 'мысық', 'kitt'],
  },
  {
    canon: 'собака',
    exact: ['пес', 'пса', 'псу', 'псом', 'псе', 'ит', 'dog', 'dogs'],
    prefixes: ['собак', 'щен', 'песик', 'корги', 'овчарк', 'лабрадор', 'шпиц', 'күшік', 'pup', 'corg'],
  },
  {
    canon: 'питомец',
    prefixes: ['питом', 'животн', 'звер', 'жануар', 'pet', 'animal'],
  },
  {
    canon: 'аллергия',
    prefixes: ['аллерг', 'неперенос', 'противопоказан', 'диатез', 'төзбе', 'allerg', 'intoleran'],
  },
  {
    canon: 'мечта',
    prefixes: ['мечт', 'хочет', 'хотел', 'жела', 'грезит', 'стремитс', 'арман', 'қалау', 'мақсат', 'dream', 'wish', 'goal', 'want'],
  },
  {
    canon: 'поездка',
    prefixes: ['поехат', 'съездит', 'слетат', 'путешеств', 'поездк', 'отпуск', 'туризм', 'турист', 'заграниц', 'саяхат', 'сапар', 'демал', 'travel', 'trip', 'vacat', 'journey'],
  },
  {
    canon: 'горы',
    exact: ['гор', 'горы', 'горам', 'горах', 'горами', 'тау'],
    prefixes: ['горн', 'поход', 'треккинг', 'кемпинг', 'альпинизм', 'палатк', 'тау', 'mount', 'hik', 'camp'],
  },
  {
    canon: 'море',
    exact: ['море', 'моря', 'морю', 'морем', 'теңіз', 'sea'],
    prefixes: ['морск', 'пляж', 'океан', 'побережь', 'теңіз', 'жағажай', 'beach', 'ocean'],
  },
  {
    canon: 'пунктуальность',
    prefixes: ['пунктуальн', 'заранее', 'воврем', 'опазд', 'опозд', 'кешік', 'punctual'],
  },
  {
    canon: 'планы',
    prefixes: ['план', 'планир', 'расписан', 'структур', 'системн', 'организован', 'жоспар', 'schedul', 'organiz'],
  },
  {
    canon: 'тишина',
    prefixes: ['тих', 'тишин', 'спокойн', 'уютн', 'камерн', 'уединен', 'тыныш', 'quiet', 'calm', 'coz', 'silenc', 'peac'],
  },
  {
    canon: 'шум',
    exact: ['шу'],
    prefixes: ['шум', 'громк', 'толп', 'сует', 'многолюд', 'даңғаза', 'nois', 'loud', 'crowd'],
  },
  {
    canon: 'фото',
    prefixes: ['фот', 'фотограф', 'снима', 'камер', 'пленк', 'пленочн', 'объектив', 'сурет', 'camera', 'photo'],
  },
  {
    canon: 'музыка',
    exact: ['ән'],
    prefixes: ['музык', 'песн', 'трек', 'слуша', 'альбом', 'концерт', 'плейлист', 'винил', 'тыңда', 'music', 'song', 'listen', 'jazz', 'vinyl', 'concert'],
  },
  {
    canon: 'книги',
    prefixes: ['книг', 'чита', 'чтен', 'роман', 'литератур', 'поэз', 'писател', 'кітап', 'оқу', 'оқи', 'book', 'read', 'novel', 'literat'],
  },
  {
    canon: 'кино',
    prefixes: ['кин', 'фильм', 'режиссер', 'кинотеатр', 'movi', 'cinema', 'film'],
  },
  {
    canon: 'сериалы',
    prefixes: ['сериал', 'дорама', 'ситком', 'series', 'drama'],
  },
  {
    canon: 'йога',
    prefixes: ['йог', 'стретчинг', 'растяжк', 'пилатес', 'медитац', 'yoga', 'stretch', 'meditat', 'pilat'],
  },
  {
    canon: 'спортзал',
    prefixes: ['спортзал', 'фитнес', 'тренажер', 'тренировк', 'спорт', 'качал', 'жаттығ', 'gym', 'fitness', 'workout', 'sport'],
  },
  {
    canon: 'велосипед',
    prefixes: ['велосипед', 'велик', 'велопрогул', 'bicycl', 'bike', 'cycl'],
  },
  {
    canon: 'мясо',
    exact: ['ет', 'meat'],
    prefixes: ['мяс', 'стейк', 'говядин', 'свинин', 'куриц', 'шашлык', 'steak', 'beef', 'chicken'],
  },
  {
    canon: 'вегетарианство',
    prefixes: ['вегетариан', 'веган', 'растительн', 'vegetarian', 'vegan'],
  },
  {
    canon: 'подарок',
    prefixes: ['подар', 'подарит', 'презент', 'сюрприз', 'вишлист', 'сыйлық', 'gift', 'present', 'surpris', 'wishlist'],
  },
  {
    canon: 'день_рождения',
    prefixes: ['рожден', 'именин', 'деньрожден', 'туғанкүн', 'birthday', 'bday'],
  },
  {
    canon: 'работа',
    prefixes: ['работ', 'професс', 'должност', 'карьер', 'специальност', 'трудитс', 'жұмыс', 'мамандық', 'қызмет', 'work', 'job', 'career', 'design', 'develop', 'manag'],
  },
  {
    canon: 'учеба',
    prefixes: ['учитс', 'учеб', 'обучен', 'изуча', 'осваива', 'университет', 'институт', 'оқу', 'универ', 'үйрен', 'stud', 'learn', 'universit'],
  },
  {
    canon: 'друзья',
    prefixes: ['друг', 'друз', 'подруг', 'приятел', 'товарищ', 'дос', 'құрбы', 'friend', 'budd'],
  },
  {
    canon: 'семья',
    prefixes: ['семь', 'родствен', 'родн', 'отбасы', 'жанұя', 'famil', 'parent', 'sister', 'brother'],
  },
  {
    canon: 'страх',
    prefixes: ['боитс', 'страх', 'фоби', 'пуга', 'тревож', 'қорқ', 'үрей', 'fear', 'afraid', 'scar', 'phob'],
  },
];

const LETTER_BOUNDARY_L = '(?:^|[^а-яәғқңөұүһіa-z])';
const LETTER_BOUNDARY_R = '(?=$|[^а-яәғқңөұүһіa-z])';

const SYNONYM_PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  // Russian
  [new RegExp(`${LETTER_BOUNDARY_L}(?:без\\s+ума\\s+от|в\\s+восторге\\s+от|приходит\\s+в\\s+восторг\\s+от|души\\s+не\\s+чает\\s+в|с\\s+ума\\s+сходит\\s+по|тащится\\s+от|кайфует\\s+от|фанатеет\\s+от|очень\\s+по\\s+душе|по\\s+вкусу)${LETTER_BOUNDARY_R}`, 'gi'), ' любит '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:терпеть\\s+не\\s+может|на\\s+дух\\s+не\\s+переносит|не\\s+выносит|не\\s+переносит|не\\s+переваривает|воротит\\s+от|тошнит\\s+от|выводит\\s+из\\s+себя|действует\\s+на\\s+нервы|не\\s+по\\s+душе|не\\s+в\\s+восторге\\s+от|охладел[а]?\\s+к|равнодуш(?:ен|на)\\s+к|испытывает\\s+отвращение\\s+к)${LETTER_BOUNDARY_R}`, 'gi'), ' не любит '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:приходит\\s+заранее|приходит\\s+вовремя|никогда\\s+не\\s+опаздывает|без\\s+опозданий|ценит\\s+точность)${LETTER_BOUNDARY_R}`, 'gi'), ' пунктуальный '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:домашн(?:ее|ий|их|ие)\\s+(?:животн(?:ое|ые|ых)|питом(?:ец|цы|цев)))${LETTER_BOUNDARY_R}`, 'gi'), ' питомец '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:ходит\\s+в\\s+(?:зал|спортзал|качалку)|ходит\\s+на\\s+фитнес|занимается\\s+(?:спортом|в\\s+зале|фитнесом))${LETTER_BOUNDARY_R}`, 'gi'), ' спортзал '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:занимается\\s+бегом|выходит\\s+на\\s+пробежку)${LETTER_BOUNDARY_R}`, 'gi'), ' бег '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:день\\s+рождения|днюха)${LETTER_BOUNDARY_R}`, 'gi'), ' деньрождения '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:пищевая\\s+непереносимость|вызывает\\s+аллергию)${LETTER_BOUNDARY_R}`, 'gi'), ' аллергия '],
  // Kazakh
  [new RegExp(`${LETTER_BOUNDARY_L}(?:жақсы\\s+көреді|жақсы\\s+көред|қатты\\s+ұнатады|ерекше\\s+ұнатады|құмар\\s+екен|өте\\s+ұнатады|керемет\\s+көреді)${LETTER_BOUNDARY_R}`, 'gi'), ' любит '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:жек\\s+көреді|жек\\s+көред|көргісі\\s+келмейді|төзе\\s+алмайды|жынына\\s+тиеді|жүйкесіне\\s+тиеді|жақтырмайды|ұнатпайды|тітіркендіреді)${LETTER_BOUNDARY_R}`, 'gi'), ' не любит '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:аллергиясы\\s+бар|жақпайды)${LETTER_BOUNDARY_R}`, 'gi'), ' не аллергия '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:үй\\s+жануары|үй\\s+жануарлары)${LETTER_BOUNDARY_R}`, 'gi'), ' питомец '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:туған\\s+күні|туған\\s+күн)${LETTER_BOUNDARY_R}`, 'gi'), ' деньрождения '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:спортпен\\s+айналысады|залға\\s+барады)${LETTER_BOUNDARY_R}`, 'gi'), ' спортзал '],
  // English
  [new RegExp(`${LETTER_BOUNDARY_L}(?:crazy\\s+about|obsessed\\s+with|in\\s+love\\s+with|passionate\\s+about|big\\s+fan\\s+of|fond\\s+of|keen\\s+on|really\\s+enjoys|loves|adores|enjoys|prefers)${LETTER_BOUNDARY_R}`, 'gi'), ' любит '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:can't\\s+stand|cannot\\s+stand|sick\\s+of|tired\\s+of|not\\s+a\\s+fan\\s+of|doesn't\\s+like|don't\\s+like|hates|dislikes|detests|loathes|irritates|annoys)${LETTER_BOUNDARY_R}`, 'gi'), ' не любит '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:allergic\\s+to|intolerant\\s+to|intolerance\\s+to)${LETTER_BOUNDARY_R}`, 'gi'), ' не аллергия '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:works\\s+out|goes\\s+to\\s+the\\s+gym)${LETTER_BOUNDARY_R}`, 'gi'), ' спортзал '],
  [new RegExp(`${LETTER_BOUNDARY_L}(?:domestic\\s+animal)${LETTER_BOUNDARY_R}`, 'gi'), ' питомец '],
];

export function normalizeSynonymousPhrases(text: string): string {
  let res = String(text || '').toLowerCase().replace(/ё/g, 'е');
  for (const [rx, replacement] of SYNONYM_PHRASE_REPLACEMENTS) {
    res = res.replace(rx, replacement);
  }
  return res.replace(/\s+/g, ' ').trim();
}

export function stemRu(word: string): string {
  let w = String(word || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яәғқңөұүһіa-z0-9-]/g, '');
  if (w.length <= 3) return w;

  // English pure ASCII light stemming
  if (/^[a-z-]+$/.test(w)) {
    const enSuffixes = ['ingly', 'edly', 'ing', 'ies', 'ied', 'es', 'ed', 'ly'];
    for (const suf of enSuffixes) {
      if (w.endsWith(suf) && w.length - suf.length >= 3) {
        w = w.slice(0, w.length - suf.length);
        return w;
      }
    }
    if (w.endsWith('s') && !w.endsWith('ss') && w.length >= 4) {
      w = w.slice(0, -1);
    }
    return w;
  }

  // Kazakh suffixes (always strip unambiguous agglutinative suffixes; strip short -ы/-і only if word contains Kazakh chars)
  const hasKazakhChar = /[әғқңөұүһі]/.test(w);
  const kkSuffixes = [
    'ларымен', 'лерімен', 'дарымен', 'дерімен', 'тарымен', 'терімен',
    'ларында', 'лерінде', 'дарында', 'дерінде', 'тарында', 'терінде',
    'ларын', 'лерін', 'дарын', 'дерін', 'тарын', 'терін',
    'лар', 'лер', 'дар', 'дер', 'тар', 'тер',
    'ның', 'нің', 'дың', 'дің', 'тың', 'тің',
    'нан', 'нен', 'дан', 'ден', 'тан', 'тен',
    'мен', 'бен', 'пен',
    'ға', 'ге', 'қа', 'ке',
    'ды', 'ді', 'ты', 'ті',
    'сы', 'сі',
    ...(hasKazakhChar ? ['да', 'де', 'та', 'те', 'ы', 'і'] : []),
  ];
  for (const suf of kkSuffixes) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      w = w.slice(0, w.length - suf.length);
      return w;
    }
  }

  const ruSuffixes = [
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

  for (const suf of ruSuffixes) {
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

export function canonicalizeStem(stem: string, rawWord?: string): string {
  const w = String(rawWord || stem).toLowerCase().replace(/ё/g, 'е');
  for (const grp of CANONICAL_STEM_GROUPS) {
    if (grp.exact && (grp.exact.includes(w) || grp.exact.includes(stem))) {
      return grp.canon;
    }
    if (grp.prefixes && grp.prefixes.some((r) => stem === r || stem.startsWith(r) || w.startsWith(r))) {
      return grp.canon;
    }
  }
  return stem;
}

export function extractStems(text: string): Set<string> {
  const phrased = normalizeSynonymousPhrases(text);
  const words = phrased
    .split(/[^а-яәғқңөұүһіa-z0-9-]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  const result = new Set<string>();
  for (const rawWord of words) {
    const stemmed = stemRu(rawWord);
    if (stemmed.length < 2 || STOPWORDS.has(stemmed)) continue;
    result.add(canonicalizeStem(stemmed, rawWord));
  }
  return result;
}

export function detectPolarity(text: string): -1 | 1 {
  const low = normalizeSynonymousPhrases(text);
  const hasNeg = new RegExp(
    `${LETTER_BOUNDARY_L}(?:` +
      // RU
      `не|нет|никогда|без|отказал(?:ся|ась)\\s+от|бросил[а]?|перестал[а]?|больше\\s+не|терпеть\\s+не\\s+может|ненавид[а-я]*|раздража[а-я]*|бесит|бесят|бесил[а]?|взбес[а-я]*|не\\s+вынос[а-я]*|не\\s+перенос[а-я]*|не\\s+переварива[а-я]*|избега[а-я]*|аллерг[а-я]*|непереносим[а-я]*|противопоказан[а-я]*|охладел[а]?\\s+к|равнодуш(?:ен|на)|` +
      // KK
      `жоқ|емес|ұнатпай[а-яәғқңөұүһі]*|жақтырмай[а-яәғқңөұүһі]*|жек\\s+көр[а-яәғқңөұүһі]*|төз(?:е|бе)[а-яәғқңөұүһі]*|қаламай[а-яәғқңөұүһі]*|бас\\s+тарт[а-яәғқңөұүһі]*|тастад[а-яәғқңөұүһі]*|ішпей[а-яәғқңөұүһі]*|жемей[а-яәғқңөұүһі]*|` +
      // EN
      `not|no|never|without|doesn't|don't|didn't|won't|can't|cannot|hate[a-z]*|dislike[a-z]*|detest[a-z]*|loathe[a-z]*|allergic|intoleran[a-z]*|avoid[a-z]*|quit|stopped|gave\\s+up|annoy[a-z]*|irritat[a-z]*` +
    `)(?=$|[^а-яәғқңөұүһіa-z])`,
    'i'
  ).test(low);
  return hasNeg ? -1 : 1;
}

function getCharNgrams(text: string, n: number): Set<string> {
  const clean = String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яәғқңөұүһіa-z0-9\s]/g, '')
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

  const GENERIC_ATTITUDE_STEMS = new Set(['любить']);
  const topicStemsA = new Set(Array.from(stemsA).filter((s) => !GENERIC_ATTITUDE_STEMS.has(s)));
  const topicStemsB = new Set(Array.from(stemsB).filter((s) => !GENERIC_ATTITUDE_STEMS.has(s)));

  let intersection = 0;
  stemsB.forEach((s) => {
    if (stemsA.has(s)) intersection++;
  });

  let topicIntersection = 0;
  topicStemsB.forEach((s) => {
    if (topicStemsA.has(s)) topicIntersection++;
  });

  const bothHaveTopics = topicStemsA.size > 0 && topicStemsB.size > 0;
  if (bothHaveTopics && topicIntersection === 0) {
    return charDiceSimilarity(a, b) >= 0.72 ? (polA === polB ? 'duplicate' : 'contradict') : 'distinct';
  }

  const union = stemsA.size + stemsB.size - intersection;
  const jaccard = union > 0 ? intersection / union : 0;
  const recallOfExisting = intersection / stemsA.size;
  const recallOfCandidate = intersection / stemsB.size;
  const maxRecall = Math.max(recallOfExisting, recallOfCandidate);
  const dice3 = charDiceSimilarity(a, b);

  // Check contradiction: opposite polarity with meaningful semantic overlap (not only generic 'любить')
  if (
    polA !== polB &&
    intersection >= 1 &&
    (!bothHaveTopics || topicIntersection >= 1) &&
    (maxRecall >= 0.5 || dice3 >= 0.45 || (intersection >= 2 && jaccard >= 0.3))
  ) {
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
    (Math.min(stemsA.size, stemsB.size) >= 2 && maxRecall >= 0.72) ||
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

  for (const col of person.columns) {
    for (const existing of col.facts) {
      if (compareFacts(existing.text, candidateText) === 'contradict') {
        return { type: 'contradict' as const, col, fact: existing };
      }
    }
  }

  const hasChangeMarker =
    /(?:теперь|переш[её]л на|перешла на|отказал(?:ся|ась) от|больше не|вместо|бросил[а]?|сменил[а]?|пь[её]т только|перестал[а]?|енді|ауыст|бас тарт|тастад|орнына|тек .* ішед|now |switched to|gave up|quit |no longer|instead of|drinks only|stopped )/i.test(
      candidateText
    );
  const newStems = extractStems(candidateText);
  const EXACT_DOMAIN_STEMS = new Set(['кофе', 'чай', 'вегетарианство', 'мясо', 'работа']);
  const matchesDomainToken = (stems: Set<string>, token: string) =>
    EXACT_DOMAIN_STEMS.has(token)
      ? stems.has(token)
      : Array.from(stems).some((s) => s.startsWith(token));
  const domainPairs = [
    ['кофе', 'чай'],
    ['вегетарианство', 'мясо'],
    ['живет', 'переехал', 'город', 'квартир', 'көш', 'қала', 'moved', 'city'],
    ['работа', 'уволил', 'компан', 'жұмыс', 'work', 'job', 'compan'],
  ];

  if (hasChangeMarker && newStems.size > 0) {
    for (const col of person.columns) {
      for (const existing of col.facts) {
        const oldStems = extractStems(existing.text);
        let overlap = 0;
        newStems.forEach((s) => {
          if (s !== 'любить' && oldStems.has(s)) overlap++;
        });

        let sameDomain = overlap >= 1;
        if (!sameDomain) {
          domainPairs.forEach((group) => {
            const hasNew = group.some((g) => matchesDomainToken(newStems, g));
            const hasOld = group.some((g) => matchesDomainToken(oldStems, g));
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
    /^(?:сегодня|вчера|позавчера|недавно|на днях|кстати|оказывается|как выяснилось|на самом деле|вообще|бүгін|кеше|жақында|айта кетсек|шынында|негізі|today|yesterday|recently|by the way|actually|turns out)[,\s]+/i,
    /^(?:долго\s+)?(?:болтали|поболтали|говорили|поговорили|общались|переписывались|встречались)\s+с\s+[А-ЯЁӘҒҚҢӨҰҮҺІA-Za-z-]+[.,!\s]*/i,
    /^(?:я\s+)?(?:узнал[а]?|выяснил[а]?|заметил[а]?|понял[а]?|вспомнил[а]?|услышал[а]?)[,\s]+что\s+/i,
    /^(?:ещё|также|кроме того|плюс ко всему|а ещё|сондай-ақ|тағы да|also|besides|plus)\s+/i,
  ];
  leadIns.forEach((rx) => {
    s = s.replace(rx, '').trim();
  });

  if (personName) {
    const escapedName = personName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePrefixRx = new RegExp(
      `^${escapedName}\\s+(?:признал(?:ся|ась),\\s+что|поделил(?:ся|ась),\\s+что|сказал[а]?,\\s+что|рассказал[а]?,\\s+что|отметил[а]?,\\s+что|говорит,\\s+что|айтуынша|деді|said(?:\\s+that)?|mentioned(?:\\s+that)?|told\\s+me(?:\\s+that)?)\\s+`,
      'i'
    );
    s = s.replace(namePrefixRx, '').trim();
    const plainNameRx = new RegExp(`^${escapedName}\\s+`, 'i');
    s = s.replace(plainNameRx, '').trim();
  }

  s = s
    .replace(/^(?:он|она|ол|he|she|they)\s+(?:недавно\s+|жақында\s+|recently\s+)?/i, '')
    .replace(/^у\s+(?:неё|него)\s+(?:сильная\s+|есть\s+)?/i, '')
    .replace(/^оның\s+/i, '')
    .replace(/^дома\s+у\s+(?:неё|него)\s+жив[её]т\s+/i, 'Дома живёт ')
    .replace(/^всё\s+время\s+/i, 'Всегда ')
    .trim();

  if (s.length < 3) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function splitSentenceIntoSmartClauses(sentence: string, personName: string): string[] {
  const clauseBoundary =
    /(?:,\s*(?=а вот|а\s+|но |а ещё|ещё |также |кроме того|зато |при этом|однако |бірақ |ал |сондай-ақ|but |however |also |а осенью|а летом|а зимой|а весной|а по |увлекается|обожает|любит|не любит|нравится|не нравится|в восторге|без ума|души не чает|с ума сходит|тащится|кайфует|ненавидит|раздражает|бесит|бесят|напрягает|утомляет|воротит|избегает|терпеть не может|на дух не переносит|не выносит|не переносит|не переваривает|предпочитает|коллекционирует|фанатеет|боится|мечтает|планирует|ұнатады|жақсы көреді|жек көреді|ұнатпайды|қалайды|армандайды|жоспарлайды|қорқады|loves |adores |enjoys |hates |dislikes |detests |can't stand |cannot stand |prefers |is allergic to |allergic to |dreams of )|;\s*|\s+(?:и теперь|және енді|and now)\s+|\s+(?:и|және|and) (?=(?:строит|бегает|работает|любит|не любит|хочет|мечтает|планирует|увлекается|коллекционирует|занимается|обожает|в восторге|без ума|души не чает|ненавидит|водит|учится|жив[её]т|пь[её]т|ест|предпочитает|фанатеет|тащится|кайфует|терпеть не может|на дух не переносит|не выносит|не переносит|раздражает|бесит|избегает|боится|читает|смотрит|слушает|готовит|путешествует|ұнатады|жек көреді|ішеді|жейді|оқиды|көреді|тыңдайды|жүгіреді|жұмыс істейді|loves|adores|enjoys|hates|dislikes|detests|can't stand|cannot stand|prefers|is allergic|allergic|drinks|eats|reads|watches|listens|runs|works|plans|dreams)\b))/i;

  const rawParts = sentence.split(clauseBoundary);

  const merged: string[] = [];
  for (const rawPart of rawParts) {
    const part = rawPart.trim();
    if (!part) continue;

    const isDependentQualifier =
      /^(?:но\s+пока|пока\s+не|потому\s+что|так\s+как|хотя\s+пока|но\s+очень\s+редко|бірақ\s+әзірге|өйткені|because|but\s+rarely)/i.test(part);
    if (isDependentQualifier && merged.length > 0) {
      const cleanTail = part.replace(/^(?:но|бірақ|but)\s+/i, '').trim();
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
  allPeople: Person[] = [],
  lang: AppLang = 'ru'
): AnalysisResultPayload {
  const chatParsed = parseChatTranscript(rawText, person.name);
  const textToAnalyze = chatParsed.isChat && chatParsed.cleanedText
    ? chatParsed.cleanedText
    : rawText;

  const categories = [
    {
      title: 'Аллергии и здоровье',
      icon: '🩺',
      stems: ['аллергия', 'вегетарианство', 'лактоз', 'глютен', 'диет', 'здоров', 'таблетк', 'давлен', 'витамин'],
      patterns: [
        /аллерг/i,
        /(?<!на дух )не перенос(?:ит|ят)\s+(?:лактоз|глютен|молок|орех|арахис|мед|мёд|цитрус|пищ|еду|продукты)/i,
        /противопоказан/i,
        /нельзя есть/i,
        /вегетариан/i,
        /веган/i,
        /непереносим/i,
        /аллергиясы бар/i,
        /жақпайды/i,
        /allergic\s+to/i,
        /intoleran/i,
      ],
    },
    {
      title: 'Еда и напитки',
      icon: '☕',
      stems: [
        'кофе', 'чай', 'алкоголь', 'сладкое', 'мясо', 'еда', 'кухн', 'пицц', 'суш', 'паст',
        'напит', 'молок', 'овсян',
      ],
      patterns: [
        /кофе/i, /раф/i, /матч/i, /\bчай\b/i, /\bчая\b/i, /\bшай/i, /напит/i, /блюд/i,
        /пь[её]т/i, /ест\b/i, /отказал(?:ся|ась) от кофе/i, /сладк/i, /десерт/i, /тәтті/i,
        /ішеді/i, /жейді/i, /coffee/i, /\btea\b/i, /matcha/i, /drinks\b/i, /eats\b/i, /dessert/i,
      ],
    },
    {
      title: 'Питомцы',
      icon: '🐾',
      stems: ['кот', 'собака', 'питомец', 'попуга', 'хомяк', 'кличк'],
      patterns: [/\bкот\b/i, /кошк/i, /собак/i, /питом/i, /кличк/i, /домашн(?:ее|ий) животн/i, /мысық/i, /\bит\b/i, /үй жануар/i, /\bcat\b/i, /\bdog\b/i, /\bpet\b/i],
    },
    {
      title: 'Семья и окружение',
      icon: '👨‍👩‍👧',
      stems: ['семья', 'друзья', 'мам', 'пап', 'родител', 'брат', 'сестр', 'муж', 'жен', 'сын', 'доч', 'бабушк', 'дедушк', 'познакомил'],
      patterns: [/мама/i, /папа/i, /родител/i, /сестр/i, /брат\b/i, /семь/i, /дружит с/i, /отбасы/i, /досы/i, /family/i, /sister/i, /brother/i, /friend/i],
    },
    {
      title: 'Мечты и цели',
      icon: '🚀',
      stems: ['мечта', 'цел', 'науч', 'поступ', 'переехат', 'побыват', 'увидет', 'достич'],
      patterns: [/мечтает/i, /хочет научиться/i, /поставил[а]? цель/i, /давно хочет/i, /грезит/i, /армандай/i, /мақсат/i, /dreams? (?:of|to)/i, /wants? to learn/i],
    },
    {
      title: 'Путешествия',
      icon: '✈️',
      stems: ['поездка', 'горы', 'море', 'япон', 'киот', 'токи', 'итал', 'исланд', 'маршрут', 'стран'],
      patterns: [/путешеств/i, /поехать в/i, /съездить в/i, /слетать/i, /япони/i, /киото/i, /саяхат/i, /сапар/i, /travel/i, /trip to/i, /visit/i],
    },
    {
      title: 'Культура и медиа',
      icon: '🎬',
      stems: ['кино', 'сериалы', 'книги', 'музыка', 'нолан', 'инди', 'джаз', 'рок', 'аниме', 'игр', 'укулел', 'гитар'],
      patterns: [/фильм/i, /сериал/i, /книг/i, /музык/i, /слушает/i, /смотрит/i, /читает/i, /играть на/i, /кітап/i, /тыңдайды/i, /оқиды/i, /movie/i, /book/i, /music/i, /reads/i, /listens/i],
    },
    {
      title: 'Привычки и режим',
      icon: '⏰',
      stems: ['утро', 'вечер', 'режим', 'привычк', 'бег', 'йога', 'спортзал', 'велосипед', 'зарядк', 'просыпа', 'ложит', 'пунктуальность', 'планы'],
      patterns: [/приходит .* заранее/i, /по утрам/i, /по субботам/i, /режим/i, /привычк/i, /строит планы/i, /таңертең/i, /жоспарлай/i, /every morning/i, /habit/i, /punctual/i],
    },
    {
      title: 'Характер и ценности',
      icon: '🧠',
      stems: ['характер', 'ценност', 'интроверт', 'экстраверт', 'пунктуальность', 'ответствен', 'добр', 'честн', 'перфекционист', 'тишина'],
      patterns: [/по характеру/i, /ценит/i, /интроверт/i, /экстраверт/i, /пунктуальн/i, /мінезі/i, /introvert/i, /extrovert/i, /values/i],
    },
    {
      title: 'Идеи подарков',
      icon: '🎁',
      stems: ['подарок', 'сертификат', 'обрадовал'],
      patterns: [/подарок/i, /подарить/i, /обрадовал(?:ся|ась) бы/i, /сертификат/i, /сыйлық/i, /gift/i, /present/i],
    },
    {
      title: 'Важные даты',
      icon: '📅',
      stems: ['день_рождения', 'годовщин', 'юбиле', 'праздник', 'октябр', 'ноябр', 'декабр', 'январ', 'феврал', 'март', 'апрел', 'июн', 'июл', 'август', 'сентябр'],
      patterns: [
        /день рождения/i, /\bдр\b/i, /годовщин/i, /туған күн/i, /мерейтой/i, /birthday/i, /anniversary/i,
        /\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|қаңтар|ақпан|наурыз|сәуір|мамыр|маусым|шілде|тамыз|қыркүйек|қазан|қараша|желтоқсан|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      ],
    },
    {
      title: 'Работа и карьера',
      icon: '💼',
      stems: ['работа', 'учеба', 'менеджер', 'разработчик', 'дизайнер', 'стартап', 'компан', 'офис', 'удаленк', 'проект'],
      patterns: [/работает/i, /менеджер/i, /дизайнер/i, /разработчик/i, /стартап/i, /карьер/i, /жұмыс істейд/i, /works as/i, /engineer/i, /designer/i, /manager/i],
    },
    {
      title: 'Не нравится',
      icon: '👎',
      stems: ['шум', 'страх'],
      patterns: [
        /не нравится/i, /не любит/i, /терпеть не может/i, /на дух не переносит/i,
        /не выносит/i, /не переваривает/i, /ненавидит/i, /раздражает/i, /бесит/i,
        /бесят/i, /выводит из себя/i, /действует на нервы/i, /воротит от/i,
        /не по душе/i, /не в восторге/i, /напрягает/i, /утомляет/i, /боится/i,
        // KK
        /жек көред/i, /ұнатпайд/i, /жақтырмайд/i, /төзе алмайд/i, /көргісі келмейд/i, /жынына тиед/i, /тітіркен/i,
        // EN
        /can't stand/i, /cannot stand/i, /hates/i, /dislikes/i, /detests/i, /loathes/i, /doesn't like/i, /annoys/i, /irritates/i, /not a fan of/i,
      ],
    },
    {
      title: 'Нравится',
      icon: '❤️',
      stems: ['любить', 'тишина', 'фото'],
      patterns: [
        /нравится/i, /любит/i, /обожает/i, /в восторге/i, /без ума от/i,
        /души не чает/i, /с ума сходит по/i, /тащится от/i, /кайфует от/i,
        /фанатеет от/i, /предпочитает/i, /по душе/i, /по вкусу/i, /увлекается/i,
        // KK
        /ұнатад/i, /жақсы көред/i, /қатты ұнатад/i, /қызығад/i, /құмар/i, /керемет көред/i,
        // EN
        /loves/i, /adores/i, /enjoys/i, /likes/i, /prefers/i, /crazy about/i, /obsessed with/i, /fond of/i, /keen on/i, /passionate about/i,
      ],
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
      if (!finalReason) {
        finalReason =
          lang === 'kk'
            ? 'Жаңа жазбадағы мәліметтермен толықтырылды'
            : lang === 'en'
            ? 'Enriched with details from new note'
            : 'Дополнено деталями из новой заметки';
      }
    } else if (relAcross.type === 'contradict' && relAcross.fact) {
      finalTag = 'updated';
      replacesOldFact = relAcross.fact.text;
      if (!finalReason) {
        finalReason =
          lang === 'kk'
            ? 'Жаңа жазба негізінде жаңартылды'
            : lang === 'en'
            ? 'Updated based on new note'
            : 'Обновлено на основе новой заметки';
      }
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
    const rx = new RegExp(`(?:^|[^А-ЯЁа-яёӘәҒғҚқҢңӨөҰұҮүҺһІіA-Za-z])${escaped}(?:[^А-ЯЁа-яёӘәҒғҚқҢңӨөҰұҮүҺһІіA-Za-z]|$)`, 'i');
    if (rx.test(textToAnalyze)) {
      pushFactItem(
        'Семья и окружение',
        '👨‍👩‍👧',
        `Знакома/общается с «${other.name}»`,
        'ai_inference',
        `Упоминание в заметке о ${person.name}`
      );
    }
  });

  const sentences = textToAnalyze
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  sentences.forEach((sentence) => {
    if (
      /^(?:сегодня|вчера|позавчера)?\s*(?:долго\s+)?(?:болтали|поболтали|говорили|поговорили|встречались|сидели)\s+с\s+[А-ЯЁӘҒҚҢӨҰҮҺІA-Za-z-]+$/i.test(
        sentence
      )
    ) {
      return;
    }

    const colonMatch = sentence.match(/^([А-ЯЁӘҒҚҢӨҰҮҺІA-Za-z0-9\s-]{2,32}):\s*(.+)$/);
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
      const hasNegation = detectPolarity(normalized) === -1;

      let bestCat: (typeof categories)[number] | null = null;
      let bestScore = 0;

      categories.forEach((cat) => {
        if (hasNegation && cat.title === 'Нравится') return;
        if (!hasNegation && cat.title === 'Не нравится') return;

        let score = 0;
        if (cat.patterns.some((rx) => rx.test(normalized))) {
          score += cat.title === 'Не нравится' ? 6 : 3;
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
        pushFactItem(
          (bestCat as (typeof categories)[number]).title,
          (bestCat as (typeof categories)[number]).icon,
          normalized,
          'fact',
          ''
        );
      } else {
        pushFactItem('Разные заметки', '📝', normalized, 'fact', '');
      }

      if (/аллерг.*(?:арахис|орех|м[её]д|лактоз|глютен|цитрус)|аллергиясы\s+бар|allergic\s+to\s+[^,.!?()]+/i.test(normalized)) {
        const allergenMatch =
          normalized.match(/аллерг[а-я]*\s+на\s+([^,.!?()]+)/i) ||
          normalized.match(/allergic\s+to\s+([^,.!?()]+)/i) ||
          normalized.match(/([^,.!?()\s]+(?:ға|ге|қа|ке|на))\s+аллергия/i);
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
        /(?:мечтает\s+научиться\s+играть\s+на|мечтает\s+о|мечтает\s+купить|давно\s+хочет|хотел[а]?\s+бы|сломал(?:ся|ась)|не\s+решал(?:ся|ась)\s+купить|dreams?\s+of|wants?\s+to\s+(?:buy|learn))\s+([^,.!?()]+)/i
      );
      if (dreamMatch && dreamMatch[1]) {
        const targetObj = dreamMatch[1].trim();
        if (/укулел|ukulel/i.test(normalized)) {
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

      if (/(?:япони|киот|токи|жапония|japan|kyoto|tokyo)/i.test(normalized)) {
        pushFactItem(
          'Идеи подарков',
          '🎁',
          'Авторский путеводитель по Киото или компактный тревел-органайзер',
          'ai_inference',
          'Из планов поехать в Японию'
        );
      }

      if (/(?:матч[ауе]|овсяном молоке|matcha|oat milk)/i.test(normalized)) {
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

export function buildLocalAdvisorAnswer(
  person: Person,
  question: string,
  _lang: AppLang = 'ru'
): string {
  const lowQ = normalizeSynonymousPhrases(question);
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
        lowCol.includes('мечт') ||
        lowCol.includes('культ')
      ) {
        likes.push(`• [${c.title}] ${f.text}`);
      }
    });
  });

  if (/подар|подарит|деньрожден|сюрприз|сыйлық|туғанкүн|gift|present|birthday/i.test(lowQ)) {
    const lines: string[] = [];
    if (gifts.length > 0) {
      lines.push(`Лучшие идеи подарков для ${person.name}:\n${gifts.join('\n')}`);
    } else if (likes.length > 0) {
      lines.push(`Опирайтесь на интересы ${person.name}:\n${likes.slice(0, 4).join('\n')}`);
    } else {
      lines.push(`Пока мало данных об увлечениях ${person.name} — добавьте пару фактов о хобби.`);
    }
    if (limits.length > 0) {
      lines.push(`\nОбязательно учтите ограничения:\n${limits.join('\n')}`);
    }
    return lines.join('\n');
  }

  if (/пойти|встреч|свидан|кафе|ресторан|куда|погулят|кездес|қайда|meet|where|cafe/i.test(lowQ)) {
    const lines = [`Рекомендации для встречи с ${person.name}:`];
    if (likes.length > 0) {
      lines.push(`• Ориентиры по атмосфере и вкусам:\n${likes.slice(0, 4).join('\n')}`);
    }
    if (limits.length > 0) {
      lines.push(`• Чего избегать:\n${limits.join('\n')}`);
    }
    lines.push('• Совет: приходите вовремя и выбирайте место со спокойной обстановкой.');
    return lines.join('\n');
  }

  if (/поговорит|спросит|тема|обсуд|диалог|сөйлес|тақырып|talk|topic/i.test(lowQ)) {
    return likes.length > 0
      ? `Темы для разговора с ${person.name}:\n${likes.slice(0, 5).join('\n')}`
      : 'Спросите о недавних впечатлениях, книгах, фильмах или планах на ближайший отпуск.';
  }

  if (/табу|нельзя|аллерг|запрет|избегат|не любит|раздража|бесит|шектеу|taboo|avoid|allergy/i.test(lowQ)) {
    return limits.length > 0
      ? `Ограничения и триггеры для ${person.name}:\n${limits.join('\n')}`
      : `В карточке ${person.name} пока не зафиксировано аллергий или строгих табу.`;
  }

  // Stem-based matching with synonym expansion (remove generic verb 'любить' from query matching unless no other stems)
  const qStemsRaw = extractStems(question);
  const specificQStems = Array.from(qStemsRaw).filter((s) => s !== 'любить');
  const qStemsToMatch = specificQStems.length > 0 ? specificQStems : Array.from(qStemsRaw);

  const matched = allFacts.filter((item) => {
    const fStems = extractStems(`${item.text} ${item.col}`);
    if (qStemsToMatch.some((s) => fStems.has(s))) return true;
    // Also bridge 'питомец' queries to 'кот' / 'собака'
    if (qStemsToMatch.includes('питомец') && (fStems.has('кот') || fStems.has('собака'))) {
      return true;
    }
    return false;
  });

  if (matched.length > 0) {
    return (
      `Найдено в досье ${person.name}:\n` +
      matched.map((m) => `• [${m.col}] ${m.text}`).join('\n')
    );
  }

  if (/любит|нравится|хобби|интерес/i.test(lowQ) && likes.length > 0) {
    return `Что нравится ${person.name}:\n${likes.slice(0, 6).join('\n')}`;
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
            if (st.length < 4 || st === 'любить') return;
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
        : '• Пока пересечений между людьми немного — добавьте больше фактов об увлечениях каждого человека, чтобы найти точки соприкосновения.';

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
        return `• ${p.name}${p.subtitle ? ` (${p.subtitle})` : ''} — разделов: ${p.columns.length}, фактов: ${cnt}.`;
      })
      .join('\n');

    return {
      reportTitle: `Общая сводка по всем контактам (${targets.length} чел.)`,
      block1Title: '1. Обзор базы и статистика',
      block1Text: `В блокноте собрано ${targets.length} карточек и ${totalFactsAll} фактов.`,
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
        '• Регулярно пополняйте карточки после встреч — система автоматически найдёт новые общие интересы для совместных мероприятий.',
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
    reportTitle: `Досье: ${p.name}`,
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
      '• Добавьте немного фактов об увлечениях или мечтах, чтобы сформировать точные идеи подарков.',
    block5Title: '5. Что ещё стоит узнать (вопросы для следующей встречи)',
    block5Text: suggestedQuestions.slice(0, 4).join('\n'),
    block6Title: '6. Готовые заходы и сценарии встречи',
    block6Text: scenarios.join('\n'),
  };
}
