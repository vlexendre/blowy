/**
 * Accueil de l'app (V6-GAccueil, V6-Boude), une boucle : **les gens d'abord**. En tête, une carte « aujourd'hui » :
 * ce que ton minimoa a pour toi (« Léa te fait signe », « Nino a 3 personnes à te présenter », « Ton groupe : 2/3 ont
 * tenu »), ou ce qui lui manque (test, position, inviter) ; chaque action mène à la suivante (Rencontres, le chat, le
 * groupe). Dessous, le minimoa (nom, forme, bulle, envie de sortir) et trois soins ; le câlin se fait en le touchant.
 * La question de sortie quand il a besoin de sortir (« plus tu sors, plus il te présente de monde »). Puis trois
 * tuiles : défi (ou question) du jour, habitudes, « tout sur lui » (caractère, série, bilans, souvenirs). Une seule
 * série visible : la semaine, avec ses jokers. À la première ouverture du jour, la carte du défi monte en plein écran
 * (`/pet/defi`, décidé par le serveur).
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
  Button,
  CareBar,
  type CareLevel,
  type CareProp,
  careProp,
  Glyph,
  HeroMeter,
  Icon,
  OutingCard,
  PeopleCard,
  PetHomeSkeleton,
  PetRefresh,
  type PetReaction,
  PetStage,
  ShortcutRow,
  ShortcutTile,
  StreakStrip,
  Skeleton,
  StreakCelebration,
  TabTemplate,
  formBodyPose,
  isNight,
  useHelloWave,
  usePetLure,
} from '@blowy/ui';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, useWindowDimensions } from 'react-native';

import { ScreenMotion } from '@/core';
import { VISION_TEST_ROUTE } from '@/features/encounters';
import { errorText, useLinks } from '@/features/links';
import { AreaSheet, useLocation } from '@/features/map';
import { openLegal, useMe } from '@/features/me';
import { usePushIntroOnce, usePushPermission } from '@/features/notifications';
import { type PeopleToday, usePeopleToday } from '@/features/people';
import { pendingMeetReminder, useMeetReminders } from '@/features/safety';
import { careAvailable, careHot, homeEntrance, homeRest, pickLine, useCare, useHomeVisit, useLivePet, useUnlocks, useWardrobe } from '@/features/pet';
import { UnlockCelebration } from '@/features/pet/UnlockCelebration';
import { WelcomeBack } from '@/features/pet/WelcomeBack';
import { FirstWeekMoment, StreakMoment } from '@/features/moments';
import { maybeAskForReview, useReviewMemory } from '@/features/review';
import { useAwayFromHome, useOuting, usePrivateMemories, useRitualsToday, useStreakParty } from '@/features/rituals';
import { endOuting } from '@/features/widgets';
import { accueil as a } from '@/locales/accueil';
import { home as t } from '@/locales/pet';
import { carte } from '@/locales/rencontres';
import { rituels as r } from '@/locales/rituels';

/** Durée d'affichage d'une réplique après un soin (« miam. », « il n'a plus faim. »). */
const SAID_MS = 3500;
/** Sous ce seuil, la sociabilité est son besoin principal : il demande à sortir. */
const OUT_AT = 40;

/** Les soins de l'accueil : trois tuiles ; le câlin se fait en touchant le minimoa. */
const HOME_CARE: readonly CareAction[] = ['feed', 'play', 'nap'];

