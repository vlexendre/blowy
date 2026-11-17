/**
 * Accueil de l'app (V6-GAccueil, V6-Boude). Son travail : s'occuper du minimoa. Dans le premier écran : la scène
 * (nom, forme, bulle, sociabilité) et les quatre soins, chacun avec la barre du besoin qu'il comble. Dessous, une seule
 * carte « maintenant » (la plus pressée : test de vision, sortie s'il a besoin de sortir, preuve, défi, bilan, sortie),
 * puis une rangée de tuiles (défi ou série, habitudes, garde-robe, caractère, et ce qui attend ailleurs).
 * À la première ouverture du jour, la carte du défi monte en plein écran (`/pet/defi`, décidé par le serveur).
 */
import { ApiError } from '@blowy/api-client';
import type { OutingAnswer } from '@blowy/contract';
import { careLabel, needLabel, shapeLabel } from '@/locales/content';
import { CARE_ACTIONS, CARE_EFFECTS, type CareAction, STREAK_MILESTONES, WELCOME_BACK_AFTER_DAYS, urgentNeed } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Appear,
  Avatar,
  Banner,
  CareBar,
  CareIcon,
  type CareLevel,
  type CareProp,
  careProp,
  ChallengeEntry,
  EntryCard,
  Glyph,
  HeroMeter,
  Icon,
  OutingCard,
  PetHomeSkeleton,
  PetRefresh,
  type PetReaction,
  PetStage,
  ShortcutRow,
  ShortcutTile,
  StreakStrip,
  Skeleton,
  StreakCelebration,
  StreakFlame,
  TabTemplate,
  Text,
  formBodyPose,
  isNight,
  useHelloWave,
  usePetLure,
} from '@blowy/ui';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, useWindowDimensions } from 'react-native';

import { ScreenMotion } from '@/core';
import { VISION_TEST_ROUTE } from '@/features/encounters';
import { useTogether } from '@/features/groups';
import { errorText, useLinks } from '@/features/links';
import { openLegal, useMe } from '@/features/me';
import { pendingMeetReminder, useMeetReminders } from '@/features/safety';
import { careAvailable, careHot, homeEntrance, homeRest, pickLine, useCare, useHomeVisit, useLivePet, useUnlocks, useWardrobe } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { WelcomeBack } from '@/features/pet/WelcomeBack';
import { useAwayFromHome, useOuting, usePrivateMemories, useRitualsToday, useStreakParty } from '@/features/rituals';
import { endOuting } from '@/features/widgets';
import { home as t } from '@/locales/pet';
import { groupes } from '@/locales/groupes';
import { rituels as r } from '@/locales/rituels';

/** Durée d'affichage d'une réplique après un soin (« miam. », « il n'a plus faim. »). */
const SAID_MS = 3500;
/** Sous ce seuil, la sociabilité est son besoin principal : il demande à sortir. */
const OUT_AT = 40;

/** La carte « maintenant » sous les soins : une seule à la fois, la plus pressée. */
type Now = 'vision' | 'outing' | 'proof' | 'challenge' | 'review';

