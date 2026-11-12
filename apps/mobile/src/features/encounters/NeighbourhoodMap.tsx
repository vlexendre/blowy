/**
 * Plan stylisé (non géographique) du quartier du pet, plein écran (maquette V6-Carte) :
 * le tien au centre avec son radar, tes liens et les pets croisés en épingles, une fiche en bas pour l'épingle choisie.
 * Aucune géolocalisation : les rues sont un décor, les positions des emplacements fixes.
 */
import { color, speciesColor } from '@blowy/tokens';
import { alpha, Avatar, Button, Chip, extra, IconButton, MessageBubble, type PetLook, Pressable, Text, Title, type TitleContent } from '@blowy/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface MapPet {
  key: string;
  /** Prénom de la personne (puce sous l'épingle). */
  name: string;
  pet: PetLook;
  kind: 'link' | 'met';
  ghost?: boolean;
  accessibilityLabel: string;
  /** Fiche : « le pet de Sasha ». */
  who: string;
  /** Fiche : puce jaune (« par Malo, pote de pote »). */
  via?: string;
  /** Fiche : puces de caractère. */
  tags?: readonly string[];
  /** Fiche : « 91 % ». */
  compat?: number;
  /** Fiche : bouton principal et son action. */
  action: { label: string; onPress: () => void; loading?: boolean; tone: 'accent' | 'white' };
  /** Fiche : après le salut, ce que dit ton pet + un bouton secondaire. */
  after?: { say: string; label: string; onPress: () => void } | null;
}

export interface NeighbourhoodMapProps {
  me: PetLook;
  meLabel: string;
  pins: readonly MapPet[];
  title: TitleContent;
  subtitle: string;
  onBack: () => void;
  backLabel: string;
  badge?: string;
  onBadge?: () => void;
  compatLabel: string;
  /** Fiche quand il n'y a personne. */
  empty: { text: string; label: string; onPress: () => void };
}

/** Repère de la maquette (390 × 844) : coins haut-gauche des épingles de 64 pt, puis toi. */
const W = 390;
const H = 844;
const SLOTS = [
  [262, 262],
  [44, 200],
  [286, 446],
  [30, 420],
  [150, 176],
  [150, 520],
  [296, 150],
  [24, 300],
] as const;
const ME = [195, 380] as const;

/** Rues : [x1, y1, x2, y2, épaisseur, couleur]. */
const STREETS: readonly (readonly [number, number, number, number, number, keyof typeof extra.map])[] = [
  [-10, 92, 400, 70, 12, 'street'],
  [-10, 300, 400, 236, 18, 'avenue'],
  [-10, 640, 400, 610, 12, 'street'],
  [-10, 760, 400, 790, 10, 'street'],
  [112, -10, 140, 860, 12, 'street'],
  [250, -10, 232, 860, 16, 'avenue'],
  [-20, 140, 420, 620, 20, 'avenue'],
  [340, -10, 370, 860, 8, 'lane'],
  [40, -10, 20, 860, 8, 'lane'],
  [-10, 196, 400, 176, 7, 'lane'],
  [-10, 410, 400, 440, 7, 'lane'],
];
/** Canal : la courbe de la maquette approchée par des segments. */
const CANAL = [
  [-30, 560],
  [40, 545],
  [110, 568],
  [210, 560],
  [300, 510],
  [430, 500],
] as const;

