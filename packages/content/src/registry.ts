/** Tous les dictionnaires partagés, nommés (pour `pnpm i18n:check`). */
import { apiErrorText } from './api-errors';
import { challengeText } from './challenges';
import { emailChromeText } from './email/chrome';
import { emailText } from './emails';
import type { Messages } from './i18n/core';
import { labels } from './labels';
import { auditText } from './v7/audit';
import { chatText } from './v7/chat';
import { facturationText } from './v7/facturation-admin';
import { fideliteText } from './v7/fidelite';
import { groupesText } from './v7/groupes';
import { notificationTexts } from './v7/notifications';
import { rituelsText } from './v7/rituels';
import { visionText } from './v7/vision';
import { quizText } from './v7/quiz';
import { seedText } from './v7/seed';
import { cheminText } from './v7/chemin';
import { voiceText } from './voice';

export const contentDictionaries: Readonly<Record<string, Messages<unknown>>> = {
  labels,
  challenges: challengeText,
  voice: voiceText,
  emails: emailText,
  emailChrome: emailChromeText,
  apiErrors: apiErrorText,
  vision: visionText,
  chat: chatText,
  notifications: notificationTexts,
  rituels: rituelsText,
  facturation: facturationText,
  audit: auditText,
  groupes: groupesText,
  fidelite: fideliteText,
  quiz: quizText,
  seed: seedText,
  chemin: cheminText,
};
