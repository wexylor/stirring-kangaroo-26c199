import { parseChatTranscript } from './chatParser.ts';

export interface ParsedVCardContact {
  name: string;
  subtitle: string;
  group: string;
  facts: Array<{ columnTitle: string; icon: string; text: string }>;
}

export interface ParsedImportedChatResult {
  ok: boolean;
  format: 'telegram_json' | 'chat_txt' | 'plain_text';
  extractedText: string;
  messageCount: number;
}

function decodeQuotedPrintableUtf8(raw: string): string {
  const normalized = raw.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < normalized.length; i++) {
    if (
      normalized[i] === '=' &&
      i + 2 < normalized.length &&
      /^[0-9A-Fa-f]{2}$/.test(normalized.slice(i + 1, i + 3))
    ) {
      bytes.push(parseInt(normalized.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      const encoded = new TextEncoder().encode(normalized[i]);
      encoded.forEach((b) => bytes.push(b));
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return normalized;
  }
}

function unescapeVCardValue(val: string): string {
  return val
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function formatBirthdayString(raw: string): string {
  const clean = raw.trim();
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
  }
  const compactMatch = clean.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[3]}.${compactMatch[2]}.${compactMatch[1]}`;
  }
  const noYearMatch = clean.match(/^--(\d{2})-?(\d{2})$/);
  if (noYearMatch) {
    return `${noYearMatch[2]}.${noYearMatch[1]}`;
  }
  return clean;
}

function formatTelLabel(paramsUpper: string): string {
  if (paramsUpper.includes('CELL') || paramsUpper.includes('MOBILE')) return 'Мобильный';
  if (paramsUpper.includes('WORK')) return 'Рабочий тел.';
  if (paramsUpper.includes('HOME')) return 'Домашний тел.';
  return 'Телефон';
}

export function parseVCardContacts(vcfText: string): ParsedVCardContact[] {
  const source = String(vcfText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!source.trim()) return [];

  // Unfold RFC 2426 / 6350 folded lines and QP soft line-breaks
  const unfoldedLines: string[] = [];
  const rawLines = source.split('\n');
  for (const line of rawLines) {
    if (/^[ \t]/.test(line) && unfoldedLines.length > 0) {
      unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
    } else if (
      unfoldedLines.length > 0 &&
      /QUOTED-PRINTABLE/i.test(unfoldedLines[unfoldedLines.length - 1]) &&
      unfoldedLines[unfoldedLines.length - 1].endsWith('=')
    ) {
      unfoldedLines[unfoldedLines.length - 1] =
        unfoldedLines[unfoldedLines.length - 1].slice(0, -1) + line;
    } else {
      unfoldedLines.push(line);
    }
  }

  const results: ParsedVCardContact[] = [];
  let inCard = false;
  let fn = '';
  let structuredName = '';
  let org = '';
  let title = '';
  let group = 'Друзья';
  let facts: Array<{ columnTitle: string; icon: string; text: string }> = [];

  const flushCard = () => {
    const finalName = (fn || structuredName).trim().slice(0, 60);
    if (!finalName) return;
    const subtitleParts = [title, org].map((s) => s.trim()).filter(Boolean);
    const subtitle = subtitleParts.join(' · ').slice(0, 100);
    const seen = new Set<string>();
    const uniqueFacts = facts.filter((f) => {
      const k = `${f.columnTitle}|${f.text.toLowerCase()}`;
      if (!f.text || seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    results.push({
      name: finalName,
      subtitle,
      group: group || 'Друзья',
      facts: uniqueFacts.slice(0, 30),
    });
  };

  for (const line of unfoldedLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const upper = trimmed.toUpperCase();
    if (upper === 'BEGIN:VCARD') {
      inCard = true;
      fn = '';
      structuredName = '';
      org = '';
      title = '';
      group = 'Друзья';
      facts = [];
      continue;
    }
    if (upper === 'END:VCARD') {
      if (inCard) {
        flushCard();
        inCard = false;
      }
      continue;
    }
    if (!inCard) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const left = trimmed.slice(0, colonIdx);
    const rawVal = trimmed.slice(colonIdx + 1);
    const leftUpper = left.toUpperCase();
    const propName = leftUpper.split(';')[0].replace(/^ITEM\d+\./, '');
    const isQp = leftUpper.includes('QUOTED-PRINTABLE');
    const decoded = isQp ? decodeQuotedPrintableUtf8(rawVal) : rawVal;

    if (propName === 'FN') {
      fn = unescapeVCardValue(decoded);
    } else if (propName === 'N') {
      const parts = decoded.split(';').map((p) => unescapeVCardValue(p)).filter(Boolean);
      if (parts.length > 0) {
        // N format: Family;Given;Middle;Prefix;Suffix
        const family = parts[0] || '';
        const given = parts[1] || '';
        const ordered = [given, family].filter(Boolean).join(' ').trim();
        structuredName = ordered || parts.join(' ');
      }
    } else if (propName === 'TEL') {
      const phone = unescapeVCardValue(decoded);
      if (phone) {
        facts.push({
          columnTitle: 'Контакты',
          icon: '📞',
          text: `${formatTelLabel(leftUpper)}: ${phone}`,
        });
      }
    } else if (propName === 'EMAIL') {
      const email = unescapeVCardValue(decoded);
      if (email) {
        facts.push({
          columnTitle: 'Контакты',
          icon: '📞',
          text: `Email: ${email}`,
        });
      }
    } else if (propName === 'BDAY') {
      const bday = formatBirthdayString(unescapeVCardValue(decoded));
      if (bday) {
        facts.push({
          columnTitle: 'Важные даты',
          icon: '📅',
          text: `День рождения: ${bday}`,
        });
      }
    } else if (propName === 'ORG') {
      const cleanOrg = decoded
        .split(';')
        .map((s) => unescapeVCardValue(s))
        .filter(Boolean)
        .join(', ');
      if (cleanOrg) {
        org = cleanOrg;
        group = 'Работа';
        facts.push({
          columnTitle: 'Работа',
          icon: '💼',
          text: `Компания: ${cleanOrg}`,
        });
      }
    } else if (propName === 'TITLE') {
      const cleanTitle = unescapeVCardValue(decoded);
      if (cleanTitle) {
        title = cleanTitle;
        group = 'Работа';
        facts.push({
          columnTitle: 'Работа',
          icon: '💼',
          text: `Должность: ${cleanTitle}`,
        });
      }
    } else if (propName === 'ADR') {
      const addr = decoded
        .split(';')
        .map((s) => unescapeVCardValue(s))
        .filter(Boolean)
        .join(', ');
      if (addr) {
        facts.push({
          columnTitle: 'Контакты',
          icon: '📍',
          text: `Адрес: ${addr}`,
        });
      }
    } else if (propName === 'NOTE') {
      const noteText = unescapeVCardValue(decoded);
      if (noteText) {
        noteText
          .split(/\n+/)
          .map((lineNote) => lineNote.trim())
          .filter(Boolean)
          .slice(0, 6)
          .forEach((lineNote) => {
            facts.push({
              columnTitle: 'О себе',
              icon: '📝',
              text: lineNote.slice(0, 180),
            });
          });
      }
    }
  }

  return results;
}

function flattenTelegramTextField(rawText: unknown): string {
  if (typeof rawText === 'string') return rawText.trim();
  if (!Array.isArray(rawText)) return '';
  return rawText
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
        return (part as { text: string }).text;
      }
      return '';
    })
    .join('')
    .trim();
}

export function parseImportedChatFile(
  filename: string,
  rawContent: string,
  targetPersonName?: string
): ParsedImportedChatResult {
  const content = String(rawContent || '').trim();
  if (!content) {
    return { ok: false, format: 'plain_text', extractedText: '', messageCount: 0 };
  }

  const lowerName = String(filename || '').toLowerCase();
  if (lowerName.endsWith('.json') || content.startsWith('{') || content.startsWith('[')) {
    try {
      const parsed = JSON.parse(content) as
        | { messages?: unknown[]; name?: unknown }
        | unknown[];
      const messages = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray(parsed.messages)
        ? parsed.messages
        : null;

      if (messages) {
        const personLower = String(targetPersonName || '').trim().toLowerCase();
        const lines: string[] = [];
        const recent = messages.slice(-250);
        for (const msg of recent) {
          if (!msg || typeof msg !== 'object') continue;
          const m = msg as { type?: unknown; from?: unknown; actor?: unknown; text?: unknown; date?: unknown };
          if (m.type && m.type !== 'message') continue;
          const txt = flattenTelegramTextField(m.text);
          if (!txt || txt.length < 3) continue;
          const sender = String(m.from || m.actor || '').trim();
          const datePrefix =
            typeof m.date === 'string' && m.date.length >= 10 ? `[${m.date.slice(0, 10)}] ` : '';
          // Prioritize messages from target person if we can detect them, or keep dialogue context
          if (personLower && sender && sender.toLowerCase().includes(personLower)) {
            lines.push(`${datePrefix}${sender}: ${txt}`);
          } else if (sender) {
            lines.push(`${datePrefix}${sender}: ${txt}`);
          } else {
            lines.push(`${datePrefix}${txt}`);
          }
        }
        const joined = lines.join('\n').slice(0, 12000).trim();
        if (!joined) {
          return { ok: false, format: 'telegram_json', extractedText: '', messageCount: 0 };
        }
        const cleaned = parseChatTranscript(joined, targetPersonName);
        return {
          ok: true,
          format: 'telegram_json',
          extractedText: (cleaned.isChat && cleaned.cleanedText ? cleaned.cleanedText : joined).slice(0, 12000),
          messageCount: lines.length,
        };
      }
    } catch {
      // Fallback to txt parsing below
    }
  }

  const chatRes = parseChatTranscript(content, targetPersonName);
  if (chatRes.isChat && chatRes.cleanedText.trim()) {
    return {
      ok: true,
      format: 'chat_txt',
      extractedText: chatRes.cleanedText.trim().slice(0, 12000),
      messageCount: chatRes.extractedLines.length,
    };
  }

  return {
    ok: true,
    format: 'plain_text',
    extractedText: content.slice(0, 12000),
    messageCount: content.split(/\n+/).filter((l) => l.trim()).length,
  };
}
