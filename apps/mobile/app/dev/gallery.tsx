/**
 * Galerie de développement du design system (@blowy/ui) : chaque atome, molécule, organisme et gabarit
 * avec des données d'exemple réalistes. Route : /dev/gallery.
 */
import { careLabel, eventLabel, formLabel, gaugeLabel, itemLabel, levelLabel, needLabel, shapeLabel, slotLabel, statGoalLabel } from '@blowy/content';
import {
  applyCare,
  CARE_ACTIONS,
  type CareAction,
  canCare,
  earnedItems,
  type GaugeKey,
  type Gauges,
  ITEM_SLOTS,
  ITEMS,
  type ItemSlot,
  itemProgress,
  type Needs,
  type Outfit,
  shapeOf,
  type Species,
} from '@blowy/domain';
import { color, radius, space } from '@blowy/tokens';
import {
  alpha,
  Avatar,
  AvatarPair,
  Badge,
  Banner,
  BottomTabBar,
  type BottomTabItem,
  Button,
  Card,
  CareBar,
  CareButton,
  CareIcon,
  ChallengeCard,
  ChatThread,
  Chip,
  ChoiceCard,
  Composer,
  type ComposerTone,
  DayChip,
  Divider,
  DressedPet,
  EmptyState,
  EvolutionTimeline,
  FeatureRow,
  GaugeBar,
  GaugePanel,
  GhostPanel,
  Glyph,
  GLYPHS,
  Header,
  Hearts,
  Icon,
  ICON_NAMES,
  IconButton,
  IncomingCard,
  ItemImage,
  ItemTile,
  LevelLadder,
  LevelPill,
  LinkRow,
  type LinkLook,
  LinkTemplate,
  ListRow,
  LivesPanel,
  MemoryGrid,
  type MessageLook,
  MessageBubble,
  NeedMeter,
  NeedsPanel,
  OnboardingTemplate,
  OtpInput,
  OutfitPreview,
  Panel,
  type PersonLook,
  type PetEventLook,
  PetBadge,
  PetHero,
  PetImage,
  type PetReaction,
  PetStage,
  type PetLook,
  PhotoTile,
  PlanPicker,
  ProgressBar,
  QuizStep,
  ScreenTemplate,
  SegmentedTabs,
  SettingsSection,
  SheetTemplate,
  SlotTabs,
  Skeleton,
  Spacer,
  SpeciesPicker,
  SpeechBubble,
  StatTile,
  StepProgress,
  Sticker,
  StreakPill,
  SuggestionCard,
  TabBarItem,
  TabTemplate,
  Text,
  TextField,
  Title,
  TodayCard,
  type TodayCardLabels,
  UnlockSheet,
  UnlockToast,
  WardrobeGrid,
  type WardrobeItemLook,
  WordsShareCard,
} from '@blowy/ui';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// ── Données d'exemple ────────────────────────────────────────────────────────
const nino: PetLook = { name: 'Nino', species: 'nino', form: 'joueur', mood: 'joie', outfit: { head: 'casquette', face: 'lunettes_rondes', body: 'echarpe', toy: 'ballon' } };
const photo = (seed: string): string => `https://picsum.photos/seed/${seed}/400/500`;

const lea: PersonLook = { displayName: 'Léa', pet: { name: 'Suzie', species: 'suzie', form: 'tendre', mood: 'joie', outfit: { head: 'couronne', face: 'joues_roses', body: 'collier_perles' } }, face: 'hidden', avatarUrl: photo('lea') };
const malo: PersonLook = { displayName: 'Malo', pet: { name: 'Gaston', species: 'gaston', form: 'joueur', mood: 'neutre' }, face: 'blurred', avatarUrl: photo('malo') };
const sasha: PersonLook = { displayName: 'Sasha', pet: { name: 'Pia', species: 'pia', form: 'piquant', mood: 'salut', outfit: { head: 'cornes', face: 'lunettes_etoile', toy: 'micro' } }, face: 'hidden', avatarUrl: null };
const tom: PersonLook = { displayName: 'Tom', pet: { name: 'Bob', species: 'nino', form: 'equilibre', mood: 'triste' }, face: 'hidden', avatarUrl: null };

const links: { link: LinkLook; time: string; author: string; level: string; isNew?: boolean }[] = [
  { link: { other: lea, myPet: nino, status: 'active', lives: 5, level: 3, unread: 2, lastMessage: { preview: '🔥 12 jours. ne casse pas la série', at: '' } }, time: '21:04', author: 'nino :', level: 'niv. 3' },
  { link: { other: malo, myPet: nino, status: 'active', lives: 6, level: 2, unread: 0, lastMessage: { preview: 'quiz dispo. le perdant paie le kebab', at: '' } }, time: '19:30', author: 'gaston :', level: 'niv. 2' },
  { link: { other: sasha, myPet: nino, status: 'active', lives: 7, level: 1, unread: 0, lastMessage: { preview: 'on s’est croisés rue oberkampf 👀', at: '' } }, time: 'hier', author: 'pia :', level: 'niv. 1', isNew: true },
  { link: { other: tom, myPet: nino, status: 'ghost', lives: 0, level: 2, unread: 0, lastMessage: { preview: 'plus un bruit depuis 7 jours', at: '' } }, time: 'lun.', author: 'son pet :', level: 'niv. 2' },
];

