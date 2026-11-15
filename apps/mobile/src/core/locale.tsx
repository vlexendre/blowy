/**
 * Langue de l'app : celle du téléphone (`expo-localization`), choisie au démarrage puis suivie.
 * Français si le téléphone est en français, sinon la langue proposée la plus proche, anglais en repli (spéc §23).
 * À chaque changement : textes mis à jour sur place (`setLocale`), écrans re-rendus, données de l'API rechargées
 * (elles contiennent du texte) et langue du profil mise à jour (`profiles.locale`, pour les notifications et e-mails).
 */
import { type Locale, pickLocale } from '@blowy/content';
import { getLocales, useLocales } from 'expo-localization';
import { type ReactNode, useEffect, useState } from 'react';

import { getLocale, onLocaleChange, setLocale } from '@/locales/runtime';

const fromDevice = (list: readonly { languageTag: string; languageCode: string | null }[]): { locale: Locale; tag: string | null } => ({
  locale: pickLocale(list.map((l) => l.languageTag || l.languageCode)),
  tag: list[0]?.languageTag ?? null,
});

/** Choisie dès le chargement du module, avant le premier rendu : aucun écran ne s'affiche dans la mauvaise langue. */
(() => {
  try {
    const { locale, tag } = fromDevice(getLocales());
    setLocale(locale, tag);
  } catch {
    // Module natif absent (tests) : on reste sur la langue source.
  }
})();

/** Langue courante, re-rendue quand elle change. */
export function useAppLocale(): Locale {
  const [locale, set] = useState<Locale>(getLocale);
  useEffect(() => onLocaleChange(set), []);
  return locale;
}

/**
 * Suit la langue du téléphone pendant que l'app tourne et remonte tout l'arbre quand elle change
 * (`key` : chaque écran relit ses textes).
 */
export function LocaleRoot({ children }: { children: ReactNode }) {
  const device = useLocales();
  const locale = useAppLocale();
  useEffect(() => {
    const { locale: next, tag } = fromDevice(device);
    setLocale(next, tag);
  }, [device]);
  return <LocaleKey key={locale}>{children}</LocaleKey>;
}

function LocaleKey({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
