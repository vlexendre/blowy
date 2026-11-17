import type { ComponentRef, Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { DressedPet } from '../atoms/DressedPet';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { color, type GradientName, onGradient, radius, space } from '../theme';
import type { PetLook, TitleContent } from '../types';
import { STORY_SIZE } from './StoryCard';

export interface ShareCardProps {
  /** Vue à capturer (`captureRef`, 1080 × 1920). */
  ref?: Ref<ComponentRef<typeof View>>;
  /** Nom de l'app, en minuscules, suivi d'un point coloré. */
  brand: string;
  /** Petite ligne au-dessus du titre (« Mes potes m’ont décrit »). */
  kicker?: string;
  title: TitleContent;
  /** Les mots en très gros (résultat « 3 mots »), chacun sur sa pastille. */
  words?: readonly string[];
  /** Grand chiffre (paliers : « 30 »), avec son unité dessous. */
  big?: { value: string; unit: string };
  /** Le minimoa dans sa tenue. */
  pet: PetLook;
  /** Phrase au-dessus du lien (« Vote encore : »). */
  callout: string;
  /** Lien affiché sans protocole ; la fin (le code) est mise en couleur. */
  url: string;
  gradient?: GradientName;
  /** Hors de l'écran : seulement pour la capture (les lecteurs d'écran l'ignorent). */
  offscreen?: boolean;
  /** Aperçu réduit dans l'app (0,5 : moitié de la taille d'une story). */
  scale?: number;
  accessibilityLabel?: string;
}

const WORD_TILT = [-3, 2.5, -1.5] as const;

/**
 * Le « moment capture d'écran » au format story (9:16) : résultat « 3 mots », palier de série, groupe qui tient, résultat
 * du test. Fixe (aucune animation), pour être capturé tel quel ; le bas reste dégagé pour l'interface d'Instagram.
 */
export function ShareCard({ ref, brand, kicker, title, words, big, pet, callout, url, gradient = 'violet', offscreen, scale, accessibilityLabel }: ShareCardProps) {
  const ink = onGradient[gradient];
  const cut = url.lastIndexOf('/') + 1;
  const card = (
    <View ref={ref} collapsable={false} style={styles.card} accessible={!offscreen} accessibilityLabel={accessibilityLabel}>
      <Panel gradient={gradient} radius={0} padding="none" style={styles.fill}>
        <Text variant="bodyHeavy" size={22} color={ink} style={styles.brand}>
          {brand}
          <Text variant="bodyHeavy" size={22} color={gradient === 'accent' ? color.dark : color.accent}>
            .
          </Text>
        </Text>
        {kicker ? (
          <Text variant="bodyBold" size={16} color={ink} style={styles.kicker}>
            {kicker}
          </Text>
        ) : null}
        <Title text={title} size={words?.length ? 34 : 40} color={ink} />
        {words?.length ? (
          <View style={styles.words}>
            {words.map((w, i) => (
              <View key={w} style={[styles.word, { transform: [{ rotate: `${WORD_TILT[i % WORD_TILT.length]}deg` }] }]}>
                <Text variant="bodyHeavy" size={30} color={color.dark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {w}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {big ? (
          <View style={styles.big}>
            <Text variant="bodyHeavy" size={96} color={ink} style={styles.bigValue}>
              {big.value}
            </Text>
            <Text variant="bodyHeavy" size={20} color={ink}>
              {big.unit}
            </Text>
          </View>
        ) : null}
        <View style={styles.pet}>
          <DressedPet species={pet.species} outfit={pet.outfit} size={words?.length ? 190 : 210} pose="salut" accessibilityLabel={pet.name} />
        </View>
        <View style={styles.foot}>
          <Text variant="bodyHeavy" size={15} color={ink} center>
            {callout}
          </Text>
          <View style={styles.link}>
            <Text variant="bodyHeavy" size={19} color={color.dark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {url.slice(0, cut)}
              <Text variant="bodyHeavy" size={19} color={color.violet}>
                {url.slice(cut)}
              </Text>
            </Text>
          </View>
        </View>
      </Panel>
    </View>
  );
  if (offscreen) {
    return (
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.offscreen}>
        {card}
      </View>
    );
  }
  if (scale && scale !== 1) {
    const w = STORY_SIZE.width * scale;
    const h = STORY_SIZE.height * scale;
    return (
      <View style={[styles.preview, { width: w, height: h }]}>
        <View style={{ transform: [{ translateX: (w - STORY_SIZE.width) / 2 }, { translateY: (h - STORY_SIZE.height) / 2 }, { scale }] }}>{card}</View>
      </View>
    );
  }
  return card;
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  preview: { alignSelf: 'center', overflow: 'hidden', borderRadius: radius.lg },
  card: { ...STORY_SIZE, overflow: 'hidden', backgroundColor: color.dark },
  fill: { flex: 1, paddingTop: 56, paddingHorizontal: 24 },
  brand: { marginBottom: space.md },
  kicker: { marginBottom: space.xs, opacity: 0.85 },
  words: { marginTop: space.lg, gap: space.sm, alignItems: 'flex-start' },
  word: { maxWidth: 300, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, backgroundColor: color.accent },
  big: { marginTop: space.md },
  bigValue: { lineHeight: 100 },
  pet: { position: 'absolute', right: -18, bottom: 172 },
  // Le dernier huitième de la story est couvert par l'interface d'Instagram : rien d'important dessous.
  foot: { position: 'absolute', left: 24, right: 24, bottom: 84, gap: space.sm },
  link: { height: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: color.white },
});
