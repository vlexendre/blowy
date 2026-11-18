import type { ComponentRef, Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { captureOnly } from '../lib/styles';
import { Title } from '../atoms/Title';
import { color, gradient, radius, space } from '../theme';
import type { PetLook, TitleContent } from '../types';

/** Format d'une story (9:16). Capturée trois fois plus grande : 1080 × 1920. */
export const STORY_SIZE = { width: 360, height: 640 } as const;

export interface StoryCardProps {
  /** Vue à capturer (`captureRef`). */
  ref?: Ref<ComponentRef<typeof View>>;
  /** Nom de l'app, en minuscules, suivi d'un point coloré. */
  brand: string;
  title: TitleContent;
  /** Ce que dit le minimoa dans sa bulle. */
  line: string;
  pet: PetLook;
  /** Phrase au-dessus du lien (« Viens créer le tien »). */
  callout: string;
  /** Lien affiché sans protocole ; la fin (le code) est mise en couleur. */
  url: string;
  /**
   * Pour la capture seulement : montée dans l'écran mais transparente (`captureOnly`), personne ne la voit dans l'app
   * (et les lecteurs d'écran l'ignorent).
   */
  offscreen?: boolean;
}

/**
 * L'image partagée en story (invitation) : fixe, sans animation ni état, pour être capturée telle quelle. Le bas reste
 * dégagé : Instagram y pose ses propres boutons.
 */
export function StoryCard({ ref, brand, title, line, pet, callout, url, offscreen }: StoryCardProps) {
  const cut = url.lastIndexOf('/') + 1;
  return (
    <View
      pointerEvents={offscreen ? 'none' : undefined}
      accessibilityElementsHidden={offscreen}
      importantForAccessibility={offscreen ? 'no-hide-descendants' : undefined}
      style={offscreen ? captureOnly.host : undefined}
    >
      <View ref={ref} collapsable={false} style={styles.card}>
        <Panel gradient="violet" radius={0} padding="none" style={styles.fill}>
          <Text variant="bodyHeavy" size={22} style={styles.brand}>
            {brand}
            <Text variant="bodyHeavy" size={22} color={color.accent}>
              .
            </Text>
          </Text>
          <Title text={title} size={40} />
          <View style={styles.bubble}>
            <Text variant="bodyBold" size={17} color={color.dark}>
              {line}
            </Text>
          </View>
          <View style={styles.pet}>
            <PetImage species={pet.species} mood="salut" size={236} rotate={-4} outline accessibilityLabel={pet.name} />
          </View>
          <View style={styles.foot}>
            <Text variant="bodyHeavy" size={15} center>
              {callout}
            </Text>
            <View style={styles.link}>
              <Text variant="bodyHeavy" size={19} color={color.dark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {url.slice(0, cut)}
                <Text variant="bodyHeavy" size={19} color={gradient.violet[0]}>
                  {url.slice(cut)}
                </Text>
              </Text>
            </View>
          </View>
        </Panel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...STORY_SIZE, overflow: 'hidden', backgroundColor: color.dark },
  fill: { flex: 1, paddingTop: 56, paddingHorizontal: 24 },
  brand: { marginBottom: space.md },
  bubble: {
    alignSelf: 'flex-start',
    zIndex: 1,
    maxWidth: 210,
    marginTop: space.lg,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md - 2,
    borderRadius: radius.md,
    borderBottomLeftRadius: 6,
    backgroundColor: color.white,
  },
  pet: { position: 'absolute', right: -24, bottom: 158 },
  // Le dernier huitième de la story est couvert par l'interface d'Instagram : rien d'important dessous.
  foot: { position: 'absolute', left: 24, right: 24, bottom: 84, gap: space.sm },
  link: { height: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: color.white },
});
