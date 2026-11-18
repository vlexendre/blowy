/**
 * Chaque e-mail de Minimoa rendu avec des données réalistes (aperçus : `pnpm emails:preview`, tests : apps/api/test/emails.e2e.test.ts),
 * et les modèles de Supabase Auth (`supabase/templates`, générés avec la même mise en page).
 */
import type { Locale } from '@blowy/domain';
import { linkCreatedEmail, waveReceivedEmail, welcomeEmail } from '../emails';
import { formatDate } from '../i18n/core';
import { moderationAlertEmail, trialReminderEmail } from '../v7/audit';
import { moderationTextIn, plusPerkTextIn } from '../v7/facturation-admin';
import { longAbsenceEmail, plusBillingEmail, plusGoodbyeEmail, plusWelcomeEmail, plusWinbackEmail } from '../v7/fidelite';
import { quartierConfirmEmail, quartierOpenEmail, zoneLabel } from '../v7/quiz';
import { type Email, renderEmail } from './layout';

const APP = 'https://minimoa.app';
const PERSON = { displayName: 'Léa', petName: 'Bidule' };
const ZONE = { city: 'Paris', district: 11, postalCode: null };
export const SAMPLE = { app: APP, confirmUrl: `${APP}/quartier/confirmer?t=tok_exemple`, unsubscribeUrl: `${APP}/quartier/desinscription?t=tok_exemple`, code: 'PARIS11', reason: 'Des messages insistants après un refus.' } as const;

/** Tous les e-mails de l'API, dans une langue (l'alerte de l'équipe en français seulement). */
export function emailSamples(locale: Locale): Record<string, Email> {
  const perks = Object.values(plusPerkTextIn(locale));
  const day = (iso: string) => formatDate(locale, iso, { day: 'numeric', month: 'long' });
  const zone = zoneLabel(ZONE, locale);
  const m = moderationTextIn(locale);
  const mails: Record<string, Email> = {
    'bienvenue': welcomeEmail(locale, { ...PERSON, appUrl: APP }),
    'signe': waveReceivedEmail(locale, { ...PERSON, fromName: 'Sam', fromPetName: 'Pistache', appUrl: APP }),
    'lien-cree': linkCreatedEmail(locale, { ...PERSON, otherName: 'Sam', otherPetName: 'Pistache', appUrl: APP }),
    'quartier-confirmation': quartierConfirmEmail(locale, { zone, threshold: 50, confirmUrl: SAMPLE.confirmUrl, unsubscribeUrl: SAMPLE.unsubscribeUrl }),
    'quartier-ouverture': quartierOpenEmail(locale, { zone, code: SAMPLE.code, founder: true, appUrl: `${APP}/quartier/paris-11?code=${SAMPLE.code}`, unsubscribeUrl: SAMPLE.unsubscribeUrl }),
    'essai-rappel': trialReminderEmail(locale, { displayName: PERSON.displayName, endsOn: '2026-11-22T10:00:00.000Z', amountMinor: 5999, currency: 'EUR' }),
    'plus-bienvenue': plusWelcomeEmail(locale, { ...PERSON, perks, trialEndsOn: day('2026-11-22T10:00:00.000Z'), appUrl: APP }),
    'plus-paiement': plusBillingEmail(locale, { ...PERSON, graceUntil: day('2026-11-30T10:00:00.000Z') }),
    'plus-au-revoir': plusGoodbyeEmail(locale, { ...PERSON, freeHabits: 2, appUrl: APP }),
    'plus-relance': plusWinbackEmail(locale, { ...PERSON, appUrl: APP }),
    'absence': longAbsenceEmail(locale, { ...PERSON, unread: 3, waves: 1, appUrl: APP }),
    'moderation-avertissement': m.warningEmail({ displayName: PERSON.displayName, reason: SAMPLE.reason }),
    'compte-inactif': m.inactivityEmail({ displayName: PERSON.displayName, deleteOn: '2026-12-18T10:00:00.000Z' }),
  };
  if (locale === 'fr') {
    mails['equipe-signalements'] = moderationAlertEmail({
      kind: 'new',
      adminUrl: 'https://admin.minimoa.app',
      targetHours: 24,
      reports: [
        { id: '1042', priority: 'urgent', reason: 'threat', source: 'person', category: null, ageHours: 0.4 },
        { id: '1041', priority: 'normal', reason: 'spam', source: 'filter', category: 'scam', ageHours: 2.2 },
      ],
    });
  }
  return mails;
}

// ── Modèles de Supabase Auth (une seule langue côté Supabase : français, avec un rappel en anglais) ──────────────

/** `{{ .Token }}` et `{{ .ConfirmationURL }}` passent tels quels (l'échappement HTML ne touche ni les accolades ni les points). */
export function supabaseTemplates(): { code: Email; invite: Email } {
  const code = renderEmail('fr', 'Ton code Minimoa : {{ .Token }}', {
    scene: 'nino-check',
    eyebrow: 'Connexion · Sign in',
    preheader: 'Ton code : {{ .Token }} · Your code: {{ .Token }}',
    bubble: 'Le voilà, tout chaud. Il ne sert qu’une fois.',
    title: 'Ton code de connexion',
    paragraphs: [
      'Tape ce code dans Minimoa pour te connecter :',
      { kind: 'code', label: 'Code', value: '{{ .Token }}', text: '{{ .Token }}' },
      'Il expire dans une heure. Si tu n’as rien demandé, ignore cet e-mail : sans ce code, personne n’entre.',
      'EN · Enter this code in Minimoa to sign in. It expires in one hour. Didn’t ask for it? Just ignore this email.',
    ],
  });
  const invite = renderEmail('fr', 'Ton accès à Minimoa', {
    scene: 'nino-accueil',
    eyebrow: 'Invitation · Invite',
    preheader: 'On t’ouvre un accès à Minimoa. · You’ve been given access to Minimoa.',
    bubble: 'Entre, fais comme chez toi.',
    title: 'On t’ouvre la porte',
    paragraphs: [
      'L’équipe Minimoa t’a créé un accès avec cette adresse. Accepte l’invitation, puis connecte-toi avec le code à 6 chiffres reçu par e-mail.',
      'EN · The Minimoa team created an access for this address. Accept the invite, then sign in with the 6-digit code sent by email.',
      'Pas attendu ? Ignore cet e-mail. · Not expecting this? Ignore this email.',
    ],
    cta: { label: 'Accepter l’invitation', url: '{{ .ConfirmationURL }}' },
  });
  return { code, invite };
}