export default function PetHome() {
  const router = useRouter();
  const pet = useLivePet();
  const wardrobe = useWardrobe();
  const today = useRitualsToday();
  const me = useMe();
  const location = useLocation(me.data);
  const push = usePushPermission();
  const [locationDenied, setLocationDenied] = useState(false);
  // Refusée maintenant, ou déjà refusée pour de bon (iOS ne redemande plus : il faut passer par les Réglages).
  const locationRefused = locationDenied || (location.permission?.status === 'denied' && !location.permission.canAskAgain);
  const people = usePeopleToday(me.data, { locationRefused });
  const [areaSheet, setAreaSheet] = useState(false);
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

  // Notifications : l'écran d'avant-demande monte une fois, au premier passage calme sur l'accueil (rien d'autre en
  // cours : ni fête, ni défi du jour qui va monter, ni retour après une longue absence). La demande de position passe
  // d'abord ; si elle reste sans réponse, les notifications se proposent quand même à partir de la 2e session.
  const sessions = useReviewMemory((s) => s.sessions);
  const challengePending = !!challenge?.present && presented.current !== challenge.day;
  const peopleSettled = people.kind !== 'loading' && people.kind !== 'vision' && (people.kind !== 'location' || sessions >= 2);
  usePushIntroOnce(push.permission, focused && !!pet.data && !!today.data && !busyCelebrating && !welcomeBack && !challengePending && peopleSettled);

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

  const proof = d?.proofAsked[0] ?? null;
  const look = { species: p.species, outfit: p.outfit, name: p.name, id: p.id };
  // Câlin : toucher le minimoa (le quatrième soin, sans tuile).
  const onPetPress = () => {
    if (careAvailable(p.needs).cuddle) onCare('cuddle');
    else {
      play('no');
      say(careLabel.cuddle?.refused ?? '');
    }
  };
  const showOuting = !!d && (outingPinned || needsOut || (sulking && d.outing.canAnswer));
  const isQuestion = d?.challenge.kind === 'question';

  return (
    <ScreenMotion>
      <PetRefresh species={p.species} refreshing={refreshing} onRefresh={refresh}>
        {(scroll) => (
          <TabTemplate gutter={14} top={6} {...scroll}>
            {/* Les gens d'abord : ce que ton minimoa a pour toi aujourd'hui. */}
            <Appear once="home:people" delay={40}>
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
              petLabel={a.petA11yCuddle(p.name)}
              onPetPress={onPetPress}
              lure={lure}
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

            {/* Trois soins, chacun avec la barre du besoin qu'il comble ; le câlin, c'est toucher le minimoa. */}
            <Appear once="home:care" delay={60}>
              <CareBar
                actions={HOME_CARE}
                labels={careLabel}
                available={careAvailable(p.needs)}
                hot={careHot(p.needs)}
                levels={levels}
                busy={care.isPending ? care.variables : null}
                onCare={onCare}
                lure={lure}
                carry={{ feed: careProp('feed', careTurn), play: careProp('play', careTurn), nap: careProp('nap', careTurn) }}
                onRefused={(x) => {
                  play('no');
                  say(careLabel[x]?.refused ?? '');
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

            {/* Sortir : le levier des rencontres. La question monte quand il a besoin de sortir. */}
            {showOuting && d ? (
              <Appear once="home:outing" delay={100}>
                <OutingCard
                  compact
                  question={d.outing.question}
                  answers={d.outing.answers.map((x) => ({ ...x, emoji: r.outing.emoji[x.id], short: r.outing.short[x.id] }))}
                  picked={d.outing.answer}
                  canAnswer={d.outing.canAnswer}
                  busy={outing.isPending ? (outing.variables?.answer ?? null) : null}
                  onAnswer={onOuting}
                  line={outingLine ?? a.rule}
                  confirmedLabel={d.outing.confirmed ? r.outing.confirmed : null}
                  doneLabel={r.outing.done}
                  stayId="not_yet"
                  highlight={needsOut || (sulking && d.outing.canAnswer)}
                />
              </Appear>
            ) : today.isPending ? (
              <Skeleton height={56} radius="lg" />
            ) : null}
            {outing.isError ? <Banner tone="error" text={errorText(outing.error, r.outing.error)} onClose={() => outing.reset()} /> : null}
            {today.isError && !d ? <Banner tone="error" text={r.entry.error} actionLabel={r.entry.retry} onAction={() => void today.refetch()} /> : null}

            {/* Trois tuiles ; le reste vit dans « Tout sur lui » (caractère, série, bilans, souvenirs). */}
            <Appear once="home:more" delay={160}>
              <ShortcutRow>
                {d ? (
                  <ShortcutTile
                    label={isQuestion ? a.tiles.question : a.tiles.challenge}
                    icon={<Icon name="etoiles" size={22} />}
                    dot={!challengeDone}
                    onPress={() => router.push(challengeDone ? '/pet/serie' : '/pet/defi')}
                    accessibilityLabel={`${r.entry.kicker(d.challenge.kindLabel)}, ${d.challenge.text}`}
                  />
                ) : null}
                <ShortcutTile
                  label={a.tiles.habits}
                  icon={<Glyph name="camera" size={22} color={color.accent} />}
                  badge={habitsDue > 0 ? String(habitsDue) : proof ? '1' : undefined}
                  onPress={() => (proof ? router.push({ pathname: '/pet/preuve', params: { ref: proof.habitRef } }) : router.push('/pet/habitudes'))}
                  accessibilityLabel={proof ? `${r.home.proofTitle(p.name)}, ${proof.ask}` : t.habitsA11y(habitsDue)}
                />
                <ShortcutTile
                  label={a.tiles.more}
                  icon={<Avatar size={26} pet={look} hidden />}
                  dot={!!d?.unreadReviewId}
                  onPress={() => (d?.unreadReviewId ? router.push({ pathname: '/pet/bilan/[id]', params: { id: d.unreadReviewId } }) : router.push('/pet/caractere'))}
                  accessibilityLabel={d?.unreadReviewId ? r.review.homeTitle : a.moreA11y(p.name)}
                />
              </ShortcutRow>
            </Appear>

            {/* Une seule série visible : la semaine, avec ses jokers. */}
            {streak ? (
              <StreakStrip
                count={streak.current}
                days={streak.week.map((w, i) => ({ letter: r.streak.letters[i] ?? '', status: w.status }))}
                onPress={() => router.push('/pet/serie')}
                accessibilityLabel={r.entry.streakA11y(streak.current)}
              />
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
                  if ((STREAK_MILESTONES as readonly number[]).includes(party.streak)) maybeAskForReview('streak_milestone', 900);
                  clearParty();
                }}
              />
            ) : (
              <UnlockCelebration />
            )}
            {/* Palier 7 / 30 / 100 jours : une carte à partager, une fois, après la fête (docs/VIRALITE.md). */}
            {!party && !welcomeBack ? <StreakMoment streak={streak?.current} /> : null}
            {/* J7 : une semaine avec lui, une carte à partager (une fois ; pas le jour d'un palier de série). */}
            {!party && !welcomeBack && (streak?.current ?? 0) < 7 ? <FirstWeekMoment bornAt={p.bornAt} /> : null}
          </TabTemplate>
        )}
      </PetRefresh>
    </ScreenMotion>
  );
}

