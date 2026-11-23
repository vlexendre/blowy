/**
 * La liste de l'onglet Quartier : dans la feuille à crans sur la carte, ou seule (sans position, ou vue en liste pour
 * VoiceOver). Les bonjours reçus, puis les personnes présentées aujourd'hui (et, en vue liste, les autres épingles) ;
 * toucher une ligne ouvre la même fiche qu'une épingle. Personne : on dit pourquoi, et ce qui aide.
 */
import { entitlements } from '@blowy/domain';
import {
  Banner,
  EmptyState,
  EncounterMore,
  EncounterNext,
  EncounterRow,
  EncounterSection,
  EncounterWaiting,
  FarAwayCard,
  QuartierCard,
  Skeleton,
  usePetBump,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { Fragment, type ReactNode } from 'react';

import { hasSessionToDo, useCheminMap } from '@/features/chemin';
import { useAcceptEncounter, useDeclineEncounter, useLiveEncounters, useShareInvite, VISION_TEST_ROUTE } from '@/features/encounters';
import { useShareQuartier } from '@/features/growth';
import { errorText, timeLabel } from '@/features/links';
import type { useMe } from '@/features/me';
import { openPlus } from '@/features/plus';
import { usePet, usePetSleep } from '@/features/pet';
import { chats as chatsText } from '@/locales/chats';
import { chemin } from '@/locales/chemin';
import { quartier as quartierText } from '@/locales/quartier';
import { rencontres as t } from '@/locales/rencontres';
import { voisins as v } from '@/locales/voisins';

import { type Neighbor, type QuartierPeople, quartierOffer } from './people';

/** Silhouettes du « vu de loin » : un décor, jamais les formes des vraies personnes. */
const FAR_SPECIES = ['suzie', 'gaston', 'pia', 'nino'] as const;

export interface QuartierListProps {
  me: ReturnType<typeof useMe>['data'];
  people: QuartierPeople;
  /** Vue liste : les autres épingles de la carte aussi (l'alternative à la carte). */
  showAround?: boolean;
  /** Personne dont la fiche est ouverte, et la fiche à montrer à sa place (vue liste). */
  selected?: string | null;
  fiche?: ReactNode;
  onSelect: (id: string) => void;
  /** Trop de coucous aujourd'hui : une explication, pas une erreur. */
  waveBlock: string | null;
  /** En haut de la liste (action « Activer » sans position, erreurs). */
  header?: ReactNode;
  /** Sous la liste, jamais une vente (Minimoa+ : changer de ville). */
  footer?: ReactNode;
  /**
   * La proposition Minimoa+ de l'écran (gratuit, sur la carte : la carte au-delà de ta zone). Une seule proposition par
   * liste : « Vu de loin » d'abord s'il y en a, sinon celle-ci, sinon « Plus de présentations » ; aucune si la liste
   * est vide (on ne vend pas sur un état vide, docs/ADA-2027.md point 4).
   */
  plusOffer?: ReactNode;
}

export function QuartierList({ me, people, showAround = false, selected, fiche, onSelect, waveBlock, header, footer, plusOffer }: QuartierListProps) {
  const router = useRouter();
  const encounters = useLiveEncounters();
  const accept = useAcceptEncounter();
  const decline = useDeclineEncounter();
  const pet = usePet().data?.pet;
  const map = useCheminMap();
  const invite = useShareInvite(t.shareMessage);
  // « Ouvre ton quartier » : le compteur réel de ta zone quand personne n'est à te présenter (docs/VIRALITE.md).
  const quartier = useShareQuartier(quartierText.card.message);
  const zone = quartier.quartier.data?.status ?? null;
  const bump = usePetBump();
  const firstDay = usePetSleep(pet?.bornAt).firstDay;
  const petName = pet?.name ?? chatsText.yourPet;
  const incoming = encounters.data?.incoming ?? [];
  const noVision = me ? !me.visionTestDone : false;
  const empty = !!encounters.data && incoming.length + people.today.length === 0;
  const failed = accept.error ?? decline.error;
  // Une seule proposition Minimoa+, jamais sur une liste vide.
  const far = encounters.data?.far ?? null;
  const offerKind = quartierOffer({
    plus: !!me?.plus,
    loaded: !!encounters.data && !!me,
    empty,
    noVision,
    far: !!far,
    screen: !!plusOffer,
    today: people.today.length,
  });
  const offer =
    offerKind === 'far' && far ? (
      // Vu de loin : de vraies personnes compatibles hors de ta zone, comptées par le serveur (docs/DESIR.md).
      <FarAwayCard
        kicker={t.far.kicker}
        title={far.label}
        text={t.far.text(petName)}
        ctaLabel={t.far.cta}
        onPress={() => openPlus('far_away')}
        species={FAR_SPECIES}
        count={far.count}
      />
    ) : offerKind === 'screen' ? (
      plusOffer
    ) : offerKind === 'more' ? (
      <EncounterMore
        pets={FAR_SPECIES.slice(0, 2).map((species) => ({ name: '', species }))}
        title={t.screen.moreTitle}
        text={t.screen.moreText(entitlements(true).presentationsPerDay)}
        onPress={() => openPlus('encounters')}
      />
    ) : null;

  const row = (n: Neighbor) => {
    if (selected === n.id && fiche) return <Fragment key={n.id}>{fiche}</Fragment>;
    const band = n.band ? chemin.carte.band[n.band] : null;
    const status = [n.relation === 'waved' ? t.waved : null, band].filter(Boolean).join(' · ');
    return (
      <EncounterRow
        key={n.id}
        person={n.user}
        reason={n.reason}
        badge={n.isNew ? t.badgeNew : undefined}
        status={status || undefined}
        accessibilityLabel={v.rowA11y(n.user.displayName, band)}
        onPress={() => onSelect(n.id)}
      />
    );
  };

  return (
    <>
      {header}
      {encounters.isError && !encounters.data ? (
        <Banner tone="error" title={t.loadError} text={v.loadErrorText} actionLabel={t.retry} onAction={() => void encounters.refetch()} />
      ) : null}
      {failed ? (
        <Banner
          tone="error"
          text={errorText(failed, t.actionError)}
          onClose={() => {
            accept.reset();
            decline.reset();
          }}
        />
      ) : null}
      {encounters.isPending ? (
        <>
          <Skeleton height={88} radius="lg" />
          <Skeleton height={88} radius="lg" />
        </>
      ) : null}

      {incoming.length > 0 ? <EncounterSection title={t.screen.waiting(incoming.length)} /> : null}
      {incoming.map((i) => (
        <EncounterWaiting
          key={i.id}
          person={i.from}
          title={t.screen.waitingTitle(i.from.displayName)}
          sub={t.screen.waitingSub(i.from.pet.name, petName, timeLabel(i.at))}
          reason={i.explanation?.common[0]?.text ?? null}
          declineLabel={t.decline}
          acceptLabel={t.screen.reply}
          openLabel={t.open}
          onOpen={() => router.push(`/rencontre/${i.from.id}`)}
          accepting={accept.isPending && accept.variables === i.id}
          declining={decline.isPending && decline.variables === i.id}
          onAccept={() =>
            accept.mutate(i.id, {
              onSuccess: (link) => {
                // Les deux minimoas se courent dessus au-dessus de l'écran pendant que le lien s'ouvre.
                if (pet) bump({ left: pet.species, right: i.from.pet.species });
                router.push(`/link/${link.id}`);
              },
            })
          }
          onDecline={() => decline.mutate(i.id)}
        />
      ))}

      {waveBlock && people.today.some((n) => n.relation === 'none') ? <Banner tone="info" text={waveBlock} /> : null}
      {people.today.map(row)}
      {offer}

      {showAround && people.around.length > 0 ? <EncounterSection title={v.around(people.around.length)} /> : null}
      {showAround ? people.around.map(row) : null}

      {/* Personne : on dit pourquoi, et ce qui aide (test de vision, inviter). */}
      {encounters.data && noVision ? (
        <EmptyState
          seed={pet?.id}
          species={pet?.species ?? 'nino'}
          mood="surpris"
          title={t.noVision.title}
          text={t.noVision.text(petName)}
          actionLabel={t.noVision.action}
          onAction={() => router.push(VISION_TEST_ROUTE)}
        />
      ) : null}
      {empty && !noVision && zone ? (
        <QuartierCard
          kicker={quartierText.card.kicker}
          title={zone.open ? quartierText.card.openTitle(zone.label) : quartierText.card.title(zone.label)}
          counter={zone.open ? quartierText.card.openCounter(zone.count) : quartierText.card.counter(zone.count, zone.threshold, zone.label)}
          progress={zone.open ? 1 : zone.count / Math.max(1, zone.threshold)}
          text={zone.open ? quartierText.card.openText(petName) : quartierText.card.text(petName)}
          actionLabel={quartier.copied ? quartierText.card.copied : quartierText.card.action}
          onAction={() => void quartier.share()}
          species={pet?.species ?? 'nino'}
        />
      ) : null}
      {empty && !noVision && !zone ? (
        <EmptyState
          seed={pet?.id}
          species={pet?.species ?? 'nino'}
          mood={firstDay ? 'neutre' : 'dodo'}
          title={t.emptyTitle}
          text={t.emptyText(petName)}
          actionLabel={invite.copied ? chatsText.copied : t.emptyAction}
          onAction={() => void invite.share()}
        />
      ) : null}

      {footer}

      {/* Demain, quelqu'un d'autre : la séance du jour aide le minimoa à mieux chercher. */}
      {pet && map.data && !noVision ? (
        <EncounterNext
          pet={pet}
          title={t.screen.nextTitle}
          text={hasSessionToDo(map.data) ? t.screen.nextTodo(petName) : t.screen.nextDone(petName)}
          onPress={() => (hasSessionToDo(map.data) ? router.push('/chemin/seance') : router.navigate('/(tabs)/pet'))}
        />
      ) : null}
    </>
  );
}
