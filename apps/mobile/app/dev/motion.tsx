/**
 * Banc d'essai du mouvement (@blowy/ui, docs/MOTION.md) : chaque primitive et chaque comportement des pets,
 * avec des boutons pour les déclencher. Route : /dev/motion. Un interrupteur force « réduire les animations ».
 */
import { careLabel, itemLabel, needLabel, slotLabel, statGoalLabel } from '@blowy/content';
import { CARE_ACTIONS, type ItemSlot, ITEMS, type Needs, type Outfit, type Species } from '@blowy/domain';
import { color, radius, space } from '@blowy/tokens';
import {
  Appear,
  BottomTabBar,
  Burst,
  type BurstKind,
  Button,
  CareBar,
  ChallengeCard,
  Chip,
  ChoiceCard,
  CountUp,
  EmptyState,
  EvolutionTimeline,
  GaugeBar,
  Header,
  ItemImage,
  KeyboardPeek,
  MotionProvider,
  NeedsPanel,
  OutfitPreview,
  type OutfitPreviewHandle,
  type PeekEdge,
  PetActor,
  type PetActorHandle,
  type PetActorReaction,
  PetEntrance,
  PetPeek,
  PetStage,
  PopIn,
  ProgressBar,
  Pulse,
  Radio,
  ScreenTemplate,
  SegmentedTabs,
  Shake,
  type ShakeHandle,
  SheetTemplate,
  Skeleton,
  SlotTabs,
  SpeechBubble,
  Stagger,
  Text,
  TextField,
  Title,
  Toggle,
  TypingDots,
  UnlockSheet,
  useBurst,
  useFlyTo,
  WardrobeGrid,
  type WardrobeGridHandle,
  type WardrobeItemLook,
} from '@blowy/ui';
import { type ComponentRef, type ReactNode, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/core';

const SPECIES: readonly Species[] = ['nino', 'suzie', 'gaston', 'pia'];
const REACTIONS: readonly PetActorReaction[] = ['feed', 'play', 'nap', 'cuddle', 'joy', 'no', 'wave', 'surprise'];
const EDGES: readonly PeekEdge[] = ['bottom-right', 'bottom-left', 'left', 'right', 'top'];
const BURSTS: readonly BurstKind[] = ['hearts', 'stars', 'sparkles', 'confetti', 'zzz'];
const LOOK: Outfit = { head: 'casquette', face: 'lunettes_rondes', body: 'echarpe', toy: 'ballon' };
const wardrobe: WardrobeItemLook[] = ITEMS.map((i, n) => ({
  id: i.id,
  slot: i.slot,
  state: n % 5 === 3 ? 'locked' : n % 7 === 5 ? 'premium' : 'owned',
  goal: null,
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Title text={[{ text: title }, { text: ' ·', dim: true }]} size={34} />
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Label({ children }: { children: string }) {
  return (
    <Text variant="label" color={color.accent}>
      {children}
    </Text>
  );
}

/** Le grand pet : réactions, toucher, sommeil, bouderie, tenue. */
function ActorBench() {
  const actor = useRef<PetActorHandle>(null);
  const [species, setSpecies] = useState<Species>('nino');
  const [dressed, setDressed] = useState(false);
  const [sulking, setSulking] = useState(false);
  const [sleepy, setSleepy] = useState(0);
  const [log, setLog] = useState('touche, double-touche, appui long, attrape-le et lance-le');
  return (
    <Section title="PETACTOR">
      <Row>
        {SPECIES.map((s) => (
          <Chip key={s} label={s} selected={species === s} onPress={() => setSpecies(s)} />
        ))}
      </Row>
      <Row>
        <Chip label="habillé" selected={dressed} onPress={() => setDressed((d) => !d)} />
        <Chip label="boude" selected={sulking} onPress={() => setSulking((d) => !d)} />
        <Chip label="s'endort (2 s)" onPress={() => setSleepy((n) => n + 1)} />
        <Chip label="réveil" onPress={() => actor.current?.wake()} />
      </Row>
      <View style={styles.stage}>
        <PetActor
          key={`${species}:${sleepy}`}
          ref={actor}
          species={species}
          outfit={dressed ? LOOK : null}
          size={200}
          seed={`dev-${species}`}
          sulking={sulking}
          grabbable
          sleepAfter={sleepy ? 2000 : 25_000}
          onTouch={(t) => setLog(`geste : ${t}`)}
          accessibilityLabel={`pet de démonstration, ${species}`}
        />
      </View>
      <Text muted>{log}</Text>
      <Row>
        {REACTIONS.map((r) => (
          <Button key={r} label={r} size="chip" variant="glass" block={false} onPress={() => actor.current?.react(r)} accessibilityLabel={`réaction ${r}`} />
        ))}
      </Row>
    </Section>
  );
}

/** Accueil complet : scène, besoins, soins (avec fraise, balle, lumière, cœurs). */
function HomeBench() {
  const [needs, setNeeds] = useState<Needs>({ hunger: 32, energy: 58, mood: 88 });
  const [reaction, setReaction] = useState<PetActorReaction | null>(null);
  const [key, setKey] = useState(0);
  const [dressed, setDressed] = useState(true);
  const play = (r: PetActorReaction) => {
    setReaction(r);
    setKey((k) => k + 1);
  };
  const available = Object.fromEntries(CARE_ACTIONS.map((a) => [a, true])) as Record<(typeof CARE_ACTIONS)[number], boolean>;
  return (
    <Section title="ACCUEIL">
      <Row>
        <Chip label="habillé" selected={dressed} onPress={() => setDressed((d) => !d)} />
        <Chip
          label="besoins au hasard"
          onPress={() => setNeeds({ hunger: Math.round(Math.random() * 100), energy: Math.round(Math.random() * 100), mood: Math.round(Math.random() * 100) })}
        />
      </Row>
      <PetStage
        pet={{ name: 'Nino', species: 'nino', outfit: dressed ? LOOK : {} }}
        speech={reaction ? (careLabel[reaction as 'feed']?.done ?? 'non.') : 'on sort ce soir ? je suis prêt.'}
        reaction={reaction}
        reactionKey={key}
        action={{ label: 'garde-robe', onPress: () => play('wave') }}
        shapeLabel="en pleine forme"
      />
      <NeedsPanel needs={needs} labels={needLabel} />
      <CareBar labels={careLabel} available={available} hot={{ feed: needs.hunger < 40 }} onCare={(a) => play(a)} onRefused={() => play('no')} />
    </Section>
  );
}

/** Cache-cache : le pet passe la tête par un bord, état vide, clavier. */
function PeekBench() {
  const [edge, setEdge] = useState<PeekEdge | null>(null);
  const [name, setName] = useState('');
  return (
    <Section title="PETPEEK">
      <Row>
        {EDGES.map((e) => (
          <Chip key={e} label={e} selected={edge === e} onPress={() => setEdge(edge === e ? null : e)} />
        ))}
      </Row>
      {edge ? (
        <PetPeek
          key={edge}
          species="suzie"
          edges={[edge, ...EDGES.filter((x) => x !== edge && x.startsWith('bottom'))]}
          seed="dev-peek"
          safe={{ top: 120, bottom: 110 }}
        />
      ) : null}
      <Label>état vide qui passe la tête (touche-le)</Label>
      <EmptyState peek species="gaston" mood="smug" title="RIEN ICI" text="touche le pet : il se cache et revient." seed="dev-empty" />
      <Label>clavier (iOS / Android)</Label>
      <TextField label="son petit nom" value={name} onChangeText={setName} />
      <KeyboardPeek species="pia" seed="dev-kb" />
    </Section>
  );
}

function PrimitivesBench() {
  const shake = useRef<ShakeHandle>(null);
  const [replay, setReplay] = useState(0);
  const [pop, setPop] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [count, setCount] = useState(42);
  const [ratio, setRatio] = useState(0.35);
  const [gauge, setGauge] = useState(-20);
  const [bursts, setBursts] = useState<Record<BurstKind, number>>({ hearts: 0, stars: 0, sparkles: 0, confetti: 0, zzz: 0 });
  const [line, setLine] = useState(0);
  const [on, setOn] = useState(false);
  const [radioOn, setRadio] = useState(0);
  const [tab, setTab] = useState<'today' | 'chat' | 'memories'>('today');
  const [chip, setChip] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [nav, setNav] = useState<'pet' | 'chats' | 'rencontres' | 'moi'>('pet');
  const [badge, setBadge] = useState(2);
  const hostBurst = useBurst();
  const target = useRef<ComponentRef<typeof View>>(null);
  return (
    <Section title="PRIMITIVES">
      <Label>Appear / Stagger (cascade, 8 au plus)</Label>
      <Button label="rejouer la cascade" size="sm" variant="ghost" onPress={() => setReplay((n) => n + 1)} />
      <View key={replay} style={styles.cascade}>
        <Stagger>
          {Array.from({ length: 10 }, (_, i) => (
            <View key={i} style={styles.block} />
          ))}
        </Stagger>
      </View>
      <Label>PopIn · Pulse · Shake</Label>
      <Row>
        <PopIn trigger={pop}>
          <Chip label={`pop ${pop}`} tone="accent" />
        </PopIn>
        <Button label="pop" size="chip" variant="glass" block={false} onPress={() => setPop((n) => n + 1)} />
        <Pulse trigger={pulse}>
          <Chip label="pulse" tone="rose" />
        </Pulse>
        <Button label="pulse ×2" size="chip" variant="glass" block={false} onPress={() => setPulse((n) => n + 1)} />
        <Shake ref={shake}>
          <Chip label="secoue" tone="coral" />
        </Shake>
        <Button label="shake" size="chip" variant="glass" block={false} onPress={() => shake.current?.shake()} />
      </Row>
      <Label>CountUp · ProgressBar · GaugeBar</Label>
      <Row>
        <CountUp value={count} variant="h1" />
        <Button label="compter" size="chip" variant="glass" block={false} onPress={() => setCount(Math.round(Math.random() * 999))} />
        <Button
          label="barres"
          size="chip"
          variant="glass"
          block={false}
          onPress={() => {
            setRatio(Math.random());
            setGauge(Math.round(Math.random() * 200 - 100));
          }}
        />
      </Row>
      <ProgressBar value={ratio} />
      <GaugeBar value={gauge} low="casanier" high="sociable" caption={`sociabilité · ${gauge}`} />
      <Label>Shimmer (squelettes)</Label>
      <Skeleton height={56} radius="md" />
      <Label>Burst</Label>
      <Row>
        {BURSTS.map((k) => (
          <View key={k} style={styles.burstCell}>
            <Button label={k} size="chip" variant="glass" block={false} onPress={() => setBursts((b) => ({ ...b, [k]: b[k] + 1 }))} />
            <Burst kind={k} trigger={bursts[k]} seed={`dev-${k}`} style={styles.burstOrigin} />
          </View>
        ))}
      </Row>
      <View ref={target} collapsable={false} style={styles.hostBurst}>
        <Button
          label="burst au-dessus de tout (useBurst)"
          size="sm"
          variant="ghost"
          onPress={() => target.current?.measureInWindow((x, y, w, h) => hostBurst({ kind: 'confetti', x: x + w / 2, y: y + h / 2, seed: 'dev-host' }))}
        />
      </View>
      <Label>TypingDots · SpeechBubble qui écrit</Label>
      <Row>
        <TypingDots />
        <SpeechBubble key={line} text={line % 2 ? 'j’ai faim. vraiment faim.' : 'on sort ce soir ? je suis prêt.'} typing tone="dark" />
        <Button label="nouvelle phrase" size="chip" variant="glass" block={false} onPress={() => setLine((n) => n + 1)} />
      </Row>
      <Label>Interrupteur · radio · puces · onglets</Label>
      <Row>
        <Toggle value={on} onValueChange={setOn} accessibilityLabel="interrupteur de démonstration" />
        {[0, 1, 2].map((i) => (
          <Button
            key={i}
            label={`radio ${i}`}
            size="chip"
            variant="glass"
            block={false}
            icon={<Radio selected={radioOn === i} />}
            onPress={() => setRadio(i)}
          />
        ))}
      </Row>
      <Row>
        {['tendre', 'piquant', 'joueur'].map((c, i) => (
          <Chip key={c} label={c} selected={chip === i} onPress={() => setChip(i)} />
        ))}
      </Row>
      <SegmentedTabs
        items={[
          { key: 'today', label: 'aujourd’hui' },
          { key: 'chat', label: 'chat', badge: true },
          { key: 'memories', label: 'souvenirs' },
        ]}
        activeKey={tab}
        onChange={setTab}
      />
      <Row>
        {[0, 1].map((i) => (
          <ChoiceCard
            key={i}
            title={i ? 'la mer' : 'la montagne'}
            caption={i ? '→ sociable' : '→ casanier'}
            selected={choice === i}
            faded={choice !== null && choice !== i}
            tilt={i ? 2 : -2}
            onPress={() => setChoice(i)}
            style={styles.half}
          />
        ))}
      </Row>
      <Label>Barre d'onglets (pilule, rebond, pastilles, tête du pet)</Label>
      <Button label="+1 message" size="chip" variant="glass" block={false} onPress={() => setBadge((b) => b + 1)} />
      <View style={styles.tabFrame}>
        <BottomTabBar
          floating={false}
          items={[
            { key: 'pet', label: 'Mon pet', glyph: 'heart' },
            { key: 'chats', label: 'Chats', glyph: 'chat', badge },
            { key: 'rencontres', label: 'Rencontres', glyph: 'people', badge: 1 },
            { key: 'moi', label: 'Moi', glyph: 'person' },
          ]}
          activeKey={nav}
          onPress={setNav}
          peek={{ species: 'nino', mood: 'joie' }}
        />
      </View>
    </Section>
  );
}

/** Garde-robe : vols d'objets vers le pet et retour, cascade, cadenas, « bientôt », « nouveau ». */
function WardrobeBench() {
  const [outfit, setOutfit] = useState<Outfit>({ head: 'casquette' });
  const [slot, setSlot] = useState<ItemSlot>('head');
  const [incoming, setIncoming] = useState<string[]>([]);
  const preview = useRef<OutfitPreviewHandle>(null);
  const grid = useRef<WardrobeGridHandle>(null);
  const fly = useFlyTo();
  const render =
    (id: string) =>
    ({ width }: { width: number }) => <ItemImage id={id} size={width} />;
  const square = (r: { x: number; y: number; width: number; height: number }) => {
    const side = Math.max(r.width, r.height);
    return { x: r.x + r.width / 2 - side / 2, y: r.y + r.height / 2 - side / 2, width: side, height: side };
  };
  const back = async (id: string) => {
    const [from, to] = await Promise.all([preview.current?.itemRect(id), grid.current?.tileRect(id)]);
    if (from && to) void fly({ from: square(from), to, render: render(id), arc: 90, haptic: false, onLand: () => grid.current?.land(id) });
  };
  const select = async (it: WardrobeItemLook) => {
    if (it.state !== 'owned') return;
    const worn = outfit[it.slot];
    setOutfit((o) => {
      const next = { ...o };
      if (next[it.slot] === it.id) delete next[it.slot];
      else next[it.slot] = it.id;
      return next;
    });
    if (worn === it.id) {
      preview.current?.react('surprise');
      void back(it.id);
      return;
    }
    if (worn) void back(worn);
    setIncoming((l) => [...l, it.id]);
    const [from, to] = await Promise.all([grid.current?.tileRect(it.id), preview.current?.itemRect(it.id)]);
    const done = () => setIncoming((l) => l.filter((x) => x !== it.id));
    if (!from || !to) return done();
    void fly({
      from,
      to: square(to),
      render: render(it.id),
      onLand: () => {
        done();
        preview.current?.react('joy');
      },
    });
  };
  return (
    <Section title="GARDE-ROBE">
      <OutfitPreview
        species="nino"
        outfit={outfit}
        slotLabels={slotLabel}
        itemLabels={itemLabel}
        emptyLabel="rien"
        activeSlot={slot}
        onSlotPress={setSlot}
        hiddenItems={incoming}
        previewRef={preview}
        seed="dev"
      />
      <SlotTabs labels={slotLabel} active={slot} onChange={setSlot} badges={{ toy: true }} />
      <WardrobeGrid
        items={wardrobe}
        slot={slot}
        worn={outfit[slot] ?? null}
        itemLabels={itemLabel}
        goalLabels={statGoalLabel}
        premiumLabel="bientôt"
        wornLabel="porté"
        newIds={['bob', 'tasse']}
        newLabel="nouveau"
        onSelect={(it) => void select(it)}
        gridRef={grid}
      />
    </Section>
  );
}

function ScenesBench() {
  const [sheet, setSheet] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [entrance, setEntrance] = useState(0);
  const [timeline, setTimeline] = useState(0);
  const [challenge, setChallenge] = useState<{ loading: boolean; done: boolean; picked: 0 | 1 | null }>({ loading: false, done: false, picked: null });
  return (
    <Section title="SCÈNES">
      <Label>Lancement : le pet arrive en courant</Label>
      <Button label="rejouer l'entrée" size="sm" variant="ghost" onPress={() => setEntrance((n) => n + 1)} />
      <View style={styles.center}>
        <PetEntrance key={entrance} species="nino" size={160} />
      </View>
      <Label>Feuille à ressort (tire-la vers le bas)</Label>
      <Button label="ouvrir la feuille" variant="ghost" onPress={() => setSheet(true)} />
      <SheetTemplate visible={sheet} onClose={() => setSheet(false)} title={[{ text: 'UNE ' }, { text: 'FEUILLE', dim: true }]}>
        <Text>elle monte en ressort, le fond s’assombrit ; tire-la vers le bas pour la fermer.</Text>
        <Button label="fermer" onPress={() => setSheet(false)} />
      </SheetTemplate>
      <Label>Objet débloqué (tape pour passer)</Label>
      <Button label="ouvrir la fête" variant="ghost" onPress={() => setUnlock(true)} />
      <UnlockSheet
        visible={unlock}
        itemId="tasse"
        itemName="tasse"
        pet={{ species: 'nino', outfit: { head: 'casquette', toy: 'tasse' }, name: 'Nino' }}
        title={[{ text: 'TASSE\n' }, { text: 'POUR NINO.', dim: true }]}
        kicker="nouveau !"
        text="3 jours de soins. c’est mérité."
        wearLabel="il le porte"
        onWear={() => setUnlock(false)}
        closeLabel="ranger dans la garde-robe"
        onClose={() => setUnlock(false)}
      />
      <Label>Défi du jour : la carte s'incline puis se résout</Label>
      <ChallengeCard
        label="défi du jour"
        question="CE SOIR : CANAPÉ OU SORTIE ?"
        choices={['canapé', 'sortie']}
        done={challenge.done}
        picked={challenge.picked}
        loading={challenge.loading}
        doneLabel="reviens demain"
        onChoose={(c) => {
          setChallenge({ loading: true, done: false, picked: null });
          setTimeout(() => setChallenge({ loading: false, done: true, picked: c }), 900);
        }}
      />
      <Button label="nouveau défi" size="sm" variant="ghost" onPress={() => setChallenge({ loading: false, done: false, picked: null })} />
      <Label>Évolution : la frise se dessine</Label>
      <Button label="rejouer la frise" size="sm" variant="ghost" onPress={() => setTimeline((n) => n + 1)} />
      <View key={timeline} style={styles.violet}>
        <EvolutionTimeline
          species="nino"
          steps={[
            { form: 'equilibre', when: 'juin', name: 'équilibré', caption: 'un peu de tout.' },
            { form: 'casanier', when: 'septembre', name: 'casanier', caption: 'que du canapé.' },
            { form: 'sociable', when: 'aujourd’hui', name: 'sociable', caption: 'il connaît tout le monde.', current: true },
          ]}
        />
      </View>
    </Section>
  );
}

export default function MotionLab() {
  const [reduced, setReduced] = useState(false);
  return (
    <ScreenMotion>
      <MotionProvider reduced={reduced ? true : null}>
        <ScreenTemplate header={<Header title="Mouvement" subtitle="@blowy/ui · banc d’essai" />}>
          <View style={styles.top}>
            <Appear>
              <Row>
                <Toggle value={reduced} onValueChange={setReduced} accessibilityLabel="réduire les animations" />
                <Text>réduire les animations</Text>
              </Row>
            </Appear>
          </View>
          <ActorBench />
          <HomeBench />
          <WardrobeBench />
          <PeekBench />
          <PrimitivesBench />
          <ScenesBench />
        </ScreenTemplate>
      </MotionProvider>
    </ScreenMotion>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: space.md },
  section: { gap: space.md, paddingTop: space.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  stage: { height: 260, alignItems: 'center', justifyContent: 'flex-end', borderRadius: radius.lg, backgroundColor: color.panel },
  cascade: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, minHeight: 48 },
  block: { width: 56, height: 40, borderRadius: radius.md, backgroundColor: color.violet },
  burstCell: { alignItems: 'center' },
  burstOrigin: { position: 'absolute', left: '50%', top: 0 },
  hostBurst: { alignSelf: 'flex-start' },
  half: { flex: 1 },
  tabFrame: { borderRadius: radius.lg, paddingTop: 40, backgroundColor: color.panel },
  center: { alignItems: 'center', paddingVertical: space.xl },
  violet: { borderRadius: radius.lg, padding: space.lg, backgroundColor: color.violet },
});
