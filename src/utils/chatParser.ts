export interface ChatParseResult {
  isChat: boolean;
  cleanedText: string;
  extractedLines: string[];
  strippedCount: number;
  detectedSenders: string[];
}

const TELEGRAM_HEADER_RX =
  /^(.{1,60}?),\s*\[(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)\]\s*:?\s*$/;

const WHATSAPP_BRACKET_RX =
  /^\[(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\]\s*([^:]{1,60}):\s*(.*)$/i;

const WHATSAPP_DASH_RX =
  /^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\s*[-–]\s*([^:]{1,60}):\s*(.*)$/i;

const SIMPLE_TIME_SENDER_RX =
  /^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+([^:]{1,40}):\s*(.*)$/;

const PLAIN_SENDER_RX = /^([А-ЯЁӘҒҚҢӨҰҮҺІA-Z][а-яёәғқңөұүһіa-zA-Z0-9 _.-]{1,28}):\s+(.+)$/;

const SYSTEM_LINE_RX =
  /^(?:<media omitted>|media omitted|image omitted|video omitted|audio omitted|sticker omitted|gif omitted|document omitted|<медиафайлы не включены>|голосовое сообщение|видеосообщение|стикер|фотография|видео|файл|пересланное сообщение|forwarded from\b|в ответ на сообщение|replied to\b|pinned a message|закрепил[а]?\s+сообщение|дауыстық хабарлама)/i;

const SMALL_TALK_FILLER_RX =
  /^(?:привет(?:ик|ы)?|здравствуй(?:те)?|хай|хелло|здарова|ку|доброе утро|добрый день|добрый вечер|спокойной ночи|сладких снов|как дела|как ты|как сам[а]?|ч[её] как|что нового|нормально|норм|хорошо|отлично|супер|круто|класс|ясненько|ясно|понятно|понял[а]?|ага|угу|ок|окей|ok|okay|да|нет|неа|ну да|спасибо|спс|пасиб|благодарю|пожалуйста|не за что|пока|до встречи|удачи|сәлем|салем|қалайсың|қалайсыз|жақсы|керемет|рахмет|рақмет|оқасы жоқ|сау бол|көріскенше|қайырлы таң|қайырлы кеш|қайырлы түн|hi|hello|hey|good morning|good evening|good night|how are you|doing good|all good|fine|nice|cool|great|got it|sure|yep|yeah|nope|thanks|thank you|thx|ty|np|bye|see you|lol|lmao|haha+|хаха+|ахах+|хех+|[?!.,…\s\p{Emoji_Presentation}\p{Extended_Pictographic}]+)$/iu;

const MEANINGFUL_SIGNAL_RX =
  /(?:\d{1,2}\s+(?:январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр|қаңтар|ақпан|наурыз|сәуір|мамыр|маусым|шілде|тамыз|қыркүйек|қазан|қараша|желтоқсан|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\d{1,2}[./]\d{1,2}|обеща|давай|встретим|договорил|план|буду|хочу|мечта|люблю|обожаю|нравит|не люблю|ненавиж|раздража|бесит|аллерг|подар|день рожден|\bдр\b|кофе|чай|матч|книг|фильм|сериал|работ|проект|отпуск|поездж|поеду|учу|учусь|завел|кот|собак|ұната|жек көр|аллергия|туған күн|сыйлық|кездес|уәде|жоспар|арман|love|adore|hate|dislike|allergic|birthday|gift|coffee|tea|promise|let's meet|plan|prefer|dream)/i;

const SELF_SENDER_NAMES = new Set(['я', 'вы', 'me', 'you', 'мен', 'сіз']);

function cleanMessageContent(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPureSmallTalk(text: string): boolean {
  const stripped = text.replace(/[.!?,…;:()]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!stripped) return true;
  if (SMALL_TALK_FILLER_RX.test(stripped)) return true;

  // Short casual greetings followed by simple filler: "Привет, как дела?"
  const parts = text
    .split(/[,!?]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 0 && parts.every((p) => SMALL_TALK_FILLER_RX.test(p))) {
    return true;
  }

  // Very short 1-2 word reply without meaningful signals
  const words = stripped.split(/\s+/);
  if (words.length <= 2 && !MEANINGFUL_SIGNAL_RX.test(text)) {
    return true;
  }

  return false;
}

function stripLeadingGreeting(text: string): string {
  return text
    .replace(
      /^(?:привет(?:ик)?|сәлем|салем|hi|hello|hey|кстати|слушай|короче|блин|ага|ок|окей|да|ну)[,!.\s]+(?:как дела\??|қалайсың\??|how are you\??)?[,!.\s]*/i,
      ''
    )
    .trim();
}

export function looksLikeChatTranscript(rawText: string): boolean {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;

  let headerMatches = 0;
  for (const line of lines) {
    if (
      TELEGRAM_HEADER_RX.test(line) ||
      WHATSAPP_BRACKET_RX.test(line) ||
      WHATSAPP_DASH_RX.test(line) ||
      SIMPLE_TIME_SENDER_RX.test(line)
    ) {
      headerMatches++;
    }
  }
  if (headerMatches >= 1) return true;

  let senderLineMatches = 0;
  for (const line of lines) {
    if (PLAIN_SENDER_RX.test(line)) senderLineMatches++;
  }
  return senderLineMatches >= 2;
}

export function parseChatTranscript(
  rawText: string,
  personName = ''
): ChatParseResult {
  const input = String(rawText || '').trim();
  if (!input || !looksLikeChatTranscript(input)) {
    return {
      isChat: false,
      cleanedText: input,
      extractedLines: input ? [input] : [],
      strippedCount: 0,
      detectedSenders: [],
    };
  }

  const lines = input.split(/\r?\n/);
  const sendersSet = new Set<string>();
  const messages: Array<{ sender: string; body: string }> = [];
  let currentSender = '';
  let strippedCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Telegram standalone header: "Alina, [20.11.2026 14:32]"
    const tgMatch = line.match(TELEGRAM_HEADER_RX);
    if (tgMatch) {
      currentSender = tgMatch[1].trim();
      sendersSet.add(currentSender);
      strippedCount++;
      continue;
    }

    // 2. WhatsApp bracket: "[20.11.26, 14:32:10] Alina: text"
    const waBracket = line.match(WHATSAPP_BRACKET_RX);
    if (waBracket) {
      currentSender = waBracket[2].trim();
      sendersSet.add(currentSender);
      const body = waBracket[3].trim();
      if (body) messages.push({ sender: currentSender, body });
      strippedCount++;
      continue;
    }

    // 3. WhatsApp dash: "20/11/2026, 14:32 - Alina: text"
    const waDash = line.match(WHATSAPP_DASH_RX);
    if (waDash) {
      currentSender = waDash[2].trim();
      sendersSet.add(currentSender);
      const body = waDash[3].trim();
      if (body) messages.push({ sender: currentSender, body });
      strippedCount++;
      continue;
    }

    // 4. "[14:32] Alina: text"
    const timeSender = line.match(SIMPLE_TIME_SENDER_RX);
    if (timeSender) {
      currentSender = timeSender[2].trim();
      sendersSet.add(currentSender);
      const body = timeSender[3].trim();
      if (body) messages.push({ sender: currentSender, body });
      strippedCount++;
      continue;
    }

    // 5. "Alina: text" (skip known card labels like "Хобби: ..." if single line; here we already confirmed multi-line dialogue)
    const plainSender = line.match(PLAIN_SENDER_RX);
    if (plainSender) {
      currentSender = plainSender[1].trim();
      sendersSet.add(currentSender);
      messages.push({ sender: currentSender, body: plainSender[2].trim() });
      continue;
    }

    messages.push({ sender: currentSender, body: line });
  }

  const normalizedPerson = personName.trim().toLowerCase();
  const extractedLines: string[] = [];

  for (const msg of messages) {
    if (SYSTEM_LINE_RX.test(msg.body)) {
      strippedCount++;
      continue;
    }

    const cleaned = cleanMessageContent(stripLeadingGreeting(msg.body));
    if (!cleaned || isPureSmallTalk(cleaned)) {
      strippedCount++;
      continue;
    }

    const lowSender = msg.sender.toLowerCase();
    const isSelfSender = SELF_SENDER_NAMES.has(lowSender);

    // For messages from "Я / Вы / Me", keep only if they contain clear dates, plans, promises, or mention the contact
    if (isSelfSender && !MEANINGFUL_SIGNAL_RX.test(cleaned)) {
      strippedCount++;
      continue;
    }

    // Remove redundant first-person "я " when attributing directly to the active person
    let finalLine = cleaned;
    if (!isSelfSender && (!normalizedPerson || lowSender.includes(normalizedPerson) || sendersSet.size <= 2)) {
      finalLine = finalLine
        .replace(/^я\s+(?:теперь\s+)?/i, '')
        .replace(/^мен\s+(?:енді\s+)?/i, '')
        .replace(/^i(?:'m|'ve|'ll|'d)?\s+/i, '');
    }

    if (finalLine.length < 3) {
      strippedCount++;
      continue;
    }

    const formatted = finalLine.charAt(0).toUpperCase() + finalLine.slice(1);
    if (!extractedLines.includes(formatted)) {
      extractedLines.push(formatted);
    }
  }

  const cleanedText = extractedLines
    .map((l) => (/[.!?]$/.test(l) ? l : `${l}.`))
    .join(' ');

  return {
    isChat: true,
    cleanedText,
    extractedLines,
    strippedCount,
    detectedSenders: Array.from(sendersSet),
  };
}
