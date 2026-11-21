import type { LeagueTier, Outfit, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { leagueImage } from '../assets/ligues';
import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { PopIn, Pulse } from '../motion/PopIn';
import { PetActor } from '../motion/pets/PetActor';
import { alpha, color, extra, radius, space } from '../theme';

/** Une étape du chemin : faite, celle du jour, un coffre (fin d'unité), verrouillée, ou le bandeau d'un univers. */
export type CheminNodeKind = 'done' | 'current' | 'chest' | 'chestOpen' | 'locked' | 'unit' | 'gap';

export interface CheminPathNode {
  key: string;
  kind: CheminNodeKind;
  accessibilityLabel: string;
  /** Bandeau d'univers (`unit`) : « Univers 2 · Ta façon d'aimer », « 3 étapes sur 5 ». */
  title?: string;
  subtitle?: string;
  /** Rang de l'univers (couleur du bandeau). */
  index?: number;
  /** Espace vide (`gap`) : pour qu'un chapitre remplisse l'écran. */
  height?: number;
}

export interface CheminPathProps {
  nodes: readonly CheminPathNode[];
  /** Bulle blanche au-dessus de l'étape du jour (« Commencer ») ; null : pas de bulle (séance faite). */
  startLabel?: string | null;
  /** Toucher l'étape du jour (ou sa bulle). */
  onStart?: () => void;
  /** Le minimoa qui attend à côté de l'étape du jour. */
  pet?: { species: Species; outfit?: Outfit | null; id?: string } | null;
  /** Puce de la série en haut à droite (« 12 jours d’affilée ») → l'écran série. */
  streak?: { label: string; accessibilityLabel: string; onPress: () => void } | null;
  /** Puce de la ligue en haut à gauche (« Pompon · 4e ») → le classement, comme les ligues de Duolingo. */
  league?: {
    tier: LeagueTier;
    label: string;
    accessibilityLabel: string;
    onPress: () => void;
    up?: boolean;
  } | null;
  /** Hauteur (dans le chemin) de l'étape du jour, pour y faire défiler l'écran. */
  onCurrentY?: (y: number) => void;
}

/** Hauteur d'un bandeau d'univers dans le chemin (marges comprises). */
const UNIT = 92;
const UNIT_COLORS = [
  extra.relief.unit,
  color.coral,
  color.rose,
  color.orange,
  color.violet,
  color.lime,
] as const;

const NODE = 48;
const NOW = 72;
/** Écart vertical entre deux étapes (bord à bord, en relief compris). */
const GAP = 4;
const EDGE = 5;
/** Amplitude des virages, en part de la demi-largeur utile. */
const SWING = 0.42;

/** Abscisse (0 = centre) de la n-ième étape : un chemin sinueux, stable d'un rendu à l'autre. */
export function cheminSwing(i: number): number {
  return Math.sin(i * 0.95 + 0.6) * SWING + Math.sin(i * 0.37) * 0.12;
}

/**
 * Le chemin façon Duolingo de l'accueil (V6-GAccueil) : des étapes rondes en relief le long d'un sentier pointillé
 * qui serpente ; les faites en vert avec une coche, celle du jour plus grosse et jaune avec « Commencer » et le
 * minimoa qui attend à côté, le coffre de l'unité, puis les verrouillées. La série en puce, en haut à droite.
 * Mouvement : l'étape du jour bat deux fois à l'arrivée (une vedette, rien en boucle) ; animations réduites : fixe.
 */
export function CheminPath({ nodes, startLabel, onStart, pet, streak, league, onCurrentY }: CheminPathProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const half = Math.max(0, width / 2 - NOW / 2 - space.sm);
  const nowIndex = nodes.findIndex((n) => n.kind === 'current');
  // Place sous la bulle « Commencer » : l'étape du jour descend un peu.
  const top = startLabel && nowIndex >= 0 ? 34 : 6;
  let cursor = top;
  let step = 0;
  const sizeOf = (n: CheminPathNode | undefined) => (n?.kind === 'current' ? NOW : n?.kind === 'unit' ? UNIT : n?.kind === 'gap' ? (n.height ?? 0) : NODE);
  const centers = nodes.map((n, i) => {
    const size = sizeOf(n);
    const prev = i > 0 ? sizeOf(nodes[i - 1]) : 0;
    cursor = i === 0 ? top + size / 2 : cursor + (prev + size) / 2 + GAP;
    if (n.kind === 'unit' || n.kind === 'gap') return { x: width / 2, y: cursor, size };
    step += 1;
    return { x: width / 2 + cheminSwing(step) * half, y: cursor, size };
  });
  const last = centers[centers.length - 1];
  const height = last ? last.y + last.size / 2 + EDGE + space.sm : 0;
  const d = centers
    .filter((_, i) => nodes[i]?.kind !== 'unit' && nodes[i]?.kind !== 'gap')
    .reduce((acc, c, i, list) => {
      if (i === 0) return `M${c.x} ${c.y}`;
      const p = list[i - 1] as (typeof centers)[number];
      return `${acc} Q${p.x} ${(p.y + c.y) / 2} ${(p.x + c.x) / 2} ${(p.y + c.y) / 2} T${c.x} ${c.y}`;
    }, '');
  const now = nowIndex >= 0 ? centers[nowIndex] : null;
  const pillTop = { top: now ? Math.max(0, now.y - 22) : 0 };
  const nowY = now?.y ?? null;
  useEffect(() => {
    if (nowY !== null && width > 0) onCurrentY?.(nowY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowY, width]);
  // Le minimoa attend du côté où il y a de la place.
  const petLeft = now ? (now.x > width / 2 ? now.x - NOW / 2 - 92 : now.x + NOW / 2 + 8) : 0;

  return (
    <View onLayout={onLayout} style={[styles.wrap, { height: Math.max(height, NOW + 40) }]}>
      {width > 0 ? (
        <>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path
              d={d}
              fill="none"
              stroke={extra.relief.path}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray="2 16"
            />
          </Svg>
          {nodes.map((n, i) => {
            const c = centers[i] as (typeof centers)[number];
            if (n.kind === 'gap') return null;
            if (n.kind === 'unit') {
              return (
                <View
                  key={n.key}
                  style={[
                    styles.abs,
                    styles.unit,
                    {
                      top: c.y - UNIT / 2 + 8,
                      backgroundColor: UNIT_COLORS[(n.index ?? 0) % UNIT_COLORS.length],
                    },
                  ]}
                  accessible
                  accessibilityRole="header"
                  accessibilityLabel={n.accessibilityLabel}
                >
                  <Text variant="label" size={12} color={color.white} numberOfLines={1}>
                    {n.subtitle ?? ''}
                  </Text>
                  <Text variant="bodyHeavy" size={18} color={color.white} numberOfLines={1}>
                    {n.title ?? ''}
                  </Text>
                </View>
              );
            }
            return (
              <View key={n.key} style={[styles.abs, { left: c.x - c.size / 2, top: c.y - c.size / 2 }]}>
                <StepDisc node={n} size={c.size} onPress={n.kind === 'current' ? onStart : undefined} />
              </View>
            );
          })}
          {now && startLabel ? (
            <PopIn
              delay={160}
              from={0.7}
              style={[styles.abs, { left: now.x - 56, top: now.y - NOW / 2 - 36 }]}
            >
              <Pressable
                onPress={onStart}
                accessibilityRole="button"
                accessibilityLabel={startLabel}
                style={styles.go}
                scaleTo={0.95}
              >
                <Text variant="label" size={13} color={color.dark}>
                  {startLabel}
                </Text>
                <View style={styles.goTail} />
              </Pressable>
            </PopIn>
          ) : null}
          {now && pet ? (
            <View pointerEvents="none" style={[styles.abs, { left: petLeft, top: now.y - 46 }]}>
              <PetActor
                species={pet.species}
                outfit={pet.outfit}
                size={84}
                seed={pet.id}
                mood="joie"
                sleepAfter={null}
                touch={false}
                grabbable={false}
              />
            </View>
          ) : null}
        </>
      ) : null}
      {/* Ligue et série à hauteur de l'étape du jour (le chemin peut être bien plus haut que l'écran). */}
      {league ? (
        <Pressable
          onPress={league.onPress}
          accessibilityRole="button"
          accessibilityLabel={league.accessibilityLabel}
          style={[styles.streak, styles.league, league.up ? styles.leagueUp : null, pillTop]}
          scaleTo={0.96}
        >
          <Image source={leagueImage(league.tier)} style={styles.leagueBadge} contentFit="contain" />
          <Text variant="bodyHeavy" size={14} numberOfLines={1}>
            {league.label}
          </Text>
        </Pressable>
      ) : null}
      {streak ? (
        <Pressable
          onPress={streak.onPress}
          accessibilityRole="button"
          accessibilityLabel={streak.accessibilityLabel}
          style={[styles.streak, pillTop]}
          scaleTo={0.96}
        >
          <Icon name="flamme" size={18} />
          <Text variant="bodyHeavy" size={14} numberOfLines={1}>
            {streak.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const LOOK: Record<CheminNodeKind, { bg: string; edge: string; ink: string }> = {
  done: { bg: extra.relief.done, edge: extra.relief.doneEdge, ink: color.dark },
  current: { bg: color.accent, edge: extra.relief.nowEdge, ink: color.dark },
  chest: { bg: extra.relief.chest, edge: extra.relief.chestEdge, ink: extra.relief.chestInk },
  chestOpen: { bg: extra.relief.done, edge: extra.relief.doneEdge, ink: color.dark },
  unit: { bg: extra.relief.unit, edge: extra.relief.unit, ink: color.white },
  gap: { bg: 'transparent', edge: 'transparent', ink: color.white },
  locked: { bg: extra.relief.locked, edge: extra.relief.lockedEdge, ink: extra.relief.lockedInk },
};

/** Un disque en relief : la tranche (plus foncée) dessous, le disque par-dessus ; il s'enfonce à l'appui. */
function StepDisc({ node, size, onPress }: { node: CheminPathNode; size: number; onPress?: () => void }) {
  const look = LOOK[node.kind];
  const edge = node.kind === 'current' ? EDGE + 2 : EDGE;
  const glyph =
    node.kind === 'done' ? (
      <Glyph name="check" size={24} color={look.ink} />
    ) : node.kind === 'current' ? (
      <Glyph name="play" size={30} color={look.ink} filled />
    ) : node.kind === 'locked' ? (
      <Glyph name="lock" size={22} color={look.ink} />
    ) : (
      <Icon name="cadeau" size={30} />
    );
  const disc = (
    <View style={{ width: size, height: size + edge }}>
      <View style={[styles.disc, { width: size, height: size, top: edge, backgroundColor: look.edge }]} />
      <View style={[styles.disc, { width: size, height: size, backgroundColor: look.bg }]}>{glyph}</View>
      {node.kind === 'current' ? (
        <View
          pointerEvents="none"
          style={[styles.halo, { width: size + 16, height: size + 16, left: -8, top: -8 }]}
        />
      ) : null}
    </View>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={node.accessibilityLabel}>
        {disc}
      </View>
    );
  }
  return (
    <Pulse>
      <Pressable
        onPress={onPress}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel={node.accessibilityLabel}
        scaleTo={0.94}
      >
        {disc}
      </Pressable>
    </Pulse>
  );
}

const styles = StyleSheet.create({
  league: { right: undefined, left: 0, borderColor: alpha(color.violet, 0.55) },
  leagueUp: { borderColor: alpha(color.ok, 0.7) },
  leagueBadge: { width: 24, height: 24 },
  wrap: { width: '100%' },
  abs: { position: 'absolute' },
  // Bandeau d'univers : pleine largeur, comme les unités de Duolingo.
  unit: {
    left: 0,
    right: 0,
    height: UNIT - 16,
    borderRadius: 22,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    gap: 2,
  },
  disc: {
    position: 'absolute',
    left: 0,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    borderRadius: radius.pill,
    borderWidth: 8,
    borderColor: alpha(color.accent, 0.2),
  },
  go: {
    width: 112,
    height: 28,
    borderRadius: 10,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goTail: {
    position: 'absolute',
    bottom: -4,
    left: 51,
    width: 10,
    height: 10,
    backgroundColor: color.white,
    transform: [{ rotate: '45deg' }],
  },
  streak: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: alpha(color.orange, 0.45),
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
