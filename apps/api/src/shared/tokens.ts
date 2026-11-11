/** Jetons d'injection (pas d'`emitDecoratorMetadata` : chaque dépendance est injectée explicitement). */
export const ENV = Symbol('ENV');
export const CLOCK = Symbol('CLOCK');
export const IDS = Symbol('IDS');
export const PUBLIC_URL = Symbol('PUBLIC_URL');

export const AUTH_VERIFIER = Symbol('AUTH_VERIFIER');
export const AUTH_ADMIN = Symbol('AUTH_ADMIN');
export const USER_EMAILS = Symbol('USER_EMAILS');
export const STORAGE = Symbol('STORAGE');
export const MAILER = Symbol('MAILER');
export const SUPABASE = Symbol('SUPABASE');
export const MEMORY_DB = Symbol('MEMORY_DB');

export const PROFILES = Symbol('PROFILES');
export const PETS = Symbol('PETS');
export const WORD_VOTES = Symbol('WORD_VOTES');
export const LINKS = Symbol('LINKS');
export const MESSAGES = Symbol('MESSAGES');
export const LINK_READS = Symbol('LINK_READS');
export const DAILY_PHOTOS = Symbol('DAILY_PHOTOS');
export const ENCOUNTERS = Symbol('ENCOUNTERS');
export const BLOCKS = Symbol('BLOCKS');
export const REPORTS = Symbol('REPORTS');

export const ONBOARDED_HOOK = Symbol('ONBOARDED_HOOK');
