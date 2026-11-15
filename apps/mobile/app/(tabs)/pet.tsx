/**
 * Accueil de l'app (V6-GAccueil, V6-Boude) : le minimoa et sa sociabilité en vedette, la question du jour
 * (« tu as mis le nez dehors ? »), le défi du jour et la série, puis ses trois petits besoins et les quatre gestes.
 * À la première ouverture du jour, la carte du défi monte en plein écran (`/pet/defi`, décidé par le serveur).
 */
import { ApiError } from '@blowy/api-client';
import type { OutingAnswer } from '@blowy/contract';
import { careLabel, formLabel, itemLabel, needLabel, shapeLabel, statGoalLabel } from '@/locales/content';
import { type CareAction, urgentNeed } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Appear,
  Banner,
  CareBar,
  CareIcon,
  ChallengeEntry,
  EntryCard,
  Glyph,
  HeroMeter,
  Icon,
  ItemImage,
  NeedsPanel,
  OutingCard,
  PetHomeSkeleton,
  PetRefresh,
  type PetReaction,
  PetStage,
  Skeleton,
  StreakCelebration,
  StreakFlame,
  TabTemplate,
  usePetLure,
} from '@blowy/ui';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';

import { ScreenMotion } from '@/core';
import { VISION_TEST_ROUTE } from '@/features/encounters';
import { errorText } from '@/features/links';
import { useMe } from '@/features/me';
import { careAvailable, careHot, nextItem, pickLine, useCare, useLivePet, useUnlocks, useWardrobe } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { useAwayFromHome, useOuting, useRitualsToday, useStreakParty } from '@/features/rituals';
import { endOuting } from '@/features/widgets';
import { home as t } from '@/locales/pet';
import { rituels as r } from '@/locales/rituels';

/** Durée d'affichage d'une réplique après un soin (« miam. », « il n'a plus faim. »). */
const SAID_MS = 3500;
/** Sous ce seuil, la sociabilité est son besoin principal : il demande à sortir. */
const OUT_AT = 40;

