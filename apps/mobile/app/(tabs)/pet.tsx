/**
 * Accueil de l'app (V6-GAccueil, docs/CHEMIN.md). En haut, la carte du minimoa, inchangée : scène, nom, bulle,
 * sociabilité, garde-robe ; jamais endormi le premier jour (`usePetSleep`), bulle de nuit. Dessous, **Ton chemin** :
 * le bandeau de la séance du jour (thème de l'unité, « 5 questions · 2 min », « À la fin : ta personne du jour »),
 * puis le chemin sinueux (étapes faites, celle du jour avec « Commencer », coffre, verrouillées) et la série en puce
 * (→ `/pet/serie`). Les 4 soins en pastille dans la carte du minimoa (en bas à gauche). Puis, s'il y a lieu, un bonjour reçu, un message, la position à
 * activer. États du jour : séance à faire, bonus, faite (revoir sa personne du jour, « Demain, une nouvelle séance »),
 * tout fait. Plus de question de sortie, de tuiles défi / habitudes, de jauges ni de défi en plein écran (V1 :
 * les écrans restent, joignables par leurs liens). `blowy://chemin` ouvre l'accueil sur la séance (`?chemin=1`).
 */
import { ApiError } from '@blowy/api-client';
import { careLabel, shapeLabel } from '@/locales/content';
import {
  CARE_ACTIONS,
  type CareAction,
  STREAK_MILESTONES,
  WELCOME_BACK_AFTER_DAYS,
  urgentNeed,
} from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  Appear,
  Banner,
  Button,
  CareBar,
  type CareProp,
  careProp,
  CheminPath,
  NOW_BAR_SPACE,
  NowBar,
  PeopleCard,
  PetHomeSkeleton,
  PetRefresh,
  type PetReaction,
  PetStage,
  SessionBanner,
  Skeleton,
  StreakCelebration,
  TabTemplate,
  formBodyPose,
  useHelloWave,
  usePetLure,
} from '@blowy/ui';
import { useFocusEffect, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, type ScrollView, useWindowDimensions, View } from 'react-native';

import { ScreenMotion } from '@/core';
import { errorText, useLinks } from '@/features/links';
import { AreaSheet, useLocation } from '@/features/map';
import { openLegal, useMe } from '@/features/me';
import { usePushIntroOnce, usePushPermission } from '@/features/notifications';
import { type PeopleToday, usePeopleToday } from '@/features/people';
import { pendingMeetReminder, useMeetReminders } from '@/features/safety';
import {
  careAvailable,
  careHot,
  homeEntrance,
  homeRest,
  pickLine,
  useCare,
  useHomeVisit,
  useLivePet,
  usePetSleep,
  useUnlocks,
  useWardrobe,
} from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { WelcomeBack } from '@/features/pet/WelcomeBack';
import { FirstWeekMoment, StreakMoment, useShareMomentPending } from '@/features/moments';
import { openPlus, usePlusMoment } from '@/features/plus';
import { maybeAskForReview, useReviewMemory } from '@/features/review';
import { usePrivateMemories, useRitualsToday, useStreakParty } from '@/features/rituals';
import {
  hasSessionToDo,
  pathAll,
  stepOf,
  todayView,
  useCheminMap,
  useCheminResults,
} from '@/features/chemin';
import { useProgression } from '@/features/progression';
import { accueil as a } from '@/locales/accueil';
import { progression as lp } from '@/locales/progression';
import { home as t } from '@/locales/pet';
import { carte } from '@/locales/rencontres';
import { chemin as c } from '@/locales/chemin';
import { rituels as r } from '@/locales/rituels';

/** Durée d'affichage d'une réplique après un soin (« miam. », « il n'a plus faim. »). */
const SAID_MS = 3500;

/** Les 4 soins, en pastille dans la carte (le câlin se fait aussi en touchant le minimoa). */
const HOME_CARE: readonly CareAction[] = CARE_ACTIONS;

