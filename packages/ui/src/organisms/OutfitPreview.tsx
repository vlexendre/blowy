import { ITEM_SLOTS, type ItemSlot, type Outfit, type Species } from '@blowy/domain';
import { type ComponentRef, type Ref, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { FIT_CANVAS, placeItem } from '../assets/fit';
import { ItemImage } from '../atoms/ItemImage';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { measureInWindow, type Rect } from '../motion/MotionHost';
import { PetActor, type PetActorHandle, type PetActorReaction } from '../motion/pets/PetActor';
import { alpha, color, type GradientName, speciesGradient } from '../theme';

/** Commandes de l'aperçu pour les vols d'objets (garde-robe → pet). */
export interface OutfitPreviewHandle {
  /** Rectangle (fenêtre) qu'occupe un objet posé sur le pet : là où il doit atterrir, ou d'où il s'envole. */
  itemRect: (id: string) => Promise<Rect | null>;
  /** Fait réagir le pet (`joy` quand un objet se pose…). */
  react: (kind: PetActorReaction) => void;
}

export interface OutfitPreviewProps {
  species: Species;
  outfit: Outfit;
  /** Noms des emplacements (`slotLabel`). */
  slotLabels: Record<ItemSlot, string>;
  /** Noms des objets (`itemLabel`). */
  itemLabels: Record<string, string>;
  /** Emplacement vide (« rien »), lu par le lecteur d'écran. */
  emptyLabel: string;
  /** Emplacement en cours d'édition (case cerclée). */
  activeSlot?: ItemSlot;
  onSlotPress?: (slot: ItemSlot) => void;
  gradient?: GradientName;
  petLabel?: string;
  /** Objets portés mais pas encore montrés (en vol vers le pet). */
  hiddenItems?: readonly string[];
  /** Id du pet (graine de son hasard). */
  seed?: string;
  /** Commandes pour les vols d'objets. */
  previewRef?: Ref<OutfitPreviewHandle>;
}

/** Hauteur du panneau (V6-GardeRobe : 178) et du pet (170). */
const HEIGHT = 178;
const PET_HEIGHT = 170;
const PET_SIZE = Math.round(PET_HEIGHT * 0.9);

/**
 * Haut de la garde-robe : le pet habillé en direct (vivant : il respire, réagit au toucher et aux objets qu'on lui
 * pose) et une case par emplacement (objet porté ou « + »), qui rebondit quand son objet change.
 */
export function OutfitPreview({
  species,
  outfit,
  slotLabels,
  itemLabels,
  emptyLabel,
  activeSlot,
  onSlotPress,
  gradient,
  petLabel,
  hiddenItems,
  seed,
  previewRef,
}: OutfitPreviewProps) {
  const petBox = useRef<ComponentRef<typeof View>>(null);
  const actor = useRef<PetActorHandle>(null);
  useImperativeHandle(
    previewRef,
    () => ({
      itemRect: async (id) => {
        const box = await measureInWindow(petBox);
        const p = placeItem(species, id);
        if (!box || !p) return box;
        const k = box.width / FIT_CANVAS.width;
        return { x: box.x + p.left * k, y: box.y + p.top * k, width: p.width * k, height: p.height * k };
      },
      react: (kind) => actor.current?.react(kind),
    }),
    [species],
  );
  return (
    <Panel gradient={gradient ?? speciesGradient[species]} radius={32} padding="none" style={styles.panel}>
      <View style={styles.inner}>
        <View ref={petBox} collapsable={false} style={styles.pet}>
          <PetActor
            ref={actor}
            species={species}
            outfit={outfit}
            size={PET_SIZE}
            seed={seed}
            hiddenItems={hiddenItems}
            sleepAfter={null}
            shadow={false}
            accessibilityLabel={petLabel}
          />
        </View>
        <View style={styles.grid}>
          {[ITEM_SLOTS.slice(0, 2), ITEM_SLOTS.slice(2)].map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((slot) => {
                const id = outfit[slot];
                const on = slot === activeSlot;
                return (
                  <Pressable
                    key={slot}
                    onPress={onSlotPress ? () => onSlotPress(slot) : undefined}
                    disabled={!onSlotPress}
                    haptic="selection"
                    scaleTo={0.95}
                    bounceKey={id ?? null}
                    accessibilityRole={onSlotPress ? 'button' : 'text'}
                    accessibilityLabel={`${slotLabels[slot]} : ${id ? (itemLabels[id] ?? id) : emptyLabel}`}
                    accessibilityState={{ selected: on }}
                    style={[styles.box, on && styles.boxOn]}
                  >
                    {id ? (
                      <ItemImage id={id} size={44} />
                    ) : (
                      <Text variant="body" size={22} color={color.white} style={styles.plus}>
                        +
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  // `.panel.row` : 178 de haut, padding 0 14, écart 6.
  panel: { height: HEIGHT },
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 6 },
  pet: { alignSelf: 'flex-end', height: PET_HEIGHT, marginBottom: 2 },
  // Grille 2 × 2, écart 6 ; cases de 62, encre à 28 %, rayon 16.
  grid: { flex: 1, minWidth: 0, gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  box: {
    flex: 1,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(color.dark, 0.28),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  boxOn: { borderColor: alpha(color.white, 0.75) },
  plus: { opacity: 0.6 },
});
