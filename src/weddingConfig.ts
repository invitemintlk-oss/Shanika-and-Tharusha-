// Single source of truth for the wedding details used across the invitation and the admin page.

export const WEDDING = {
  brideName: 'Shanika',
  brideFullName: 'Shanika Dilrukshi',
  groomName: 'Tharusha',
  groomFullName: 'Tharusha Kavinda',

  // Holy Mass start time, Sri Lanka time (UTC+05:30) — used by the countdown.
  date: new Date('2026-12-16T15:30:00+05:30'),
  dateLong: 'Wednesday, 16th December 2026',
  dayMonth: 'Wednesday, December 16',
  dateShort: 'December 16, 2026',
  dateDots: '16 . 12 . 2026',
  monthYear: 'December 2026',
  yearInWords: 'The Year Two Thousand Twenty Six',

  ceremony: {
    title: 'Holy Mass',
    time: '3:30 PM',
    venue: "St. Sebastian's Shrine",
    area: 'Katuneriya',
    mapQuery: "St. Sebastian's Shrine, Katuneriya, Sri Lanka",
  },
  reception: {
    title: 'Wedding Reception',
    time: '7:00 PM',
    endTime: '11:30 PM',
    venue: 'Srimalie Royal Dawn',
    area: 'Kuliyapitiya',
    mapQuery: 'Srimalie Royal Dawn, Kuliyapitiya, Sri Lanka',
  },
} as const;

export const mapsSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const mapsEmbedUrl = (query: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

// ---------- Guest name logic ----------

export const PREFIXES = ['Mr.', 'Mrs.', 'Miss', 'Mr. & Mrs.', 'Family', 'Dear'] as const;
export type Prefix = (typeof PREFIXES)[number];

/** Combines prefix + name into the name shown to the guest. "Dear" adds nothing (the greeting already says Dear). */
export function buildDisplayName(prefix: Prefix | string, rawName: string): string {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (!name) return '';
  switch (prefix) {
    case 'Family':
      return `${name} and Family`;
    case 'Dear':
      return name;
    default:
      return `${prefix} ${name}`;
  }
}

/** Greeting line for messages; never produces "Dear Dear …". */
export function buildGreeting(displayName: string): string {
  const clean = displayName.replace(/^dear\s+/i, '');
  return `Dear ${clean} ❤️`;
}

export function buildInviteLink(baseUrl: string, displayName: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(displayName)}`;
}

export function buildInviteMessage(displayName: string, link: string): string {
  return `${buildGreeting(displayName)}

With joyful hearts, we warmly invite you to celebrate one of the most special days of our lives as we begin our journey together.

Please view our wedding invitation and all the event details through the link below 🌐:

${link}

Your presence would truly mean the world to us, and we would be honored to celebrate this beautiful moment together.

With love,
❤️ ${WEDDING.groomName} & ${WEDDING.brideName}`;
}

const RESERVED_PATHS = new Set(['admin', 'index.html']);

/**
 * Reads the guest display name from the URL.
 * Supports the path format `/{displayName}` and the legacy `?prefix=…&name=…` format.
 */
export function getGuestDisplayName(): string {
  const params = new URLSearchParams(window.location.search);
  const legacyName = params.get('name');
  if (legacyName) return buildDisplayName(params.get('prefix') || 'Dear', legacyName);

  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!slug || slug.includes('/') || RESERVED_PATHS.has(slug.toLowerCase())) return '';
  try {
    return decodeURIComponent(slug).trim().slice(0, 80);
  } catch {
    return '';
  }
}