export default function PetHome() {
  const router = useRouter();
  const pet = useLivePet();
  const wardrobe = useWardrobe();
  const today = useRitualsToday();
  const me = useMe();
  const care = useCare();
  const outing = useOuting();
  const away = useAwayFromHome(me.data?.identity.location.zone);
  const fresh = useUnlocks((s) => s.fresh);
  const party = useStreakParty((s) => s.party);
  const unlocksWaiting = useUnlocks((s) => s.queue.length > 0);
  const clearParty = useStreakParty((s) => s.clear);
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [said, setSaid] = useState<{ text: string; key: number } | null>(null);
  const [outingLine, setOutingLine] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Soin glissé de la barre jusqu'au pet : le pet le suit des yeux (même effet qu'un tap une fois lâché sur lui).
  const lure = usePetLure();
  const presented = useRef<string | null>(null);

  useEffect(() => {
    if (!said) return;
    const id = setTimeout(() => setSaid(null), SAID_MS);
    return () => clearTimeout(id);
  }, [said]);

  // Relu à chaque retour sur l'accueil (un défi « écrire » se valide à l'ouverture, côté serveur).
  const { refetch: refetchToday } = today;
  useFocusEffect(
    useCallback(() => {
      void refetchToday();
    }, [refetchToday]),
  );

  // Première ouverture du jour : la carte du défi monte (une fois par jour et par session ; le serveur ne la
  // présente plus une fois vue), après les fêtes en attente (objets gagnés, défi relevé).
  const challenge = today.data?.challenge;
  const busyCelebrating = unlocksWaiting || !!party;
  useFocusEffect(
    useCallback(() => {
      if (!challenge?.present || busyCelebrating || presented.current === challenge.day) return;
      presented.current = challenge.day;
      const id = setTimeout(() => router.push('/pet/defi'), 450);
      return () => clearTimeout(id);
    }, [challenge?.present, challenge?.day, busyCelebrating, router]),
  );

  const say = (text: string) => setSaid((s) => ({ text, key: (s?.key ?? 0) + 1 }));
  const play = (re: PetReaction) => {
    setReaction(re);
    setReactionKey((k) => k + 1);
  };
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([pet.refetch(), wardrobe.refetch(), today.refetch()]);
    setRefreshing(false);
  };
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />;

  if (!pet.data) {
    return (
      <ScreenMotion>
        <TabTemplate gutter={14} gap={10} top={6} refreshControl={refreshControl}>
          {pet.isPending ? (
            <PetHomeSkeleton />
          ) : (
            <Banner tone="error" title={t.loadError} text={pet.error?.message ?? ''} actionLabel={t.retry} onAction={() => void pet.refetch()} />
          )}
        </TabTemplate>
      </ScreenMotion>
    );
  }

  const { pet: p } = pet.data;
  const d = today.data;
  const streak = d?.streak;
  const challengeDone = streak?.doneToday ?? false;
  const sociability = d?.sociability ?? null;
  // Ce dont il a le plus besoin : sortir d'abord, puis faim, énergie, humeur.
  const needsOut = !!d && (d.needsOut || d.sociability < OUT_AT) && d.outing.canAnswer;
  const urgent = urgentNeed(p.needs);
  const idleLine = needsOut
    ? pickLine(r.speechOut, p.needs)
    : urgent
      ? pickLine(t.speech[urgent], p.needs)
      : d && !d.outing.canAnswer
        ? r.speechOutDone
        : pickLine(t.happy, p.needs);
  const speech = said?.text ?? idleLine;
  const sulking = p.shape === 'boude';

  const onCare = (action: CareAction) =>
    care.mutate(action, {
      onSuccess: () => {
        play(action);
        say(careLabel[action]?.done ?? '');
      },
      onError: (e) => {
        // Refus du pet (besoin déjà comblé) : il le dit lui-même dans sa bulle, et fait non de la tête.
        if (e instanceof ApiError && e.code === 'already_done') {
          play('no');
          say(e.message || (careLabel[action]?.refused ?? ''));
        }
      },
    });

  const onOuting = (answer: OutingAnswer) =>
    outing.mutate(
      { answer, awayFromHome: answer === 'not_yet' ? undefined : away() },
      {
        onSuccess: (res) => {
          setOutingLine(res.line);
          say(res.line);
          play(answer === 'not_yet' ? 'wave' : 'joy');
          // De retour : l'activité « de sortie » (si elle tourne) affiche « de retour » puis s'efface.
          if (answer !== 'not_yet') void endOuting();
        },
      },
    );

  const w = wardrobe.data;
  const owned = w?.items.filter((i) => i.state === 'owned').length ?? 0;
  const next = w ? nextItem(w.items) : null;
  const nextText = next
    ? t.wardrobeNext(itemLabel[next.id] ?? next.id, statGoalLabel[next.goal.stat]?.(next.goal.need) ?? '', next.goal.have, next.goal.need)
    : w
      ? t.wardrobeAll
      : t.wardrobeLoading;
  const careError = care.isError && !(care.error instanceof ApiError && care.error.code === 'already_done');
  const habitsText = d ? (d.habitsDue > 0 ? r.home.habitsDue(d.habitsDue) : r.home.habitsQuiet) : r.home.habitsNone;
  const look = { species: p.species, outfit: p.outfit, name: p.name, id: p.id };

  return (
    <ScreenMotion>
      <PetRefresh species={p.species} refreshing={refreshing} onRefresh={refresh}>
        {(scroll) => (
          <TabTemplate gutter={14} gap={10} top={6} {...scroll}>
            <PetStage
              pet={p}
              title={p.name.toUpperCase()}
              shape={p.shape}
              shapeLabel={shapeLabel[p.shape]?.title}
              speech={speech}
              action={{ label: t.wardrobe, onPress: () => router.push('/pet/garde-robe'), accessibilityLabel: t.wardrobeA11y }}
              reaction={reaction}
              reactionKey={reactionKey}
              petLabel={t.petA11y(p.name)}
              lure={lure}
              crest={streak ? <StreakFlame streak={streak.current} low={!streak.doneToday} igniteKey={streak.doneToday ? `${d?.day}:${streak.current}` : null} /> : null}
              meter={
                sociability !== null ? (
                  <HeroMeter
                    label={r.meter.label}
                    value={sociability}
                    suffix={r.meter.suffix}
                    lowAt={OUT_AT}
                    accessibilityLabel={r.meter.a11y(sociability)}
                  />
                ) : null
              }
            />

            {/* Pas encore de test de vision (inscrit sans le passer, ou compte V6) : pas de rencontres tant qu'il manque. */}
            {me.data && !me.data.visionTestDone ? (
              <Appear once="home:vision-test" delay={60}>
                <EntryCard
                  left={<Icon name="etoiles" size={34} />}
                  title={r.home.visionTestTitle(p.name)}
                  text={r.home.visionTestText}
                  chevron
                  onPress={() => router.push(VISION_TEST_ROUTE)}
                />
              </Appear>
            ) : null}

            {d?.unreadReviewId ? (
              <Appear once={`home:review:${d.unreadReviewId}`} delay={80}>
                <EntryCard
                  left={<Icon name="cadeau" size={34} />}
                  title={r.review.homeTitle}
                  text={r.review.homeText(p.name)}
                  chevron
                  onPress={() => router.push({ pathname: '/pet/bilan/[id]', params: { id: d.unreadReviewId as string } })}
                />
              </Appear>
            ) : null}

            {d ? (
              <Appear once="home:outing" delay={100}>
                <OutingCard
                  question={d.outing.question}
                  answers={d.outing.answers.map((a) => ({ ...a, emoji: r.outing.emoji[a.id] }))}
                  picked={d.outing.answer}
                  canAnswer={d.outing.canAnswer}
                  busy={outing.isPending ? (outing.variables?.answer ?? null) : null}
                  onAnswer={onOuting}
                  line={outingLine}
                  confirmedLabel={d.outing.confirmed ? r.outing.confirmed : null}
                  highlight={needsOut}
                />
              </Appear>
            ) : today.isPending ? (
              <Skeleton height={150} radius="lg" />
            ) : null}
            {outing.isError ? <Banner tone="error" text={errorText(outing.error, r.outing.error)} onClose={() => outing.reset()} /> : null}

            {d && streak ? (
              <Appear once="home:challenge" delay={140}>
                <ChallengeEntry
                  kicker={r.entry.kicker(d.challenge.kindLabel)}
                  title={d.challenge.text}
                  caption={challengeDone ? r.entry.done : d.challenge.status === 'accepted' ? d.challenge.howTo : r.entry.todo}
                  kind={d.challenge.kind}
                  done={challengeDone}
                  onPress={() => router.push('/pet/defi')}
                  streak={{
                    text: challengeDone ? String(streak.current) : r.entry.streakNext,
                    lit: streak.current > 0,
                    onPress: () => router.push('/pet/serie'),
                    accessibilityLabel: r.entry.streakA11y(streak.current),
                  }}
                />
              </Appear>
            ) : today.isPending ? (
              <Skeleton height={76} radius="lg" />
            ) : today.isError ? (
              <Banner tone="error" text={r.entry.error} actionLabel={r.entry.retry} onAction={() => void today.refetch()} />
            ) : null}

            {d?.proofAsked.map((ask) => (
              <Appear key={ask.habitRef} once={`home:proof:${ask.habitRef}`} delay={160}>
                <EntryCard
                  left={<Glyph name="camera" size={26} color={color.accent} />}
                  title={r.home.proofTitle(p.name)}
                  text={ask.ask}
                  chevron
                  onPress={() => router.push({ pathname: '/pet/preuve', params: { ref: ask.habitRef } })}
                />
              </Appear>
            ))}

            <NeedsPanel needs={p.needs} labels={needLabel} />
            <Appear once="home:care" delay={120}>
              <CareBar
                labels={careLabel}
                available={careAvailable(p.needs)}
                hot={careHot(p.needs)}
                busy={care.isPending ? care.variables : null}
                onCare={onCare}
                lure={lure}
                onRefused={(a) => {
                  play('no');
                  say(careLabel[a]?.refused ?? '');
                }}
              />
            </Appear>
            {careError ? <Banner tone="error" text={errorText(care.error, t.careError)} onClose={() => care.reset()} /> : null}

            <Appear once="home:habits" delay={180}>
              <EntryCard
                left={<Glyph name="camera" size={26} color={color.accent} />}
                title={r.home.habitsTitle}
                text={habitsText}
                chevron
                onPress={() => router.push('/pet/habitudes')}
              />
            </Appear>

            <Appear once="home:wardrobe" delay={200}>
              {sulking ? (
                <EntryCard tone="alert" left={<CareIcon name="door" size={30} color={color.danger} />} title={t.sulkTitle(p.name)} text={t.sulkText} />
              ) : (
                <EntryCard
                  left={<ItemImage id={next?.id ?? p.outfit.head ?? 'couronne'} size={46} />}
                  title={t.wardrobeTitle(owned, w?.items.length ?? 64)}
                  text={nextText}
                  badge={fresh.length ? t.newCount(fresh.length) : undefined}
                  onPress={() => router.push('/pet/garde-robe')}
                  accessibilityLabel={`${t.wardrobeA11y}, ${t.wardrobeTitle(owned, w?.items.length ?? 64)}, ${nextText}`}
                />
              )}
            </Appear>
            <Appear once="home:character" delay={260}>
              <EntryCard
                title={t.character}
                text={t.characterText(formLabel[p.form], challengeDone)}
                chevron
                onPress={() => router.push('/pet/caractere')}
                accessibilityLabel={`${t.characterA11y}, ${t.characterText(formLabel[p.form], challengeDone)}`}
              />
            </Appear>
            {party ? (
              <StreakCelebration
                visible
                pet={look}
                streak={party.streak}
                kicker={r.celebrate.kicker}
                title={r.celebrate.title(party.streak)}
                line={party.line ?? r.celebrate.fallback}
                record={party.streak > 1 && party.streak >= party.best ? r.celebrate.record : null}
                tapLabel={r.celebrate.tap}
                onClose={clearParty}
              />
            ) : (
              <UnlockCelebration />
            )}
          </TabTemplate>
        )}
      </PetRefresh>
    </ScreenMotion>
  );
}