export default function PetHome() {
  const router = useRouter();
  const pet = useLivePet();
  const wardrobe = useWardrobe();
  const today = useRitualsToday();
  const me = useMe();
  // La ligue en puce sur le chemin (façon Duolingo) : ton rang de la semaine, toujours sous les yeux.
  const prog = useProgression();
  const lg = prog.data?.league;
  const myRank = lg?.rows.find((r) => r.me)?.rank ?? null;
  // Le chemin entier défile : une fois par ouverture, l'écran descend jusqu'à l'étape du jour.
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrolledTo = useRef(false);
  const blockTop = useRef(0);
  const pathTop = useRef(0);
  const location = useLocation(me.data);
  const push = usePushPermission();
  const [locationDenied, setLocationDenied] = useState(false);
  // Refusée maintenant, ou déjà refusée pour de bon (iOS ne redemande plus : il faut passer par les Réglages).
  const locationRefused =
    locationDenied || (location.permission?.status === 'denied' && !location.permission.canAskAgain);
  const people = usePeopleToday(me.data, { locationRefused });
  const [areaSheet, setAreaSheet] = useState(false);
  const care = useCare();
  const chemin = useCheminMap();
  const lastResult = useCheminResults((x) => x.last);
  const params = useLocalSearchParams<{ chemin?: string }>();
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
  const [refreshing, setRefreshing] = useState(false);
  // Soin glissé de la barre jusqu'au pet : le pet le suit des yeux (même effet qu'un tap une fois lâché sur lui).
  const lure = usePetLure();
  // Un lien arrive au niveau où l'on se voit : un rappel calme, une fois par lien.
  const links = useLinks();
  const meetSeen = useMeetReminders((s) => s.seen);
  const dismissMeet = useMeetReminders((s) => s.dismiss);
  const meet = pendingMeetReminder(links.data, meetSeen);
  const opened = useRef(false);
  // Retour dans l'app (rare, budget partagé) : il fait coucou depuis sa scène, sans rien couvrir.
  const focused = useIsFocused();
  useHelloWave(
    () => {
      play('wave');
      say(t.hello);
    },
    { seed: pet.data?.pet.id, active: focused },
  );
  // Sommeil : jamais les premières 24 h ni la nuit (ambiance de nuit seulement) ; endormi le jour, l'écran le dit.
  const sleep = usePetSleep(pet.data?.pet.bornAt);
  // Un moment par ouverture : il arrive en marchant, fait coucou après plus de 12 h, bâille la nuit (passé son premier
  // jour) ; rien quand il boude.
  const entered = useRef(false);
  const shape = pet.data?.pet.shape;
  useEffect(() => {
    if (entered.current || !shape) return;
    entered.current = true;
    const now = Date.now();
    const visit = useHomeVisit.getState();
    const { moment, neglected: away3 } = homeEntrance({
      last: visit.last,
      now,
      night: sleep.night && !sleep.firstDay,
      sulking: shape === 'boude',
    });
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

  // Relue à chaque retour sur l'accueil (une séance vient peut-être de finir ailleurs).
  const { refetch: refetchChemin } = chemin;
  useFocusEffect(
    useCallback(() => {
      void refetchChemin();
    }, [refetchChemin]),
  );
  const busyCelebrating = unlocksWaiting || !!party;

  // `blowy://chemin` (rappel du matin) : l'accueil, puis la séance du jour s'il y en a une à faire (une fois).
  useEffect(() => {
    if (!params.chemin || opened.current || !chemin.data) return;
    opened.current = true;
    router.setParams({ chemin: undefined });
    if (hasSessionToDo(chemin.data)) router.push('/chemin/seance');
  }, [params.chemin, chemin.data, router]);

  // Notifications : l'écran d'avant-demande monte une fois, au premier passage calme sur l'accueil (rien d'autre en
  // cours : ni fête, ni défi du jour qui va monter, ni retour après une longue absence). La demande de position passe
  // d'abord ; si elle reste sans réponse, les notifications se proposent quand même à partir de la 2e session.
  const sessions = useReviewMemory((s) => s.sessions);
  const peopleSettled =
    people.kind !== 'loading' && people.kind !== 'vision' && (people.kind !== 'location' || sessions >= 2);
  usePushIntroOnce(
    push.permission,
    focused && !!pet.data && !!today.data && !busyCelebrating && !welcomeBack && peopleSettled,
  );
  // Moment clé (premier lien, 7 jours de série) : Minimoa+ proposé une fois, quand tout est calme et après les cartes à
  // partager et la demande des notifications ; le serveur décide et plafonne (docs/DESIR.md).
  const sharePending = useShareMomentPending(today.data?.streak.current, pet.data?.pet.bornAt);
  usePlusMoment(
    focused &&
      !!pet.data &&
      !!today.data &&
      !busyCelebrating &&
      !welcomeBack &&
      peopleSettled &&
      !sharePending &&
      push.permission !== 'undetermined',
    me.data?.plus,
  );

  const say = (text: string) => setSaid((s) => ({ text, key: (s?.key ?? 0) + 1 }));
  const play = (re: PetReaction, item: CareProp | null = null) => {
    setReactionItem(item);
    setReaction(re);
    setReactionKey((k) => k + 1);
  };
  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([pet.refetch(), wardrobe.refetch(), today.refetch(), chemin.refetch()]);
    setRefreshing(false);
  };
  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />
  );

  if (!pet.data) {
    return (
      <ScreenMotion>
        <TabTemplate gutter={14} top={6} refreshControl={refreshControl}>
          {pet.isPending ? (
            <PetHomeSkeleton />
          ) : (
            <Banner
              tone="error"
              title={t.loadError}
              text={pet.error?.message ?? ''}
              actionLabel={t.retry}
              onAction={() => void pet.refetch()}
            />
          )}
        </TabTemplate>
      </ScreenMotion>
    );
  }

  const { pet: p } = pet.data;
  const d = today.data;
  const streak = d?.streak;
  // Sa bulle : son besoin le plus urgent, sinon une phrase joyeuse.
  const urgent = urgentNeed(p.needs);
  const idleLine = urgent ? pickLine(t.speech[urgent], p.needs) : pickLine(t.happy, p.needs);
  const sulking = p.shape === 'boude';
  // Il boude : c'est sa bulle qui le dit (plus de carte d'alerte). La nuit, il propose de voir qui est près de chez toi.
  const speech = said?.text ?? (sulking ? t.sulkSpeech : idleLine);

  // Optimiste : il croque, joue ou dort à l'appui (jauges déjà à jour) ; un refus du serveur le fait revenir.
  const onCare = (action: CareAction) => {
    play(action, careProp(action, careTurn));
    setCareTurn((n) => n + 1);
    setNeglected(false);
    say(careLabel[action]?.done ?? '');
    care.mutate(action, {
      onError: (e) => {
        // Refus du pet (besoin déjà comblé) : il le dit lui-même dans sa bulle, et fait non de la tête.
        if (e instanceof ApiError && e.code === 'already_done') {
          play('no');
          say(e.message || (careLabel[action]?.refused ?? ''));
        }
      },
    });
  };

  const w = wardrobe.data;
  const careError = care.isError && !(care.error instanceof ApiError && care.error.code === 'already_done');
  const look = { species: p.species, outfit: p.outfit, name: p.name, id: p.id };
  // Câlin : toucher le minimoa (le quatrième soin, sans tuile).
  const onPetPress = () => {
    if (careAvailable(p.needs).cuddle) onCare('cuddle');
    else {
      play('no');
      say(careLabel.cuddle?.refused ?? '');
    }
  };
  const cm = chemin.data;
  const view = cm ? todayView(cm) : null;
  const step = cm ? stepOf(cm) : { step: 0, steps: 0 };
  const firstUnit = cm?.units[0]?.title ?? null;
  const firstUnitDone = !!cm && cm.units[0]?.state === 'done';
  const openSeance = () => router.push('/chemin/seance');
  // Un seul gros bouton, en bas : la chose à faire maintenant (un bonjour reçu, un message, la séance, sinon la journée faite).
  const now =
    people.kind === 'waved'
      ? {
          label: a.now.waved(people.name),
          sub: a.now.wavedSub,
          variant: 'accent' as const,
          onPress: () => router.push('/(tabs)/rencontres'),
        }
      : people.kind === 'wrote'
        ? {
            label: a.now.wrote(people.name),
            sub: people.preview ? a.wroteText(people.preview) : a.now.wroteSub,
            variant: 'accent' as const,
            onPress: () => router.push({ pathname: '/link/[id]', params: { id: people.linkId } }),
          }
        : view && (view.kind === 'todo' || view.kind === 'bonus')
          ? {
              label: a.now.seance,
              sub: a.now.seanceSub(view.questions),
              variant: 'accent' as const,
              onPress: openSeance,
            }
          : null;
  const nodeLabel = (n: { kind: string; title: string; unitTitle: string }) =>
    n.kind === 'done'
      ? c.home.node.done(n.title)
      : n.kind === 'current'
        ? c.home.node.current(n.title)
        : n.kind === 'chest'
          ? c.home.node.chest(n.unitTitle)
          : n.kind === 'chestOpen'
            ? c.home.node.chestOpen(n.unitTitle)
            : c.home.node.locked(n.title);

  return (
    <ScreenMotion>
      <PetRefresh species={p.species} refreshing={refreshing} onRefresh={refresh}>
        {(scroll) => (
          <TabTemplate
            gutter={14}
            top={6}
            bottomExtra={now ? NOW_BAR_SPACE : 0}
            {...scroll}
            scrollRef={scrollRef}
          >
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
              // Plus de bulle dans la carte : ses émotions (visage, humeur) suffisent.
              sleep={{
                after: sleep.sleepAfter,
                speech: '',
                wakeLabel: a.asleep.wake,
                wakeA11y: a.asleep.wakeA11y(p.name),
              }}
              action={{
                label: t.wardrobe,
                onPress: () => router.push('/pet/garde-robe'),
                accessibilityLabel: fresh.length
                  ? `${t.wardrobeA11y}, ${t.newCount(fresh.length)}`
                  : t.wardrobeA11y,
                badge: fresh.length ? String(fresh.length) : undefined,
              }}
              reaction={reaction}
              reactionKey={reactionKey}
              reactionItem={reactionItem}
              mood={homeRest({ form: p.form, needs: p.needs, sulking, neglected }) ?? formBodyPose(p.form)}
              habitat={roomy ? { photo: lastPhoto, night: sleep.night } : null}
              petLabel={a.petA11yCuddle(p.name)}
              onPetPress={onPetPress}
              lure={lure}
              meter={null}
              height={256}
              petSize={214}
              care={
                <CareBar
                  compact
                  actions={HOME_CARE}
                  labels={careLabel}
                  available={careAvailable(p.needs)}
                  hot={careHot(p.needs)}
                  size={44}
                  busy={null}
                  onCare={onCare}
                  lure={lure}
                  carry={{
                    feed: careProp('feed', careTurn),
                    play: careProp('play', careTurn),
                    nap: careProp('nap', careTurn),
                  }}
                  onRefused={(x) => {
                    play('no');
                    say(careLabel[x]?.refused ?? '');
                  }}
                />
              }
            />

            {/* Ton chemin : la séance du jour, le chemin, la série. */}
            {view && cm ? (
              <View onLayout={(e) => (blockTop.current = e.nativeEvent.layout.y)}>
                <Appear once="home:chemin" delay={60}>
                  <SessionBanner
                    tone={view.kind === 'todo' || view.kind === 'bonus' ? 'unit' : 'calm'}
                    kicker={
                      view.kind === 'todo'
                        ? c.home.path(step.step, step.steps)
                        : view.kind === 'bonus'
                          ? c.home.bonusKicker(view.questions)
                          : view.kind === 'done'
                            ? c.home.doneKicker
                            : c.home.restKicker
                    }
                    title={
                      view.kind === 'todo' || view.kind === 'bonus'
                        ? view.unitTitle
                        : view.kind === 'done'
                          ? c.home.doneTitle
                          : c.home.restTitle
                    }
                    note={view.kind === 'todo' ? null : view.kind === 'bonus' ? c.home.note : c.home.doneNote}
                    progress={view.kind === 'todo' && step.steps > 0 ? step.step / step.steps : null}
                    onPress={
                      view.kind === 'todo' || view.kind === 'bonus'
                        ? openSeance
                        : lastResult
                          ? () => router.push({ pathname: '/chemin/fin', params: { id: lastResult } })
                          : undefined
                    }
                    accessibilityLabel={
                      view.kind === 'todo' || view.kind === 'bonus'
                        ? c.home.startA11y(view.unitTitle)
                        : undefined
                    }
                    footer={
                      view.kind === 'done' && !me.data?.plus ? (
                        <Button
                          label={c.home.morePlus}
                          variant="glass"
                          size="md"
                          icon="plus"
                          onPress={() => openPlus('chemin_more')}
                        />
                      ) : undefined
                    }
                  />
                  <View onLayout={(e) => (pathTop.current = blockTop.current + e.nativeEvent.layout.y)}>
                    <CheminPath
                      nodes={pathAll(cm).map((n) =>
                        n.kind === 'unit'
                          ? {
                              key: n.key,
                              kind: n.kind,
                              index: (n.unitIndex ?? 1) - 1,
                              // Le premier univers est fait pendant l'inscription (le test) : on le dit, sinon on ne comprend pas.
                              subtitle:
                                n.unitIndex === 1 && n.done === n.total
                                  ? c.home.unitSignup
                                  : c.home.unitKicker(n.unitIndex ?? 1, n.done ?? 0, n.total ?? 0),
                              title: n.title,
                              accessibilityLabel: `${c.home.unitKicker(n.unitIndex ?? 1, n.done ?? 0, n.total ?? 0)}, ${n.title}`,
                            }
                          : {
                              key: n.key,
                              kind: n.kind,
                              accessibilityLabel:
                                n.kind === 'done' && firstUnitDone && n.unitTitle === firstUnit
                                  ? c.home.nodeSignup(n.title)
                                  : nodeLabel(n),
                            },
                      )}
                      onCurrentY={(y) => {
                        // Une seule fois par ouverture : l'écran descend jusqu'à l'étape du jour si elle est loin.
                        if (scrolledTo.current || y < 260) return;
                        scrolledTo.current = true;
                        setTimeout(
                          () => scrollRef.current?.scrollTo({ y: pathTop.current + y - 240, animated: true }),
                          350,
                        );
                      }}
                      startLabel={view.kind === 'todo' || view.kind === 'bonus' ? c.home.start : null}
                      onStart={view.kind === 'todo' || view.kind === 'bonus' ? openSeance : undefined}
                      pet={{ species: p.species, outfit: p.outfit, id: p.id }}
                      league={
                        lg && myRank
                          ? {
                              tier: lg.tier,
                              label: lp.league.pill(lp.league.tiers[lg.tier], myRank),
                              accessibilityLabel: lp.league.pillA11y(lp.league.tiers[lg.tier], myRank),
                              up: lg.toPromote === 0,
                              onPress: () => router.push('/moi/ligue'),
                            }
                          : null
                      }
                      streak={{
                        label: c.home.streak(cm.streak.current),
                        accessibilityLabel: c.home.streakA11y(cm.streak.current),
                        onPress: () => router.push('/pet/serie'),
                      }}
                    />
                  </View>
                </Appear>
              </View>
            ) : chemin.isPending ? (
              <Skeleton height={220} radius="lg" />
            ) : chemin.isError ? (
              <Banner
                tone="info"
                text={c.home.loadError}
                actionLabel={c.home.retry}
                onAction={() => void chemin.refetch()}
              />
            ) : null}

            {careError ? (
              <Banner tone="error" text={errorText(care.error, t.careError)} onClose={() => care.reset()} />
            ) : null}

            {/* Ce qui attend une réponse de toi (un bonjour, un message), ou la position à activer. */}
            <Appear once="home:people" delay={120}>
              <PeopleNow
                state={people}
                petName={p.name}
                locationDenied={locationRefused}
                locating={location.sending}
                onLocate={() => {
                  if (locationRefused && Platform.OS !== 'web') location.openSettings();
                  else void location.enable().then((res) => setLocationDenied(res === 'denied'));
                }}
                onChooseCity={() => setAreaSheet(true)}
                open={(href) => router.push(href)}
              />
            </Appear>
            {/* Sans position : choisir sa ville à la main (gratuit, App Review 5.1.1(iv)). */}
            <AreaSheet visible={areaSheet} onClose={() => setAreaSheet(false)} />

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
                onClose={() => {
                  // Palier de série (7, 30, 100 jours…) fêté : un bon moment pour une note, juste après la fête.
                  if ((STREAK_MILESTONES as readonly number[]).includes(party.streak))
                    maybeAskForReview('streak_milestone', 900);
                  clearParty();
                }}
              />
            ) : (
              <UnlockCelebration />
            )}
            {/* Palier 7 / 30 / 100 jours : une carte à partager, une fois, après la fête (docs/VIRALITE.md). */}
            {!party && !welcomeBack ? <StreakMoment streak={streak?.current} /> : null}
            {/* J7 : une semaine avec lui, une carte à partager (une fois ; pas le jour d'un palier de série). */}
            {!party && !welcomeBack && (streak?.current ?? 0) < 7 ? (
              <FirstWeekMoment bornAt={p.bornAt} />
            ) : null}
          </TabTemplate>
        )}
      </PetRefresh>
      {now ? <NowBar label={now.label} sub={now.sub} variant={now.variant} onPress={now.onPress} /> : null}
    </ScreenMotion>
  );
}

type Href = Parameters<ReturnType<typeof useRouter>['push']>[0];

/**
 * Sous le chemin, la position à activer (sans elle, personne à présenter). Un bonjour reçu ou un message passent par
 * le bouton du bas (`NowBar`). Les présentations passent désormais par la séance du jour (V1) ; le groupe,
 * le test de vision et « Nino cherche encore » ne sont plus ici.
 */
function PeopleNow({
  state,
  petName,
  locationDenied,
  locating,
  onLocate,
  onChooseCity,
  open,
}: {
  state: PeopleToday;
  petName: string;
  locationDenied: boolean;
  locating: boolean;
  onLocate: () => void;
  onChooseCity: () => void;
  open: (href: Href) => void;
}) {
  switch (state.kind) {
    case 'location':
      return (
        <PeopleCard
          kicker={a.kicker}
          title={a.locationTitle(petName)}
          text={locationDenied ? a.locationDenied : a.locationText}
          actionLabel={locationDenied ? a.locationSettings : a.locationAction}
          loading={locating}
          onPress={onLocate}
          footer={
            locationDenied ? (
              <Button label={carte.area.choose} variant="glass" size="sm" onPress={onChooseCity} block />
            ) : undefined
          }
        />
      );
    default:
      return null;
  }
}
