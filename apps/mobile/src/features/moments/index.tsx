/**
 * Moments à partager (docs/VIRALITE.md) : une carte au format story (1080 × 1920, `ShareCard`) proposée une seule fois
 * au bon moment (palier de série 7 / 30 / 100 jours, groupe qui tient 7 / 30 jours, résultat du test), jamais bloquante,
 * désactivable (Moi › Réglages). Les paliers déjà proposés sont gardés sur le téléphone. Composition de @blowy/ui.
 */
import type { ShareBody } from '@blowy/contract';
import { STREAK_MOMENTS, type VisionProfile, momentToOffer, visionTraits } from '@blowy/domain';
import { Button, type PetLook, ShareCard, SheetTemplate, Text, type TitleContent } from '@blowy/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useTrackShare } from '@/features/growth';
import { config, inviteUrl } from '@/core';
import { displayUrl, useMe, useStoryShare } from '@/features/me';
import { croissance } from '@/locales/croissance';

const t = croissance;

interface MomentsState {
  /** Réglage « Proposer de partager mes moments » (activé par défaut). */
  enabled: boolean;
  /** Paliers déjà proposés, par moment (`streak`, `group:<id>`). */
  offered: Record<string, number[]>;
  setEnabled: (on: boolean) => void;
  markOffered: (key: string, upTo: number, steps: readonly number[]) => void;
}

export const useMoments = create<MomentsState>()(
  persist(
    (set) => ({
      enabled: true,
      offered: {},
      setEnabled: (enabled) => set({ enabled }),
      markOffered: (key, upTo, steps) =>
        set((s) => ({ offered: { ...s.offered, [key]: [...new Set([...(s.offered[key] ?? []), ...steps.filter((x) => x <= upTo)])] } })),
    }),
    {
      name: 'blowy.moments',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ enabled, offered }) => ({ enabled, offered }),
    },
  ),
);

function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useMoments.persist.onFinishHydration(cb),
    () => useMoments.persist.hasHydrated(),
    () => true,
  );
}

/**
 * Palier à proposer maintenant pour ce moment (null : rien, déjà proposé, ou réglage coupé). `dismiss` le range avec
 * ceux en dessous : il ne revient plus, qu'on partage ou non.
 */
export function useMomentOffer(key: string, value: number | null | undefined, steps: readonly number[]): { step: number | null; dismiss: () => void } {
  const hydrated = useHydrated();
  const enabled = useMoments((s) => s.enabled);
  const offered = useMoments((s) => s.offered[key]);
  const step = hydrated && enabled && value != null ? momentToOffer(value, steps, new Set(offered ?? [])) : null;
  const dismiss = useCallback(() => {
    if (step !== null) useMoments.getState().markOffered(key, step, steps);
  }, [key, step, steps]);
  return { step, dismiss };
}

export interface MomentCardContent {
  kicker?: string;
  title: TitleContent;
  words?: readonly string[];
  big?: { value: string; unit: string };
  pet: PetLook;
  callout: string;
  /** Lien complet (affiché sans protocole sur la carte). */
  url: string;
  gradient?: 'violet' | 'coral' | 'orange' | 'rose' | 'accent' | 'wine';
}

/**
 * Feuille « partager ce moment » : l'aperçu de la carte, « Partager en story » (Instagram, sinon la feuille du système),
 * « Autre app », « Plus tard » et, pour les moments proposés d'office, « Ne plus me proposer ».
 */
export function MomentSheet({
  visible,
  onClose,
  title,
  text,
  card,
  message,
  kind = 'moment',
  offerNever = false,
}: {
  visible: boolean;
  onClose: () => void;
  title: TitleContent;
  text?: string;
  card: MomentCardContent;
  message: string;
  kind?: ShareBody['kind'];
  offerNever?: boolean;
}) {
  const story = useStoryShare();
  const track = useTrackShare();
  const shown = displayUrl(card.url);
  const cardProps = { brand: t.brand, kicker: card.kicker, title: card.title, words: card.words, big: card.big, pet: card.pet, callout: card.callout, url: shown, gradient: card.gradient };
  const go = (target: 'story' | 'sheet') => {
    track(kind);
    void story.share(message, card.url, target);
  };
  return (
    <SheetTemplate
      visible={visible}
      onClose={onClose}
      title={title}
      closeLabel={t.share.close}
      scroll
      footer={
        <>
          <Button label={t.share.story} icon="share" loading={story.busy} onPress={() => go('story')} />
          <Button label={t.share.sheet} variant="glass" disabled={story.busy} onPress={() => go('sheet')} />
          <Button label={t.share.later} variant="ghost" onPress={onClose} />
          {offerNever ? (
            <Button
              label={t.share.never}
              variant="link"
              size="sm"
              onPress={() => {
                useMoments.getState().setEnabled(false);
                onClose();
              }}
            />
          ) : null}
        </>
      }
    >
      {text ? (
        <Text size={14} muted center>
          {text}
        </Text>
      ) : null}
      <ShareCard {...cardProps} scale={0.55} accessibilityLabel={message} />
      {visible ? <ShareCard ref={story.card} {...cardProps} offscreen /> : null}
    </SheetTemplate>
  );
}

/** Palier de la série du défi du jour (7, 30, 100 jours) : la carte s'ouvre une fois, à l'accueil. */
export function StreakMoment({ streak }: { streak: number | null | undefined }) {
  const { step, dismiss } = useMomentOffer('streak', streak, STREAK_MOMENTS);
  const me = useMe(step !== null);
  if (step === null || !me.data) return null;
  const c = t.moments.streak;
  const url = inviteUrl(me.data.inviteCode);
  const pet = me.data.pet;
  return (
    <MomentSheet
      visible
      onClose={dismiss}
      title={c.sheetTitle(step)}
      text={c.text}
      message={c.message(step, url)}
      offerNever
      card={{ title: c.title, big: { value: String(step), unit: c.unit(step) }, pet: { name: pet.name, species: pet.species, outfit: pet.outfit }, callout: c.callout, url, gradient: 'orange' }}
    />
  );
}

/** « Ton minimoa est … » : deux traits au plus, jamais l'axe « foyer » (rien de sensible). */
export function visionHeadline(profile: VisionProfile): string {
  const v = t.moments.vision;
  const traits = visionTraits(profile).map(({ axis, side }) => v.traits[axis]?.[side] ?? '').filter(Boolean);
  return traits.length ? traits.join(v.and) : v.fallback;
}

/** Bouton « Partager mon résultat » du test de vision (inscription) : une carte à partager, facultative. */
export function VisionShare({ profile, pet }: { profile: VisionProfile; pet: PetLook }) {
  const [open, setOpen] = useState(false);
  const v = t.moments.vision;
  const headline = visionHeadline(profile);
  const url = config.webUrl;
  return (
    <>
      <Button label={v.cta} icon="share" variant="glass" size="md" onPress={() => setOpen(true)} block />
      <MomentSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={v.sheetTitle}
        text={v.text}
        message={v.message(headline, url)}
        card={{ kicker: v.kicker, title: headline.toUpperCase(), pet, callout: v.callout, url, gradient: 'rose' }}
      />
    </>
  );
}