export function NeighbourhoodMap({ me, meLabel, pins, title, subtitle, onBack, backLabel, badge, onBadge, compatLabel, empty }: NeighbourhoodMapProps) {
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const sx = box.w / W;
  const sy = box.h / H;
  const shown = pins.slice(0, SLOTS.length);
  const current = shown.find((p) => p.key === selected) ?? shown.find((p) => p.kind === 'met') ?? shown[0] ?? null;

  return (
    <View style={styles.root} onLayout={onLayout}>
      {box.w > 0 ? (
        <>
          <Streets sx={sx} sy={sy} h={box.h} />
          <View pointerEvents="none" style={[styles.me, { left: ME[0] * sx, top: ME[1] * sy }]}>
            <Radar />
            <Radar delay={1300} />
            <View style={styles.meInner}>
              <Avatar size={64} pet={me} hidden bg={color.accent} ring={color.accent} />
              <Chip label={meLabel} tone="accent" style={styles.meChip} />
            </View>
          </View>
          {shown.map((p, i) => {
            const slot = SLOTS[i] ?? SLOTS[0];
            return <Pin key={p.key} item={p} on={p.key === current?.key} left={slot[0] * sx} top={slot[1] * sy} onPress={() => setSelected(p.key)} />;
          })}
        </>
      ) : null}

      <LinearGradient colors={[color.night, color.night, alpha(color.night, 0)]} locations={[0, 0.55, 1]} style={[styles.head, { paddingTop: insets.top + 8 }]}>
        <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} variant="glass" />
        <View style={styles.headText}>
          <Title text={title} size={32} numberOfLines={1} />
          <Text size={12} muted numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {badge ? (
          <Pressable onPress={onBadge} disabled={!onBadge} accessibilityLabel={badge} haptic="selection">
            <LinearGradient colors={[color.violet, color.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
              <Text variant="bodyHeavy" size={12} color={color.white}>
                {badge}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </LinearGradient>

      <View style={[styles.sheet, { bottom: 14 + insets.bottom }]}>
        <View style={styles.grabber} />
        {current ? <Sheet item={current} me={me} compatLabel={compatLabel} /> : <EmptySheet {...empty} />}
      </View>
    </View>
  );
}

function Streets({ sx, sy, h }: { sx: number; sy: number; h: number }) {
  const blocks: ReactNode[] = [];
  for (let y = 0; y < H; y += 30) {
    for (let x = 0; x < W; x += 38) blocks.push(<View key={`${x}:${y}`} style={[styles.block, { left: (x + 3) * sx, top: (y + 3) * sy, width: 32 * sx, height: 24 * sy }]} />);
  }
  const seg = (x1: number, y1: number, x2: number, y2: number, width: number, tint: string, key: string, round = false) => {
    const ax = x1 * sx;
    const ay = y1 * sy;
    const bx = x2 * sx;
    const by = y2 * sy;
    const len = Math.hypot(bx - ax, by - ay) + (round ? width : 0);
    const angle = Math.atan2(by - ay, bx - ax);
    return (
      <View
        key={key}
        style={{
          position: 'absolute',
          left: (ax + bx) / 2 - len / 2,
          top: (ay + by) / 2 - width / 2,
          width: len,
          height: width,
          borderRadius: round ? width / 2 : 0,
          backgroundColor: tint,
          transform: [{ rotate: `${angle}rad` }],
        }}
      />
    );
  };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ground]}>
      {blocks}
      {STREETS.map(([x1, y1, x2, y2, s, k], i) => seg(x1, y1, x2, y2, s, extra.map[k], `st${i}`))}
      <View style={[styles.park, { left: 268 * sx, top: 320 * sy, width: 96 * sx, height: 78 * sy }]} />
      <View style={[styles.tree, { left: 291 * sx, top: 341 * sy, width: 18, height: 18, borderRadius: 9 }]} />
      <View style={[styles.tree, { left: 318 * sx, top: 360 * sy, width: 24, height: 24, borderRadius: 12 }]} />
      <View style={[styles.park, { left: 34 * sx, top: 690 * sy, width: 70 * sx, height: 56 * sy }]} />
      {CANAL.slice(1).map((pt, i) => {
        const prev = CANAL[i] ?? pt;
        return seg(prev[0], prev[1], pt[0], pt[1], 42, extra.map.water, `cn${i}`, true);
      })}
      <Text variant="bodyBold" size={10} color={extra.map.label} style={[styles.street, { left: 300 * sx, top: 250 * sy, transform: [{ rotate: '-9deg' }] }]}>
        RUE OBERKAMPF
      </Text>
      <Text variant="bodyBold" size={10} color={extra.map.label} style={[styles.street, { left: 60 * sx, top: 236 * sy, transform: [{ rotate: '47deg' }] }]}>
        BD VOLTAIRE
      </Text>
      <Text variant="bodyBold" size={10} color={extra.map.waterLabel} style={[styles.street, { left: 24 * sx, top: 594 * sy }]}>
        CANAL
      </Text>
      <LinearGradient colors={[alpha(color.night, 0), alpha(color.night, 0.9)]} style={[styles.vignette, { height: h * 0.35 }]} />
    </View>
  );
}

/** Onde jaune qui part du pet (2,6 s), coupée si « réduire les animations ». */
function Radar({ delay = 0 }: { delay?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 0.6 : 0);
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2600, easing: Easing.bezier(0.2, 0.6, 0.3, 1) }), -1, false));
    return () => cancelAnimation(t);
  }, [delay, reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.8 * (1 - t.value), transform: [{ scale: 0.3 + 1.4 * t.value }] }));
  return <Animated.View style={[styles.radar, style]} />;
}

function Pin({ item, on, left, top, onPress }: { item: MapPet; on: boolean; left: number; top: number; onPress: () => void }) {
  const tint = speciesColor[item.pet.species];
  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      scaleTo={0.94}
      accessibilityLabel={item.accessibilityLabel}
      accessibilityState={{ selected: on }}
      style={[styles.pin, { left, top }]}
    >
      <View style={[styles.face, on ? styles.faceOn : styles.faceOff]}>
        <Avatar size={50} pet={item.pet} hidden bg={tint} pose={item.ghost ? 'fantome' : undefined} dimmed={item.ghost} />
      </View>
      <View style={[styles.dist, on && styles.distOn]}>
        <Text variant="bodyHeavy" size={11} color={on ? color.dark : color.white} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
}