const at = (d: string, h: string): string => `2026-11-${d}T${h}:00+01:00`;
const messages: MessageLook[] = [
  { id: 'm0', author: 'system', kind: 'text', body: 'Nino et Suzie se sont trouvés', mediaUrl: null, at: at('09', '18:00') },
  { id: 'm1', author: 'other', kind: 'text', body: 'nino a réveillé suzie à 7 h pour lui montrer un pigeon. c’est ton éducation ça', mediaUrl: null, at: at('10', '08:02') },
  { id: 'm2', author: 'me', kind: 'text', body: 'il a l’œil, c’est tout. le pigeon était magnifique', mediaUrl: null, at: at('10', '08:05') },
  { id: 'm3', author: 'other_pet', kind: 'text', body: 'le pigeon était moyen. par contre vous deux, vous vous couchez à 3 h et ça se voit 🫣', mediaUrl: null, at: at('10', '08:06') },
  { id: 'm4', author: 'my_pet', kind: 'text', body: 'je vous en fais un défi ? 7 jours couchés avant minuit. le perdant paie le brunch 😈', mediaUrl: null, at: at('10', '08:07') },
  { id: 'm5', author: 'my_pet', kind: 'event', body: 'nino a lancé un défi : avant minuit au lit', mediaUrl: null, at: at('10', '08:07') },
  { id: 'm6', author: 'other', kind: 'text', body: 'deal. prépare ta carte bleue 💅', mediaUrl: null, at: at('10', '08:09') },
  { id: 'm7', author: 'me', kind: 'photo', body: null, mediaUrl: photo('brunch'), at: at('10', '12:30') },
  { id: 'm8', author: 'me', kind: 'text', body: 'preuve : brunch réservé', mediaUrl: null, at: at('10', '12:31') },
];

const gauges: Gauges = { social: 45, play: 70, tender: -10, talk: 20 };
const gaugeNames: Record<GaugeKey, string> = { social: 'sociabilité', play: 'jeu', tender: 'tendresse', talk: 'parole' };

const events: PetEventLook[] = [
  { id: 'e1', kind: 'met_new_pet', delta: { social: 12 }, at: '2026-11-10' },
  { id: 'e2', kind: 'challenge_done', delta: { play: 10 }, at: '2026-11-09' },
  { id: 'e3', kind: 'tease', delta: { tender: -8, play: 3 }, at: '2026-11-08' },
  { id: 'e4', kind: 'three_words', delta: { social: 6, talk: -5 }, at: '2026-11-07' },
];

const todayLabels: TodayCardLabels = {
  title: [{ text: 'UNE PHOTO\n' }, { text: 'PAR JOUR', dim: true }],
  streakUnit: 'jours',
  hint: '+1 vie quand vous avez posté tous les deux.',
  mine: { label: 'ta photo · 9:12', badge: 'posté ✓', emptyTitle: 'prends ta photo', emptyCaption: 'avant minuit' },
  theirs: { waitingTitle: 'léa : en attente', waitingCaption: 'elle a jusqu’à minuit', lockedTitle: 'léa a posté', lockedCaption: 'poste la tienne pour voir', label: 'léa · 10:40' },
  cta: 'relancer léa',
};

