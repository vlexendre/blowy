/**
 * Moments à partager (docs/VIRALITE.md) : une carte au format story (1080 × 1920, `ShareCard`), seulement quand on la
 * demande (résultat du test de vision). Plus rien n'est proposé d'office sur l'accueil (V6-GAccueil : une seule
 * action) ; les paliers de série se fêtent en fin de séance. Composition de @blowy/ui.
 */
import type { ShareBody } from '@blowy/contract';
import { type VisionProfile, visionTraits } from '@blowy/domain';
import { Button, type PetLook, ShareCard, SheetTemplate, Text, type TitleContent } from '@blowy/ui';
import { useState } from 'react';

import { useTrackShare } from '@/features/growth';
import { config } from '@/core';
import { displayUrl, useStoryShare } from '@/features/me';
import { common } from '@/locales/common';
import { croissance } from '@/locales/croissance';

const t = croissance;

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
 * « Autre app », « Plus tard ».
 */
export function MomentSheet({
  visible,
  onClose,
  title,
  text,
  card,
  message,
  kind = 'moment',
}: {
  visible: boolean;
  onClose: () => void;
  title: TitleContent;
  text?: string;
  card: MomentCardContent;
  message: string;
  kind?: ShareBody['kind'];
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
          <Button label={story.copied ? common.copied : t.share.story} icon="share" loading={story.busy} onPress={() => go('story')} />
          <Button label={t.share.sheet} variant="glass" disabled={story.busy} onPress={() => go('sheet')} />
          <Button label={t.share.later} variant="ghost" onPress={onClose} />
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