export default function PetHome() {
  const router = useRouter();
  const pet = useLivePet();
  const wardrobe = useWardrobe();
  const today = useRitualsToday();
  const me = useMe();
  // Une suggestion « ensemble » pas encore acceptée : une tuile de plus (jamais une carte).
  const together = useTogether(me.data?.showHabits !== false);
  const togetherTip = together.data?.suggestions.find((x) => !x.proposed);
  const care = useCare();
  const outing = useOuting();
  const away = useAwayFromHome(me.data?.identity.location.zone);
  const fresh = useUnlocks((s) => s.fresh);
  const party = useStreakParty((s) => s.party);
  const unlocksWaiting = useUnlocks((s) => s.queue.length > 0);
  const clearParty = useStreakParty((s) => s.clear);
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  // Objet du soin (la nourriture et le jouet tournent d'un soin à l'autre) : glissé jusqu'au pet, puis tenu par lui.
  const [careTurn, setCareTurn] = useState(() => new Date().getDate());
  const [reactionItem, setReactionItem] = useState<CareProp | null>(null);
  // Délaissé (3 jours et plus sans ouvrir l'app) : « en danger » jusqu'au premier soin.
  const [neglected, setNeglected] = useState(false);
  // Retour après 14 jours et plus : il t'accueille et dit ce qui s'est passé (fermé d'un tap).
  const [welcomeBack, setWelcomeBack] = useState(false);
  // Petit habitat de la scène (flou d'arrière-plan) : pas sur les petits écrans.
  const roomy = useWindowDimensions().height >= 700;
  const memories = usePrivateMemories();
  const lastPhoto = memories.data?.pages[0]?.items[0]?.url ?? null;
  const [reactionKey, setReactionKey] = useState(0);
  const [said, setSaid] = useState<{ text: string; key: number } | null>(null);
  const [outingLine, setOutingLine] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Tuile « Sortie » touchée : la question du jour prend la place de la carte « maintenant ».
  const [outingPinned, setOutingPinned] = useState(false);
  // Soin glissé de la barre jusqu'au pet : le pet le suit des yeux (même effet qu'un tap une fois lâché sur lui).
  const lure = usePetLure();
  // Un lien arrive au niveau où l'on se voit : un rappel calme, une fois par lien.
  const links = useLinks();
  const meetSeen = useMeetReminders((s) => s.seen);
  const dismissMeet = useMeetReminders((s) => s.dismiss);
  const meet = pendingMeetReminder(links.data, meetSeen);
  const presented = useRef<string | null>(null);
  // Retour dans l'app (rare, budget partagé) : il fait coucou depuis sa scène, sans rien couvrir.
  const focused = useIsFocused();
  useHelloWave(
    () => {
      play('wave');
      say(t.hello);
    },
    { seed: pet.data?.pet.id, active: focused },
  );
  // Un moment par ouverture : il arrive en marchant, ou fait coucou après plus de 12 h (rien la nuit ni quand il boude).
  const entered = useRef(false);
  const shape = pet.data?.pet.shape;
  useEffect(() => {
    if (entered.current || !shape) return;
    entered.current = true;
    const now = Date.now();
    const visit = useHomeVisit.getState();
    const { moment, neglected: away3 } = homeEntrance({ last: visit.last, now, night: isNight(), sulking: shape === 'boude' });
    if (visit.last !== null && now - visit.last >= WELCOME_BACK_AFTER_DAYS * 86_400_000) setWelcomeBack(true);
    visit.mark(now);
    if (away3) setNeglected(true);
    if (!moment) return;
    // Il part tout de suite (sinon on le verrait une image à sa place avant qu'il arrive) ; le coucou attend un peu.
    setTimeout(
      () => {
        play(moment);
        if (moment === 'wave' || moment === 'welcome') say(t.hello);
      },
      moment === 'arrive' ? 0 : moment === 'welcome' ? 900 : 260,
    );
    // `play` et `say` ne changent que l'état local : lus au moment du moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);

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
  const play = (re: PetReaction, item: CareProp | null = null) => {
    setReactionItem(item);
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
        <TabTemplate gutter={14} top={6} refreshControl={refreshControl}>
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
  const sulking = p.shape === 'boude';
  // Il boude : c'est sa bulle qui le dit (plus de carte d'alerte).
  const speech = said?.text ?? (sulking ? t.sulkSpeech : idleLine);

  const onCare = (action: CareAction) =>
    care.mutate(action, {
      onSuccess: () => {
        play(action, careProp(action, careTurn));
        setCareTurn((n) => n + 1);
        setNeglected(false);
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
          setOutingPinned(false);
          say(res.line);
          // Pas encore : il réfléchit ; sorti : il rentre en marchant, puis saute de joie.
          if (answer === 'not_yet') play('think');
          else {
            play('arrive');
            setTimeout(() => play('joy'), 1250);
          }
          // De retour : l'activité « de sortie » (si elle tourne) affiche « de retour » puis s'efface.
          if (answer !== 'not_yet') void endOuting();
        },
      },
    );

  const w = wardrobe.data;
  const careError = care.isError && !(care.error instanceof ApiError && care.error.code === 'already_done');
  const habitsDue = d?.habitsDue ?? 0;
  // Chaque soin porte la barre du besoin qu'il comble (jeu et câlin : l'humeur).
  const levels = {} as Record<CareAction, CareLevel>;
  for (const a of CARE_ACTIONS) {
    const k = CARE_EFFECTS[a].fills;
    const v = Math.round(p.needs[k]);
    const n = needLabel[k];
    const read = t.levelA11y(n?.name ?? k, v);
    levels[a] = { value: v, lowAt: OUT_AT, accessibilityLabel: v < OUT_AT && n ? `${read}, ${n.low}` : read };
  }

  // Une seule carte « maintenant », la plus pressée ; le reste attend dans les tuiles (un tap).
  const proof = d?.proofAsked[0] ?? null;
  const pending: Record<Now, boolean> = {
    vision: !!me.data && !me.data.visionTestDone,
    outing: !!d,
    proof: !!proof,
    challenge: !!d && !challengeDone,
    review: !!d?.unreadReviewId,
  };
  const order: Now[] = ['vision', ...(needsOut ? (['outing'] as const) : []), 'proof', 'challenge', 'review', 'outing'];
  const now: Now | null = outingPinned && d ? 'outing' : (order.find((k) => pending[k]) ?? null);
  const streakTile = !!streak && (challengeDone || now === 'challenge');
  const look = { species: p.species, outfit: p.outfit, name: p.name, id: p.id };

  return (
    <ScreenMotion>
      <PetRefresh species={p.species} refreshing={refreshing} onRefresh={refresh}>
        {(scroll) => (
          <TabTemplate gutter={14} top={6} {...scroll}>
            {streak ? (
              <StreakStrip
                count={streak.current}
                days={streak.week.map((w, i) => ({ letter: r.streak.letters[i] ?? '', status: w.status }))}
                onPress={() => router.push('/pet/serie')}
                accessibilityLabel={r.entry.streakA11y(streak.current)}
              />
            ) : null}
            <PetStage
              pet={p}
              title={p.name.toUpperCase()}
              shape={p.shape}
              shapeLabel={shapeLabel[p.shape]?.title}
              onShapePress={
                sulking
                  ? () => {
                      play('no');
                      say(t.sulkWhy);
                    }
                  : undefined
              }
              shapeA11y={sulking ? t.sulkA11y : undefined}
              speech={speech}
              action={{
                label: t.wardrobe,
                onPress: () => router.push('/pet/garde-robe'),
                accessibilityLabel: fresh.length ? `${t.wardrobeA11y}, ${t.newCount(fresh.length)}` : t.wardrobeA11y,
                badge: fresh.length ? String(fresh.length) : undefined,
              }}
              reaction={reaction}
              reactionKey={reactionKey}
              reactionItem={reactionItem}
              mood={homeRest({ form: p.form, needs: p.needs, sulking, neglected }) ?? formBodyPose(p.form)}
              habitat={roomy ? { photo: lastPhoto, night: isNight() } : null}
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

            {/* Les soins et ses besoins, d'un bloc : chaque geste porte la barre du besoin qu'il comble. */}
            <Appear once="home:care" delay={60}>
              <CareBar
                labels={careLabel}
                available={careAvailable(p.needs)}
                hot={careHot(p.needs)}
                levels={levels}
                busy={care.isPending ? care.variables : null}
                onCare={onCare}
                lure={lure}
                carry={{ feed: careProp('feed', careTurn), play: careProp('play', careTurn), nap: careProp('nap', careTurn) }}
                onRefused={(a) => {
                  play('no');
                  say(careLabel[a]?.refused ?? '');
                }}
              />
            </Appear>
            {careError ? <Banner tone="error" text={errorText(care.error, t.careError)} onClose={() => care.reset()} /> : null}

            {/* Retour après une longue absence : ce qui s'est passé pendant ce temps. */}
            {welcomeBack ? <WelcomeBack petName={p.name} onClose={() => setWelcomeBack(false)} /> : null}

            {/* Rappel de sécurité avant de se voir : gardé tel quel (une fois par lien, on le ferme). */}
            {meet ? (
              <Appear once={`home:meet:${meet.id}`} delay={150}>
                <Banner
                  tone="info"
                  title={t.meetTitle(meet.other.displayName)}
                  text={t.meetText}
                  actionLabel={t.meetAction}
                  onAction={openLegal('securite')}
                  actionBelow
                  onClose={() => dismissMeet(meet.id)}
                  closeLabel={t.meetClose}
                />
              </Appear>
            ) : null}

            {/* Une seule carte « maintenant ». */}
            {now === 'vision' ? (
              <Appear once="home:vision-test" delay={100}>
                <EntryCard
                  left={<Icon name="etoiles" size={30} />}
                  title={r.home.visionTestTitle}
                  text={r.home.visionTestText}
                  chevron
                  onPress={() => router.push(VISION_TEST_ROUTE)}
                />
              </Appear>
            ) : now === 'outing' && d ? (
              <Appear once="home:outing" delay={100}>
                <OutingCard
                  compact
                  question={d.outing.question}
                  answers={d.outing.answers.map((a) => ({ ...a, emoji: r.outing.emoji[a.id], short: r.outing.short[a.id] }))}
                  picked={d.outing.answer}
                  canAnswer={d.outing.canAnswer}
                  busy={outing.isPending ? (outing.variables?.answer ?? null) : null}
                  onAnswer={onOuting}
                  line={outingLine}
                  confirmedLabel={d.outing.confirmed ? r.outing.confirmed : null}
                  doneLabel={r.outing.done}
                  stayId="not_yet"
                  highlight={needsOut || (sulking && d.outing.canAnswer)}
                />
              </Appear>
            ) : now === 'proof' && proof ? (
              <Appear once={`home:proof:${proof.habitRef}`} delay={100}>
                <EntryCard
                  left={<Glyph name="camera" size={24} color={color.accent} />}
                  title={r.home.proofTitle(p.name)}
                  text={proof.ask}
                  chevron
                  onPress={() => router.push({ pathname: '/pet/preuve', params: { ref: proof.habitRef } })}
                />
              </Appear>
            ) : now === 'challenge' && d && streak ? (
              <Appear once="home:challenge" delay={100}>
                <ChallengeEntry
                  compact
                  kicker={r.entry.kicker(d.challenge.kindLabel)}
                  title={d.challenge.text}
                  kind={d.challenge.kind}
                  done={challengeDone}
                  onPress={() => router.push('/pet/defi')}
                  streak={{
                    text: streak.current > 0 ? String(streak.current) : r.entry.streakNext,
                    lit: streak.current > 0,
                    onPress: () => router.push('/pet/serie'),
                    accessibilityLabel: r.entry.streakA11y(streak.current),
                  }}
                />
              </Appear>
            ) : now === 'review' && d?.unreadReviewId ? (
              <Appear once={`home:review:${d.unreadReviewId}`} delay={100}>
                <EntryCard
                  left={<Icon name="cadeau" size={30} />}
                  title={r.review.homeTitle}
                  text={r.review.homeText(p.name)}
                  chevron
                  onPress={() => router.push({ pathname: '/pet/bilan/[id]', params: { id: d.unreadReviewId as string } })}
                />
              </Appear>
            ) : today.isPending ? (
              <Skeleton height={56} radius="lg" />
            ) : null}
            {outing.isError ? <Banner tone="error" text={errorText(outing.error, r.outing.error)} onClose={() => outing.reset()} /> : null}
            {today.isError && !d ? <Banner tone="error" text={r.entry.error} actionLabel={r.entry.retry} onAction={() => void today.refetch()} /> : null}

            {/* Le reste, en tuiles sans description : un tap chacune. */}
            <Appear once="home:more" delay={160}>
              <ShortcutRow>
                {streak && d && !streakTile ? (
                  <ShortcutTile
                    label={t.tiles.challenge}
                    icon={<Icon name="etoiles" size={22} />}
                    dot
                    onPress={() => router.push('/pet/defi')}
                    accessibilityLabel={`${r.entry.kicker(d.challenge.kindLabel)}, ${d.challenge.text}`}
                  />
                ) : null}
                <ShortcutTile
                  label={t.tiles.habits}
                  icon={<Glyph name="camera" size={22} color={color.accent} />}
                  badge={habitsDue > 0 ? String(habitsDue) : undefined}
                  onPress={() => router.push('/pet/habitudes')}
                  accessibilityLabel={t.habitsA11y(habitsDue)}
                />
                <ShortcutTile
                  label={t.tiles.character}
                  icon={<Avatar size={26} pet={look} hidden />}
                  onPress={() => router.push('/pet/caractere')}
                  accessibilityLabel={t.characterA11y}
                />
                {/* Ce qui attend mais n'est pas la carte du moment. */}
                {pending.review && now !== 'review' && d?.unreadReviewId ? (
                  <ShortcutTile
                    label={t.tiles.review}
                    icon={<Icon name="cadeau" size={24} />}
                    dot
                    onPress={() => router.push({ pathname: '/pet/bilan/[id]', params: { id: d.unreadReviewId as string } })}
                    accessibilityLabel={r.review.homeTitle}
                  />
                ) : null}
                {proof && now !== 'proof' ? (
                  <ShortcutTile
                    label={t.tiles.proof}
                    icon={<Glyph name="camera" size={22} color={color.accent} />}
                    dot
                    onPress={() => router.push({ pathname: '/pet/preuve', params: { ref: proof.habitRef } })}
                    accessibilityLabel={`${r.home.proofTitle(p.name)}, ${proof.ask}`}
                  />
                ) : null}
                {d?.outing.canAnswer && now !== 'outing' ? (
                  <ShortcutTile
                    label={t.tiles.outing}
                    icon={<CareIcon name="door" size={24} color={color.accent} />}
                    dot={needsOut}
                    onPress={() => setOutingPinned(true)}
                    accessibilityLabel={d.outing.question}
                  />
                ) : null}
                {/* « La tenir ensemble » (spéc. §26) : des personnes près de toi tiennent la même habitude. */}
                {togetherTip ? (
                  <ShortcutTile
                    label={groupes.together.tile}
                    icon={<Text size={20}>{r.habits.emoji[togetherTip.habitId] ?? '🤝'}</Text>}
                    dot
                    onPress={() => router.push('/pet/habitudes')}
                    accessibilityLabel={togetherTip.text}
                  />
                ) : null}
              </ShortcutRow>
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
                milestone={(STREAK_MILESTONES as readonly number[]).includes(party.streak)}
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