function Sheet({ item, me, compatLabel }: { item: MapPet; me: PetLook; compatLabel: string }) {
  return (
    <>
      <View style={styles.sheetHead}>
        <Avatar size={60} pet={item.pet} hidden bg={speciesColor[item.pet.species]} />
        <View style={styles.sheetWho}>
          <Title text={item.pet.name} size={30} numberOfLines={1} />
          <Text size={13} muted numberOfLines={1}>
            {item.who}
          </Text>
        </View>
        {item.compat !== undefined ? (
          <View style={styles.compat}>
            <Title text={`${item.compat} %`} size={34} color={color.accent} />
            <Text variant="bodyHeavy" size={9} muted style={styles.compatLabel}>
              {compatLabel}
            </Text>
          </View>
        ) : null}
      </View>
      {item.via || item.tags?.length ? (
        <View style={styles.tags}>
          {item.via ? <Chip label={item.via} tone="glass" ink={color.accent} style={[styles.chip, styles.via]} /> : null}
          {item.tags?.map((tag) => <Chip key={tag} label={tag} tone="glass" style={styles.chip} />)}
        </View>
      ) : null}
      {item.after ? (
        <>
          <MessageBubble message={{ author: 'my_pet', kind: 'text', body: item.after.say, mediaUrl: null }} name={me.name.toLowerCase()} pet={me} />
          <Button label={item.after.label} variant="ghost" size="md" labelSize={15} onPress={item.after.onPress} />
        </>
      ) : (
        <Button label={item.action.label} variant={item.action.tone} onPress={item.action.onPress} loading={item.action.loading} />
      )}
    </>
  );
}

function EmptySheet({ text, label, onPress }: { text: string; label: string; onPress: () => void }) {
  return (
    <>
      <Text size={14} muted center>
        {text}
      </Text>
      <Button label={label} variant="white" onPress={onPress} />
    </>
  );
}

const PIN = 64;
const RADAR = 150;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: extra.map.ground, overflow: 'hidden' },
  ground: { backgroundColor: extra.map.ground },
  block: { position: 'absolute', borderRadius: 4, backgroundColor: extra.map.block },
  park: { position: 'absolute', borderRadius: 18, backgroundColor: extra.map.park },
  tree: { position: 'absolute', backgroundColor: extra.map.tree },
  street: { position: 'absolute', letterSpacing: 0.4 },
  vignette: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  me: { position: 'absolute', width: 0, height: 0, zIndex: 3 },
  meInner: { position: 'absolute', left: -36, top: -36, width: 72, alignItems: 'center' },
  meChip: { marginTop: 4, height: 26, paddingHorizontal: 11, alignSelf: 'center' },
  radar: {
    position: 'absolute',
    left: -RADAR / 2,
    top: -RADAR / 2,
    width: RADAR,
    height: RADAR,
    borderRadius: RADAR / 2,
    borderWidth: 2,
    borderColor: color.accent,
    backgroundColor: alpha(color.accent, 0.1),
  },
  pin: { position: 'absolute', width: PIN, minHeight: 44, alignItems: 'center', gap: 4, zIndex: 4 },
  face: { borderRadius: 999, padding: 3, backgroundColor: color.night },
  faceOff: { shadowColor: color.night, shadowOpacity: 0.5, shadowRadius: 7, shadowOffset: { width: 0, height: 6 } },
  faceOn: { borderWidth: 3, borderColor: color.accent, padding: 0, transform: [{ translateY: -5 }, { scale: 1.12 }] },
  dist: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: alpha(color.dark, 0.85), maxWidth: 90 },
  distOn: { backgroundColor: color.accent },
  head: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 18 },
  headText: { flex: 1, minWidth: 0 },
  badge: { height: 26, paddingHorizontal: 11, borderRadius: 999, justifyContent: 'center', overflow: 'hidden' },
  sheet: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 20,
    gap: 10,
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: alpha(color.white, 0.1),
    backgroundColor: color.panel,
    shadowColor: color.night,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -10 },
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: -6, backgroundColor: alpha(color.white, 0.2) },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetWho: { flex: 1, minWidth: 0 },
  compat: { alignItems: 'flex-end' },
  compatLabel: { letterSpacing: 1.08, textTransform: 'uppercase' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 26, paddingHorizontal: 11 },
  via: { backgroundColor: alpha(color.accent, 0.14) },
});