const memoryDays = ['2026-10-12', '2026-10-19', '2026-10-27', '2026-11-03', '2026-11-08', '2026-11-10'].map((day) => ({ day, myPhotoUrl: photo(`me${day}`), theirPhotoUrl: photo(`lea${day}`) }));
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const shortDay = (d: string): string => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1] ?? ''}`;

const tabs = [
  { key: 'today', label: 'aujourd’hui' },
  { key: 'chat', label: 'chat' },
  { key: 'memories', label: 'souvenirs' },
] as const;
type LinkTab = (typeof tabs)[number]['key'];

const navItems: BottomTabItem<'chats' | 'pet' | 'encounters' | 'me'>[] = [
  { key: 'chats', label: 'Chats', glyph: 'chat', badge: 3 },
  { key: 'pet', label: 'Mon pet', glyph: 'heart' },
  { key: 'encounters', label: 'Rencontres', glyph: 'people', badge: 2 },
  { key: 'me', label: 'Moi', glyph: 'person' },
];

const speciesNames: Record<Species, string> = { nino: 'Nino', suzie: 'Suzie', gaston: 'Gaston', pia: 'Pia' };

// ── Mise en page de la galerie ───────────────────────────────────────────────
function Level({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.level}>
      <Title text={[{ text: title }, { text: ' ·', dim: true }]} size={44} />
      {children}
    </View>
  );
}

function Item({ name, children }: { name: string; children: ReactNode }) {
  return (
    <View style={styles.item}>
      <Text variant="label" color={color.accent}>
        {name}
      </Text>
      {children}
    </View>
  );
}

function Frame({ height, children }: { height: number; children: ReactNode }) {
  return <View style={[styles.frame, { height }]}>{children}</View>;
}

// ── Soins et garde-robe ──────────────────────────────────────────────────────
const SPECIES: readonly Species[] = ['nino', 'suzie', 'gaston', 'pia'];
const demoStats = { careDays: 4, links: 2, bestLevel: 3, bestStreak: 3, challenges: 2, words: 1 };
const earned = new Set(earnedItems(demoStats));
const wardrobe: WardrobeItemLook[] = ITEMS.map((i) => {
  const p = itemProgress(i, demoStats);
  return {
    id: i.id,
    slot: i.slot,
    state: i.unlock.kind === 'premium' ? 'premium' : earned.has(i.id) ? 'owned' : 'locked',
    goal: i.unlock.kind === 'stat' && p ? { stat: i.unlock.stat, have: p.have, need: p.need } : null,
  };
});
const looks: Record<Species, Outfit> = {
  nino: { head: 'bob', face: 'lunettes_coeur', body: 'sweat', toy: 'skate' },
  suzie: { head: 'lapin', face: 'taches_rousseur', body: 'tutu', toy: 'doudou' },
  gaston: { head: 'pirate', face: 'cache_oeil', body: 'cape', toy: 'cadeau' },
  pia: { head: 'sorcier', face: 'monocle', body: 'ailes', toy: 'potion' },
};
const careIcons = { feed: <CareIcon name="feed" size={30} />, play: <CareIcon name="play" size={30} />, nap: <CareIcon name="nap" size={30} />, cuddle: <CareIcon name="cuddle" size={30} /> };

function CareDemo() {
  const [needs, setNeeds] = useState<Needs>({ hunger: 32, energy: 58, mood: 88 });
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const [key, setKey] = useState(0);
  const [outfit, setOutfit] = useState<Outfit>({ head: 'casquette', face: 'lunettes_rondes', body: 'echarpe', toy: 'ballon' });
  const [slot, setSlot] = useState<ItemSlot>('head');
  const [toast, setToast] = useState(true);
  const [unlock, setUnlock] = useState(false);
  const shape = shapeOf(needs);
  const available = Object.fromEntries(CARE_ACTIONS.map((a) => [a, canCare(needs, a)])) as Record<CareAction, boolean>;
  const care = (a: CareAction) => {
    setNeeds((n) => applyCare(n, a));
    setReaction(a);
    setKey((k) => k + 1);
  };
  return (
    <>
      <Item name="PetStage · NeedsPanel · CareBar (interactif)">
        <PetStage
          pet={{ name: 'Nino', species: 'nino', outfit }}
          action={{ label: 'garde-robe', onPress: () => setSlot('head') }}
          shape={shape}
          shapeLabel={shapeLabel[shape]?.title}
          speech={reaction ? careLabel[reaction]?.done : 'j’ai un petit creux…'}
          reaction={reaction}
          reactionKey={key}
        />
        <NeedsPanel needs={needs} labels={needLabel} />
        <CareBar labels={careLabel} available={available} hot={{ feed: needs.hunger < 40 }} onCare={care} />
        <Button label="remettre à plat" size="sm" variant="ghost" onPress={() => setNeeds({ hunger: 12, energy: 10, mood: 25 })} />
      </Item>
      <Item name="OutfitPreview · SlotTabs · WardrobeGrid (interactif)">
        <OutfitPreview species="nino" outfit={outfit} slotLabels={slotLabel} itemLabels={itemLabel} emptyLabel="rien" activeSlot={slot} onSlotPress={setSlot} />
        <SlotTabs labels={slotLabel} active={slot} onChange={setSlot} badges={{ toy: true }} />
        <WardrobeGrid
          items={wardrobe}
          slot={slot}
          worn={outfit[slot] ?? null}
          itemLabels={itemLabel}
          goalLabels={statGoalLabel}
          premiumLabel="bientôt"
          wornLabel="porté"
          onSelect={(it) => {
            if (it.state === 'owned') setOutfit((o) => (o[it.slot] === it.id ? { ...o, [it.slot]: undefined } : { ...o, [it.slot]: it.id }));
          }}
          newIds={['tasse']}
          newLabel="nouveau"
        />
      </Item>
      <Item name="UnlockToast · UnlockSheet">
        <UnlockToast visible={toast} itemId="tasse" name={itemLabel.tasse ?? 'tasse'} kicker="nouveau !" text="rangée dans sa garde-robe" onPress={() => setUnlock(true)} onClose={() => setToast(false)} />
        {!toast ? <Button label="revoir le toast" size="sm" variant="ghost" onPress={() => setToast(true)} /> : null}
        <Button label="ouvrir la fête" variant="ghost" onPress={() => setUnlock(true)} />
        <UnlockSheet
          visible={unlock}
          itemId="tasse"
          itemName={itemLabel.tasse ?? 'tasse'}
          pet={{ species: 'nino', outfit: { ...outfit, toy: 'tasse' }, name: 'Nino' }}
          title={[{ text: 'TASSE\n' }, { text: 'POUR NINO.', dim: true }]}
          kicker="nouveau !"
          text="3 jours de soins. c’est mérité."
          wearLabel="il le porte"
          onWear={() => {
            setOutfit((o) => ({ ...o, toy: 'tasse' }));
            setUnlock(false);
          }}
          closeLabel="ranger dans la garde-robe"
          onClose={() => setUnlock(false)}
        />
      </Item>
    </>
  );
}

function CareLevel() {
  const noop = () => undefined;
  return (
    <Level title="SOINS & GARDE-ROBE">
      <CareDemo />
      <Item name="DressedPet · tenues complètes">
        <View style={styles.row}>
          {SPECIES.map((sp) => (
            <DressedPet key={sp} species={sp} outfit={looks[sp]} size={78} animated delay={SPECIES.indexOf(sp) * 200} accessibilityLabel={sp} />
          ))}
        </View>
        <View style={styles.row}>
          {SPECIES.map((sp) => (
            <DressedPet key={sp} species={sp} size={78} mood="joie" />
          ))}
        </View>
      </Item>
      <Item name="PetBadge · Avatar habillé">
        <View style={styles.row}>
          {SPECIES.map((sp) => (
            <PetBadge key={sp} species={sp} outfit={looks[sp]} size={56} />
          ))}
          <PetBadge species="suzie" outfit={lea.pet.outfit} size={56} ring={color.accent} />
        </View>
        <View style={styles.row}>
          <Avatar pet={nino} hidden size={44} />
          <Avatar pet={lea.pet} uri={lea.avatarUrl} face="hidden" size={44} />
          <Avatar pet={sasha.pet} hidden size={32} />
          <Avatar pet={malo.pet} hidden size={44} />
          <Avatar pet={nino} hidden dressed={false} size={44} />
        </View>
      </Item>
      <Item name="NeedMeter">
        <View style={styles.row}>
          <NeedMeter label="faim" value={85} lowText="il a faim" />
          <NeedMeter label="énergie" value={52} lowText="il tombe de sommeil" />
          <NeedMeter label="humeur" value={18} lowText="il s’ennuie" />
        </View>
      </Item>
      <Item name="CareButton">
        <View style={styles.row}>
          <CareButton label="nourrir" icon={careIcons.feed} hot onPress={noop} />
          <CareButton label="jouer" icon={careIcons.play} refused refusedLabel="trop fatigué pour jouer." onPress={noop} />
          <CareButton label="sieste" icon={careIcons.nap} loading onPress={noop} />
          <CareButton label="câlin" icon={careIcons.cuddle} disabled onPress={noop} />
        </View>
      </Item>
      <Item name="ItemTile">
        <View style={styles.row}>
          <ItemTile id="bob" label="bob" state="owned" onPress={noop} />
          <ItemTile id="casquette" label="casquette" state="worn" wornLabel="porté" onPress={noop} />
          <ItemTile id="toque" label="toque" state="locked" goalText="10 jours de soins" progress={{ have: 4, need: 10 }} onPress={noop} />
        </View>
        <View style={styles.row}>
          <ItemTile id="aureole" label="auréole" state="premium" premiumLabel="bientôt" onPress={noop} />
          <ItemTile id="tasse" label="tasse" state="owned" newLabel="nouveau" onPress={noop} />
          <ItemTile id="couronne" label="couronne" state="locked" goalText="niveau 7 d’un lien" progress={{ have: 3, need: 7 }} />
        </View>
      </Item>
      <Item name="NeedsPanel · tout va bien">
        <NeedsPanel needs={{ hunger: 90, energy: 75, mood: 81 }} labels={needLabel} />
      </Item>
      <Item name="PetStage · boude">
        <PetStage pet={{ name: 'Gaston', species: 'gaston', outfit: looks.gaston }} shape="boude" shapeLabel={shapeLabel.boude?.title} />
      </Item>
      <Item name="Garde-robe · les 64 objets sur les 4 pets">
        {ITEM_SLOTS.map((sl) => (
          <View key={sl} style={styles.wardrobe}>
            <Title text={slotLabel[sl] ?? sl} variant="h3" />
            {ITEMS.filter((i) => i.slot === sl).map((i) => (
              <View key={i.id} style={styles.fitRow}>
                <Text variant="bodyBold" size={11} muted numberOfLines={2} style={styles.fitName}>
                  {itemLabel[i.id] ?? i.id}
                </Text>
                {SPECIES.map((sp) => (
                  <DressedPet key={sp} species={sp} outfit={{ [sl]: i.id }} size={66} />
                ))}
              </View>
            ))}
          </View>
        ))}
      </Item>
    </Level>
  );
}

export default function Gallery() {
  const [chip, setChip] = useState('drôle');
  const [tab, setTab] = useState<LinkTab>('chat');
  const [otp, setOtp] = useState('4821');
  const [name, setName] = useState('Nino');
  const [draft, setDraft] = useState('');
  const [tone, setTone] = useState<ComposerTone | null>('sweet');
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  const [species, setSpecies] = useState<Species>('nino');
  const [answer, setAnswer] = useState<string | null>(null);
  const [gauge, setGauge] = useState<GaugeKey | null>('social');
  const [pause, setPause] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [nav, setNav] = useState<'chats' | 'pet' | 'encounters' | 'me'>('chats');
  const [copied, setCopied] = useState(false);
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const noop = () => undefined;

  return (
    <ScreenTemplate header={<Header title="Design system" subtitle="@blowy/ui · galerie" />}>
      <CareLevel />
      <Level title="ATOMES">
        <Item name="Text">
          <Text variant="hero">hero</Text>
          <Text variant="h1">h1 titre</Text>
          <Text variant="h2">h2 titre</Text>
          <Text variant="h3">h3 titre</Text>
          <Text>body : élève ton pet. il te présente du monde.</Text>
          <Text variant="bodyBold">bodyBold : nino a croisé 3 pets</Text>
          <Text variant="small" muted>
            small muted : la prochaine dans 4 jours.
          </Text>
          <Text variant="label">label en capitales</Text>
        </Item>
        <Item name="Title">
          <Title text={[{ text: 'CHATS' }, { text: ' · 5', dim: true }]} size={64} />
          <Title text={[{ text: 'TON PET,\n' }, { text: 'TON VIBE', dim: true }]} />
        </Item>
        <Item name="Button">
          <Button label="créer mon pet" iconRight="arrow" onPress={noop} />
          <Button label="continuer avec ton e-mail" variant="white" onPress={noop} />
          <Button label="le ranimer" hint="(une seule fois)" variant="dark" onPress={noop} />
          <Button label="le laisser partir" variant="ghost" onPress={noop} />
          <Button label="supprimer mon compte" variant="danger" onPress={noop} />
          <View style={styles.row}>
            <Button label="relancer léa" size="sm" variant="dark" onPress={noop} />
            <Button label="essayer" size="sm" variant="white" onPress={noop} />
            <Button label="envoi" size="sm" loading onPress={noop} />
            <Button label="off" size="sm" disabled onPress={noop} />
          </View>
        </Item>
        <Item name="IconButton">
          <View style={styles.row}>
            <IconButton glyph="back" label="Retour" onPress={noop} />
            <IconButton glyph="plus" label="Nouveau chat" variant="accent" onPress={noop} />
            <IconButton glyph="close" label="Fermer" variant="dark" onPress={noop} />
            <IconButton glyph="send" label="Envoyer" variant="accent" onPress={noop} />
            <IconButton icon={<Icon name="cadeau" size={26} />} label="Cadeau" variant="white" badge={2} onPress={noop} />
          </View>
        </Item>
        <Item name="Glyph">
          <View style={styles.wrap}>
            {GLYPHS.map((g) => (
              <View key={g} style={styles.glyphCell}>
                <Glyph name={g} size={22} />
                <Text variant="small" muted size={10}>
                  {g}
                </Text>
              </View>
            ))}
          </View>
        </Item>
        <Item name="Icon">
          <View style={styles.wrap}>
            {ICON_NAMES.map((n) => (
              <Icon key={n} name={n} size={36} />
            ))}
          </View>
        </Item>
        <Item name="Panel">
          <View style={styles.wrap}>
            {(['accent', 'orange', 'coral', 'violet', 'rose', 'wine', 'night'] as const).map((g) => (
              <Panel key={g} gradient={g} radius="lg" padding="md" style={styles.swatch}>
                <Text variant="bodyBold" size={13}>
                  {g}
                </Text>
              </Panel>
            ))}
          </View>
          <Panel gradient="orange" padding="lg">
            <Text variant="label" dim>
              photo du jour
            </Text>
            <Title text={[{ text: '2 LIENS ' }, { text: 'T’ATTENDENT', dim: true }]} size={26} />
            <Text variant="bodyBold" size={13}>
              léa et malo veulent voir ta tête.
            </Text>
          </Panel>
        </Item>
        <Item name="Card">
          <Card>
            <Text variant="bodyBold">Carte sombre bordée</Text>
            <Text variant="small" muted>
              tone panel, padding md
            </Text>
          </Card>
          <Card tone="raised" highlight={color.accent} onPress={noop} accessibilityLabel="Carte touchable">
            <Text variant="bodyBold">Carte touchable mise en avant</Text>
          </Card>
        </Item>
        <Item name="Chip">
          <View style={styles.wrap}>
            {['drôle', 'solaire', 'fiable', 'chaotique', 'tendre'].map((w) => (
              <Chip key={w} label={w} size="lg" selected={chip === w} onPress={() => setChip(w)} />
            ))}
          </View>
          <View style={styles.wrap}>
            <Chip label="nouveau" tone="coral" size="sm" />
            <Chip label="niv. 3" tone="accent" size="sm" />
            <Chip label="lien fantôme" size="sm" />
            <Chip label="d’humeur joueuse" tone="dark" left={<Glyph name="dot" size={12} color={color.accent} />} />
          </View>
        </Item>
        <Item name="Sticker">
          <View style={styles.wrap}>
            <Sticker label="MDR NON" font="display" />
            <Sticker label="LE PIGEON" font="display" tone="coral" rotate={4} />
            <Sticker label="nino · toi" />
            <Sticker label="pia · Sasha" tone="white" rotate={3} />
            <Sticker label="BRUNCH PERDU" font="display" tone="white" rotate={-2} />
          </View>
        </Item>
        <Item name="Avatar">
          <View style={styles.row}>
            <Avatar pet={nino} hidden size={56} />
            <Avatar uri={photo('lea')} name="Léa" pet={lea.pet} face="hidden" size={56} />
            <Avatar uri={photo('malo')} name="Malo" face="blurred" size={56} />
            <Avatar uri={photo('sasha')} name="Sasha" face="clear" size={56} ring={color.accent} />
            <Avatar name="Tom" size={56} />
            <Avatar pet={tom.pet} hidden pose="fantome" size={56} />
          </View>
        </Item>
        <Item name="PetImage · humeurs (bustes)">
          <View style={styles.row}>
            <PetImage species="nino" mood="joie" size={80} animation="breathe" />
            <PetImage species="suzie" mood="amour" size={80} animation="bob" delay={400} />
            <PetImage species="gaston" mood="smug" size={80} outline />
            <PetImage species="pia" mood="salut" size={80} rotate={8} />
          </View>
          <View style={styles.row}>
            {(['neutre', 'surpris', 'triste', 'colere', 'dodo', 'malade', 'fantome'] as const).map((m) => (
              <PetImage key={m} species="suzie" mood={m} size={44} />
            ))}
          </View>
        </Item>
        <Item name="PetImage · corps entiers">
          <View style={styles.row}>
            {(['debout', 'trois_quarts', 'cote', 'dos'] as const).map((m) => (
              <PetImage key={m} species="gaston" mood={m} size={80} />
            ))}
          </View>
        </Item>
        <Item name="PetImage · formes, traits, illustrations">
          <View style={styles.row}>
            {(['equilibre', 'casanier', 'sociable', 'joueur', 'piquant', 'tendre'] as const).map((f) => (
              <PetImage key={f} species="pia" form={f} size={52} />
            ))}
          </View>
          <View style={styles.row}>
            <PetImage species="suzie" trait="douce" size={64} />
            <PetImage species="gaston" trait="pose" size={64} />
            <PetImage species="gaston" trait="calme" size={64} />
            <PetImage species="pia" trait="bavard" size={64} />
            <PetImage art="oeuf" size={50} />
            <PetImage art="bebe" size={50} animation="breathe" />
          </View>
          <PetImage art="duo_nino_suzie" size={220} />
        </Item>
        <Item name="TextField">
          <TextField label="son petit nom" value={name} onChangeText={setName} large hint="court, c’est mieux. tu vas le crier souvent." right={<Button label="au hasard 🎲" size="sm" variant="ghost" onPress={noop} />} />
          <TextField label="ton e-mail" value="lea@" onChangeText={noop} error="Cette adresse n’a pas l’air complète." keyboardType="email-address" />
        </Item>
        <Item name="Badge">
          <View style={styles.row}>
            <Badge count={3} />
            <Badge count={12} tone="accent" />
            <Badge count={140} />
          </View>
        </Item>
        <Item name="ProgressBar">
          <ProgressBar value={0.68} />
          <ProgressBar value={0.3} color={color.rose} height={6} />
        </Item>
        <Item name="Divider · Spacer">
          <Divider />
          <Spacer size="sm" />
          <Divider inset="xl" />
        </Item>
        <Item name="Skeleton">
          <View style={styles.row}>
            <Skeleton width={44} height={44} radius="circle" />
            <View style={styles.grow}>
              <Skeleton width="60%" height={14} />
              <Spacer size="sm" />
              <Skeleton width="90%" height={12} />
            </View>
          </View>
        </Item>
      </Level>

      <Level title="MOLÉCULES">
        <Item name="Hearts">
          <Hearts lives={5} accessibilityLabel="5 vies sur 7" />
          <Hearts lives={7} size={18} />
          <Hearts lives={0} ghost />
        </Item>
        <Item name="GaugeBar">
          <GaugeBar value={45} low="casanier" high="sociable" caption="sociabilité · +45" selected onPress={noop} />
          <GaugeBar value={-10} low="piquant" high="tendre" caption="tendresse · −10" />
          <GaugeBar value={30} target={60} low="piquant" high="tendre" />
          <GaugeBar value={0} low="posé" high="joueur" compact />
        </Item>
        <Item name="LevelPill · StreakPill">
          <View style={styles.row}>
            <LevelPill label="niveau 3 ›" onPress={noop} />
            <LevelPill label="niv. 2" tone="glass" size="sm" />
            <StreakPill count={3} label="série" />
          </View>
          <Panel gradient="orange" padding="md" style={styles.selfStart}>
            <StreakPill count={12} label="jours" variant="stack" />
          </Panel>
        </Item>
        <Item name="AvatarPair · SpeechBubble · DayChip">
          <AvatarPair first={{ pet: nino, hidden: true }} second={{ pet: lea.pet, hidden: true }} />
          <SpeechBubble text="salut, moi c’est nino 👋" highlight="nino" />
          <SpeechBubble text="je me sens pousser des antennes." tone="light" tail="right" rotate={-3} />
          <DayChip label="aujourd’hui · mardi" />
        </Item>
        <Item name="MessageBubble">
          <View style={styles.thread}>
            <MessageBubble message={messages[1]!} name="léa" person={lea} />
            <MessageBubble message={messages[2]!} />
            <MessageBubble message={messages[3]!} name="suzie" pet={lea.pet} />
            <MessageBubble message={messages[4]!} name="nino" pet={nino} />
            <MessageBubble message={messages[5]!} />
            <MessageBubble message={messages[0]!} />
          </View>
        </Item>
        <Item name="SegmentedTabs">
          <SegmentedTabs items={tabs} activeKey={tab} onChange={setTab} />
        </Item>
        <Item name="OtpInput">
          <OtpInput value={otp} onChange={setOtp} accessibilityLabel="code reçu par e-mail" />
        </Item>
        <Item name="ListRow">
          <View>
            <ListRow title="pause rencontres" subtitle="nino croise de nouveaux pets" switchValue={pause} onSwitchChange={setPause} />
            <ListRow title="qui nino peut croiser" subtitle="potes de potes, puis le quartier" onPress={noop} />
            <ListRow title="supprimer mon compte" destructive onPress={noop} divider={false} />
          </View>
        </Item>
        <Item name="Header">
          <Header onBack={noop} title="ton lien avec Léa" right={<AvatarPair size={30} first={{ pet: nino, hidden: true }} second={{ pet: lea.pet, hidden: true }} />} />
        </Item>
        <Item name="EmptyState">
          <EmptyState species="nino" mood="triste" title={[{ text: 'PAS ENCORE\n' }, { text: 'DE CHAT', dim: true }]} text="nino attend de croiser quelqu’un. va voir les rencontres." actionLabel="voir les rencontres" onAction={noop} />
        </Item>
        <Item name="Banner">
          <Banner tone="error" title="Pas de réseau" text="On réessaie dès que ça revient." actionLabel="réessayer" onAction={noop} />
          <Banner tone="info" text="1 rencontre par semaine en gratuit. la prochaine dans 4 jours." onClose={noop} />
          <Banner tone="success" text="Lien copié." />
        </Item>
        <Item name="PhotoTile">
          <Panel gradient="orange" padding="md">
            <View style={styles.row}>
              <PhotoTile state="photo" uri={photo('me')} badge="posté ✓" label="ta photo · 9:12" style={styles.grow} />
              <PhotoTile state="pending" species="suzie" title="léa : en attente" caption="elle a jusqu’à minuit" style={styles.grow} />
            </View>
            <Spacer size="sm" />
            <View style={styles.row}>
              <PhotoTile state="empty" title="prends ta photo" onPress={noop} style={styles.grow} />
              <PhotoTile state="locked" title="léa a posté" caption="poste la tienne" style={styles.grow} />
            </View>
          </Panel>
        </Item>
        <Item name="ChoiceCard">
          <ChoiceCard title="reste au chaud : plaid, série, pizza" caption="→ casanier" icon="gel" gradient="rose" onPress={noop} />
          <ChoiceCard title="sort. on verra bien où ça finit" caption="→ sociable" icon="confettis" gradient="accent" selected onPress={noop} />
          <ChoiceCard title="réponse non retenue" faded onPress={noop} />
        </Item>
        <Item name="StatTile">
          <View style={styles.row}>
            <StatTile value="6" label="liens" />
            <StatTile value="12 J" label="plus longue série" color={color.orange} />
            <StatTile value="14" label="pets croisés" color={color.accent} />
          </View>
        </Item>
        <Item name="TabBarItem · StepProgress · FeatureRow">
          <View style={styles.row}>
            <TabBarItem label="Chats" glyph="chat" active />
            <TabBarItem label="Rencontres" glyph="people" badge={2} />
          </View>
          <StepProgress step={2} total={4} />
          <FeatureRow icon="coeurs" title="3 rencontres à la fois" text="au lieu d’une par semaine" />
        </Item>
      </Level>

      <Level title="ORGANISMES">
        <Item name="LinkRow">
          <View>
            {links.map(({ link, time, author, level, isNew }) => (
              <LinkRow
                key={link.other.displayName}
                link={link}
                timeLabel={time}
                levelLabel={level}
                previewAuthor={author}
                newLabel={isNew ? 'nouveau' : undefined}
                ghostLabel="lien fantôme 👻"
                onPress={noop}
              />
            ))}
          </View>
        </Item>
        <Item name="ChatThread + Composer">
          <Frame height={620}>
            <ChatThread
              messages={messages}
              myPet={nino}
              other={lea}
              otherName="léa"
              dayLabel={(d) => (d === '2026-11-10' ? 'aujourd’hui · mardi' : shortDay(d))}
              onEndReached={noop}
            />
            <Composer
              value={draft}
              onChangeText={setDraft}
              onSend={() => setDraft('')}
              placeholder="écris à léa (nino lit tout)"
              tone={tone}
              onToneChange={setTone}
              toneLabels={{ sweet: 'mot doux', tease: 'vanne' }}
              onAttach={noop}
            />
          </Frame>
          <Composer value="" onChangeText={noop} onSend={noop} placeholder="" disabled disabledText="lien fantôme : ranime-le pour écrire" />
        </Item>
        <Item name="TodayCard (4 états)">
          <TodayCard today={{ mine: true, theirs: false, myPhotoUrl: photo('me'), theirPhotoUrl: null }} otherPet={lea.pet} streak={12} labels={todayLabels} onCta={noop} />
          <TodayCard today={{ mine: false, theirs: true, myPhotoUrl: null, theirPhotoUrl: null }} otherPet={lea.pet} streak={12} labels={{ ...todayLabels, cta: 'prendre ma photo' }} onCta={noop} />
          <TodayCard today={{ mine: true, theirs: true, myPhotoUrl: photo('me'), theirPhotoUrl: photo('lea2') }} otherPet={lea.pet} streak={13} labels={todayLabels} />
          <TodayCard today={{ mine: false, theirs: false, myPhotoUrl: null, theirPhotoUrl: null }} otherPet={malo.pet} streak={0} labels={{ ...todayLabels, cta: 'prendre ma photo' }} onCta={noop} gradient="coral" />
        </Item>
        <Item name="LivesPanel">
          <LivesPanel
            lives={5}
            title={[{ text: '5 VIES ' }, { text: 'SUR 7', dim: true }]}
            text="un truc fait ensemble = +1 vie. un jour de silence = −1 vie. à 0, le lien devient fantôme."
            weekTitle="cette semaine"
            week={[
              { day: 'L', state: 'done' },
              { day: 'M', state: 'done' },
              { day: 'M', state: 'done' },
              { day: 'J', state: 'done' },
              { day: 'V', state: 'done' },
              { day: 'S', state: 'half', mark: '1/2' },
              { day: 'D', state: 'none' },
            ]}
            streak={12}
            streakUnit="jours de série"
          />
        </Item>
        <Item name="LevelLadder">
          <Panel gradient="rose" padding="lg">
            <Text variant="label" dim>
              niveau 3 sur 7
            </Text>
            <Title text={[{ text: 'EMMÉNAGER\n' }, { text: 'ENSEMBLE', dim: true }]} size={44} />
            <Spacer size="sm" />
            <ProgressBar value={0.64} color={color.dark} trackColor={alpha(color.dark, 0.15)} />
          </Panel>
          <LevelLadder level={3} labels={levelLabel} ratio={0.64} currentLabel="vous êtes là" nextLabel="encore 160 xp" />
        </Item>
        <Item name="GaugePanel">
          <GaugePanel
            gauges={gauges}
            labels={gaugeLabel}
            names={gaugeNames}
            title="son caractère"
            hint="touche une jauge"
            selected={gauge}
            onSelect={setGauge}
            footer={gauge ? gaugeLabel[gauge].hint : undefined}
          />
        </Item>
        <Item name="PetHero">
          <PetHero pet={nino} title={[{ text: 'NINO,\n' }, { text: 'PLUTÔT\nJOUEUR.', dim: true }]} moodLabel="d’humeur joueuse" speech="je me sens pousser des antennes." onPetPress={noop} />
          <PetHero pet={lea.pet} title={[{ text: 'SUZIE,\n' }, { text: 'TENDRE.', dim: true }]} formLabel={formLabel.tendre} showForm />
        </Item>
        <Item name="EvolutionTimeline">
          <EvolutionTimeline
            species="nino"
            steps={[
              { form: 'casanier', when: 'septembre', name: 'casanier', caption: 'que du canapé.' },
              { form: 'equilibre', when: 'octobre', name: 'équilibré', caption: 'chats rouverts.' },
              { form: 'sociable', when: 'aujourd’hui', name: 'sociable', caption: '3 pets croisés.', current: true },
            ]}
          />
        </Item>
        <Item name="ChallengeCard">
          <ChallengeCard
            label="défi du jour"
            question="plutôt brunch ou grasse mat’ ?"
            choices={['brunch', 'grasse mat’']}
            done={picked !== null}
            picked={picked}
            doneLabel="fait ! reviens demain"
            onChoose={setPicked}
            streak={3}
            streakUnit="série"
          />
        </Item>
        <Item name="SuggestionCard">
          <SuggestionCard
            suggestion={{ user: sasha, compatibility: 91, intro: 'ton humain perd à tous les quiz de gaston ? on va bien s’entendre 😏', waved: false }}
            ownerLabel="le pet de Sasha"
            viaLabel="par Malo, pote de pote"
            viaPet={malo.pet}
            badgeLabel="nouveau"
            compatLabel="d’accord"
            tagline="deux joueurs, une piquante"
            introLabel="pia, à nino"
            waveLabel="saluer pia"
            wavedLabel="salut envoyé"
            onWave={noop}
          />
          <View style={styles.row}>
            <SuggestionCard suggestion={{ user: malo, compatibility: 86, intro: '', waved: false }} ownerLabel="" compatLabel="" waveLabel="" wavedLabel="" locked lockedCaption="par la bande du 11e · blowy+" />
            <SuggestionCard suggestion={{ user: lea, compatibility: 78, intro: '', waved: true }} ownerLabel="" compatLabel="" waveLabel="" wavedLabel="" locked lockedCaption="ton quartier · 600 m" />
          </View>
        </Item>
        <Item name="IncomingCard">
          <IncomingCard
            incoming={{ from: sasha, compatibility: 91, intro: 'nino, t’es le pet dont gaston parle tout le temps ?' }}
            title="Sasha veut te rencontrer"
            ownerLabel="pia, le pet de Sasha"
            compatLabel="d’accord"
            acceptLabel="accepter"
            declineLabel="pas cette fois"
            onAccept={noop}
            onDecline={noop}
          />
        </Item>
        <Item name="MemoryGrid">
          <MemoryGrid
            days={memoryDays}
            stats={{ messages: 412, photos: 41, daysTogether: 23, bestStreak: 12 }}
            statLabels={{ messages: 'messages', photos: 'photos du jour', daysTogether: 'jours ensemble', bestStreak: 'meilleure série' }}
            dayLabel={shortDay}
            blurred
            onDayPress={noop}
          />
        </Item>
        <Item name="GhostPanel">
          <GhostPanel
            pet={nino}
            title={[{ text: 'TU L’AS\n' }, { text: 'GHOSTÉ.', dim: true }]}
            text="7 jours de silence avec Tom. le lien est devenu fantôme."
            speech="j’ai attendu tom une semaine. je suis devenu transparent, c’est normal ?"
            speakerLabel="nino, version fantôme"
            canRevive
            reviveLabel="le ranimer"
            reviveHint="(une seule fois)"
            alreadyRevivedLabel="déjà ranimé une fois"
            leaveLabel="le laisser partir"
            onRevive={noop}
            onLeave={noop}
          />
          <GhostPanel pet={nino} title="FANTÔME." canRevive={false} reviveLabel="le ranimer" alreadyRevivedLabel="déjà ranimé une fois" />
        </Item>
        <Item name="SpeciesPicker">
          <SpeciesPicker value={species} onChange={setSpecies} names={speciesNames} speech={`salut, moi c’est ${speciesNames[species].toLowerCase()} 👋`} speechHighlight={speciesNames[species].toLowerCase()} badge="exemplaire unique" />
        </Item>
        <Item name="QuizStep">
          <QuizStep
            kicker="sociabilité"
            title={[{ text: 'SAMEDI SOIR,\n' }, { text: 'NINO…', dim: true }]}
            text="réponds comme lui. pas comme ta mère."
            choices={[
              { key: 'home', title: 'reste au chaud : plaid, série, pizza', caption: '→ casanier', icon: 'gel' },
              { key: 'out', title: 'sort. on verra bien où ça finit', caption: '→ sociable', icon: 'confettis' },
            ]}
            selectedKey={answer}
            onChoose={setAnswer}
            preview={{ pet: nino, gauges: { social: answer === 'out' ? 30 : answer === 'home' ? -30 : 0, play: 0, tender: 0, talk: 0 }, labels: gaugeLabel }}
          />
        </Item>
        <Item name="PlanPicker">
          <Panel gradient="wine" padding="lg">
            <FeatureRow icon="coeurs" title="3 rencontres à la fois" text="au lieu d’une par semaine" />
            <Spacer size="md" />
            <FeatureRow icon="cadeau" title="la garde-robe de nino" text="bonnets, lunettes, dignité en option" />
          </Panel>
          <PlanPicker
            plans={[
              { key: 'year', title: 'à l’année', price: '4,99 €', unit: '/mois', caption: 'facturé 59,88 €/an', badge: '−67 %' },
              { key: 'month', title: 'au mois', price: '14,99 €', unit: '/mois', caption: 'sans engagement' },
            ]}
            value={plan}
            onChange={setPlan}
          />
        </Item>
        <Item name="WordsShareCard">
          <WordsShareCard
            title="décris-moi en 3 mots"
            countLabel="9 potes ont répondu"
            words={[
              { label: 'drôle', count: 6 },
              { label: 'loyal', count: 4 },
              { label: 'un peu chaos', count: 3 },
            ]}
            url="blowy.app/alex"
            copyLabel="copier"
            copiedLabel="copié ✓"
            copied={copied}
            shareLabel="en story"
            onCopy={() => setCopied(true)}
            onShare={noop}
          />
        </Item>
        <Item name="SettingsSection">
          <SettingsSection
            title="confidentialité"
            rows={[
              { key: 'pause', title: 'pause rencontres', subtitle: 'nino croise de nouveaux pets', switchValue: pause, onSwitchChange: setPause },
              { key: 'notif', title: 'notifications', subtitle: 'séries, vies, rencontres', onPress: noop },
              { key: 'blocks', title: 'personnes bloquées', onPress: noop },
              { key: 'delete', title: 'supprimer mon compte', destructive: true, onPress: noop },
            ]}
            footer="Tes données restent en Europe."
          />
        </Item>
        <Item name="BottomTabBar">
          <Frame height={110}>
            <BottomTabBar items={navItems} activeKey={nav} onPress={setNav} />
          </Frame>
        </Item>
      </Level>

      <Level title="GABARITS">
        <Item name="OnboardingTemplate">
          <Frame height={760}>
            <OnboardingTemplate step={1} total={4} onBack={noop} title={[{ text: 'TON PET,\n' }, { text: 'TON VIBE', dim: true }]} primaryLabel="c’est lui" onPrimary={noop} secondaryLabel="j’ai déjà un compte" onSecondary={noop}>
              <TextField label="son petit nom" value={name} onChangeText={setName} large />
            </OnboardingTemplate>
          </Frame>
        </Item>
        <Item name="TabTemplate">
          <Frame height={560}>
            <TabTemplate brand="blowy" title={[{ text: 'CHATS' }, { text: ' · 5', dim: true }]} right={<IconButton glyph="plus" label="Nouveau chat" variant="accent" onPress={noop} />}>
              {links.slice(0, 2).map(({ link, time, author, level }) => (
                <LinkRow key={link.other.displayName} link={link} timeLabel={time} levelLabel={level} previewAuthor={author} onPress={noop} />
              ))}
            </TabTemplate>
            <BottomTabBar items={navItems} activeKey="chats" onPress={noop} />
          </Frame>
        </Item>
        <Item name="LinkTemplate">
          <Frame height={600}>
            <LinkTemplate other={lea} myPet={nino} lives={5} levelLabel="niveau 3 ›" onLevelPress={noop} onBack={noop} tabs={tabs} activeTab="today" onTabChange={noop} scroll>
              <View style={styles.linkBody}>
                <TodayCard today={{ mine: true, theirs: false, myPhotoUrl: photo('me'), theirPhotoUrl: null }} otherPet={lea.pet} streak={12} labels={todayLabels} onCta={noop} />
              </View>
            </LinkTemplate>
          </Frame>
        </Item>
        <Item name="SheetTemplate">
          <Button label="ouvrir la feuille" variant="ghost" onPress={() => setSheet(true)} />
          <SheetTemplate visible={sheet} onClose={() => setSheet(false)} title={[{ text: 'SIGNALER ' }, { text: 'TOM', dim: true }]} footer={<Button label="envoyer le signalement" variant="danger" onPress={() => setSheet(false)} />}>
            <ListRow title="Harcèlement" onPress={noop} />
            <ListRow title="Faux profil" onPress={noop} divider={false} />
          </SheetTemplate>
        </Item>
      </Level>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  level: { gap: space.xl, paddingTop: space.xxl },
  item: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  grow: { flex: 1 },
  selfStart: { alignSelf: 'flex-start' },
  swatch: { width: 100, height: 64 },
  glyphCell: { width: 64, alignItems: 'center', gap: space.xs, paddingVertical: space.sm },
  thread: { gap: space.sm },
  frame: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: color.line, backgroundColor: color.night },
  linkBody: { paddingTop: space.md },
  wardrobe: { gap: space.xs },
  fitRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: space.xs, borderBottomWidth: 1, borderBottomColor: color.line },
  fitName: { width: 64 },
});
