/** Bande et duos V5 (spec-v5 §2.11–2.12, D-016, D-017). */

export const BAND_ORIGINS = ['OUTING_VOTE', 'DUO_VOTE', 'PLUS_ONE', 'LEGACY_V4'] as const;
export type BandOrigin = (typeof BAND_ORIGINS)[number];

export const BAND_LINK_STATUSES = ['ACTIVE', 'WITHDRAWN'] as const;
export type BandLinkStatus = (typeof BAND_LINK_STATUSES)[number];

export const DUO_ORIGINS = ['LANE', 'OUTING_VOTE'] as const;
export type DuoOrigin = (typeof DUO_ORIGINS)[number];

export const DUO_STATUSES = ['EXCHANGE', 'UNLOCKED', 'DATE_PROPOSED', 'DATE_CONFIRMED', 'AFTER_VOTE', 'TOGETHER', 'EXPIRED', 'CLOSED', 'LEFT'] as const;
export type DuoStatus = (typeof DUO_STATUSES)[number];

export const DUO_TERMINAL_STATUSES: readonly DuoStatus[] = ['EXPIRED', 'CLOSED', 'LEFT'];
export const isDuoTerminal = (s: DuoStatus): boolean => DUO_TERMINAL_STATUSES.includes(s);

/** Machine d'états du duo (§2.12). `LEFT` (partir proprement) et `CLOSED` (blocage) possibles depuis tout état non terminal. */
export const DUO_TRANSITIONS: Readonly<Record<DuoStatus, readonly DuoStatus[]>> = {
  EXCHANGE: ['UNLOCKED', 'EXPIRED', 'CLOSED', 'LEFT'],
  UNLOCKED: ['DATE_PROPOSED', 'EXPIRED', 'CLOSED', 'LEFT'],
  DATE_PROPOSED: ['DATE_CONFIRMED', 'UNLOCKED', 'EXPIRED', 'CLOSED', 'LEFT'],
  DATE_CONFIRMED: ['AFTER_VOTE', 'UNLOCKED', 'CLOSED', 'LEFT'],
  AFTER_VOTE: ['TOGETHER', 'CLOSED', 'LEFT'],
  TOGETHER: ['DATE_PROPOSED', 'CLOSED', 'LEFT'],
  EXPIRED: [],
  CLOSED: [],
  LEFT: [],
};
export const canTransitionDuo = (from: DuoStatus, to: DuoStatus): boolean => DUO_TRANSITIONS[from].includes(to);

export const DUO_DATE_STATUSES = ['PROPOSED', 'CONFIRMED', 'DECLINED', 'SUPERSEDED', 'CANCELLED', 'DONE'] as const;
export type DuoDateStatus = (typeof DUO_DATE_STATUSES)[number];

export const DATE_RESPONSES = ['ACCEPT', 'DECLINE'] as const;
export type DateResponse = (typeof DATE_RESPONSES)[number];

/** Source d'une révélation d'accord (§7.6 `connection.revealed`). */
export const CONNECTION_SOURCES = ['OUTING', 'DUO'] as const;
export type ConnectionSource = (typeof CONNECTION_SOURCES)[number];

export const CONNECTION_REVEAL_SOURCE_KINDS = ['OUTING', 'DUO_DATE'] as const;
export type ConnectionRevealSourceKind = (typeof CONNECTION_REVEAL_SOURCE_KINDS)[number];
