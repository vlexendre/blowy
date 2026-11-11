/**
 * Carte stylisée (non géographique) du voisinage d'un pet : le tien au centre, tes liens sur le premier cercle,
 * les pets croisés sur le second. Positions calculées, aucune géolocalisation.
 */
import { color, space, speciesColor } from '@blowy/tokens';
import { alpha, Avatar, Panel, PetImage, type PetLook, Pressable, Sticker, Text } from '@blowy/ui';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

export interface MapPet {
  key: string;
  /** Prénom de la personne. */
  name: string;
  pet: PetLook;
  ghost?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}

export interface NeighbourhoodMapProps {
  me: PetLook;
  meLabel: string;
  linked: readonly MapPet[];
  met: readonly MapPet[];
}

const RING1 = 8;
const RING2 = 10;

function place(count: number, radius: number, cx: number, cy: number, offset: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((-90 + offset + (i * 360) / Math.max(count, 1)) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

export function NeighbourhoodMap({ me, meLabel, linked, met }: NeighbourhoodMapProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const height = Math.round(width * 0.98);
  const cx = width / 2;
  const cy = height / 2;
  const r1 = width * 0.27;
  const r2 = width * 0.38;
  const ring1 = linked.slice(0, RING1);
  const ring2 = met.slice(0, RING2);
  const p1 = place(ring1.length, r1, cx, cy, 35);
  const p2 = place(ring2.length, r2, cx, cy, 360 / Math.max(ring2.length, 1) / 2 + 20);

  return (
    <Panel gradient="night" padding="none" style={[styles.panel, { height: height || undefined }]}>
      <View style={StyleSheet.absoluteFill} onLayout={onLayout} />
      {width > 0 ? (
        <>
          {[r2, r1, width * 0.14].map((r, i) => (
            <View
              key={r}
              pointerEvents="none"
              style={[
                styles.ring,
                { width: r * 2, height: r * 2, borderRadius: r, left: cx - r, top: cy - r },
                i === 2 ? styles.core : null,
              ]}
            />
          ))}
          <View pointerEvents="none" style={[styles.center, { left: cx - 60, top: cy - 66 }]}>
            <PetImage species={me.species} form={me.form} size={104} animation="breathe" accessibilityLabel={me.name} />
            <Sticker label={meLabel} size="sm" rotate={-4} style={styles.meSticker} />
          </View>
          {ring1.map((p, i) => (
            <Pin key={p.key} item={p} size={58} x={p1[i]?.x ?? cx} y={p1[i]?.y ?? cy} strong />
          ))}
          {ring2.map((p, i) => (
            <Pin key={p.key} item={p} size={46} x={p2[i]?.x ?? cx} y={p2[i]?.y ?? cy} />
          ))}
        </>
      ) : null}
    </Panel>
  );
}

function Pin({ item, size, x, y, strong }: { item: MapPet; size: number; x: number; y: number; strong?: boolean }) {
  const box = size + space.xl * 2;
  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel}
      scaleTo={0.94}
      style={[styles.pin, { width: box, left: x - box / 2, top: y - size / 2 }]}
    >
      <View style={[styles.pinInner, { width: box }]}>
        <Avatar size={size} pet={item.pet} hidden pose={item.ghost ? 'fantome' : undefined} ring={strong ? speciesColor[item.pet.species] : undefined} dimmed={item.ghost} />
        <Text variant="bodyBold" size={11} numberOfLines={1} center muted={!strong} style={styles.name}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { overflow: 'hidden', minHeight: 320 },
  ring: { position: 'absolute', borderWidth: 1, borderStyle: 'dashed', borderColor: alpha(color.white, 0.16) },
  core: { borderStyle: 'solid', borderColor: alpha(color.accent, 0.5), backgroundColor: alpha(color.accent, 0.08) },
  center: { position: 'absolute', width: 120, alignItems: 'center' },
  meSticker: { marginTop: -space.md },
  pin: { position: 'absolute' },
  pinInner: { alignItems: 'center', gap: 2 },
  name: { maxWidth: '100%' },
});