type Href = Parameters<ReturnType<typeof useRouter>['push']>[0];

/** La carte « aujourd'hui » : un état, une phrase, des minimoas, une action qui mène à la suite. */
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
  if (state.kind === 'loading') return <Skeleton height={150} radius="lg" />;
  switch (state.kind) {
    case 'waved':
      return (
        <PeopleCard
          kicker={a.kicker}
          title={a.waved(state.name)}
          text={state.more > 0 ? `${a.wavedText(state.pet.name)} ${a.wavedMore(state.more)}` : a.wavedText(state.pet.name)}
          people={[state.pet]}
          actionLabel={a.wavedAction}
          onPress={() => open('/(tabs)/rencontres')}
        />
      );
    case 'wrote':
      return (
        <PeopleCard
          kicker={a.kicker}
          title={a.wrote(state.name)}
          text={state.preview ? a.wroteText(state.preview) : undefined}
          people={[state.pet]}
          actionLabel={a.wroteAction}
          onPress={() => open({ pathname: '/link/[id]', params: { id: state.linkId } })}
        />
      );
    case 'present':
      return (
        <PeopleCard
          kicker={a.kicker}
          title={a.present(petName, state.count)}
          text={state.mutual ? a.presentFriend(state.mutual) : a.presentText}
          people={state.people}
          actionLabel={a.presentAction}
          onPress={() => open('/(tabs)/rencontres')}
        />
      );
    case 'group':
      return (
        <PeopleCard
          kicker={a.kicker}
          gradient="accent"
          title={a.group(state.name, state.upToDate, state.due)}
          text={state.mineDone ? a.groupMine.done : a.groupMine.todo}
          actionLabel={a.groupAction}
          onPress={() => open({ pathname: '/groupe/[id]', params: { id: state.groupId } })}
        />
      );
    case 'vision':
      return <PeopleCard kicker={a.kicker} title={a.visionTitle} text={a.visionText} actionLabel={a.visionAction} onPress={() => open(VISION_TEST_ROUTE)} />;
    case 'location':
      return (
        <PeopleCard
          kicker={a.kicker}
          title={a.locationTitle(petName)}
          text={locationDenied ? a.locationDenied : a.locationText}
          actionLabel={locationDenied ? a.locationSettings : a.locationAction}
          loading={locating}
          onPress={onLocate}
          footer={locationDenied ? <Button label={carte.area.choose} variant="glass" size="sm" onPress={onChooseCity} block /> : undefined}
        />
      );
    case 'empty':
      return (
        <PeopleCard
          kicker={a.kicker}
          gradient="night"
          title={a.emptyTitle(petName)}
          text={a.emptyText}
          actionLabel={a.emptyAction}
          onPress={() => open('/(onboarding)/invite')}
        />
      );
  }
}
