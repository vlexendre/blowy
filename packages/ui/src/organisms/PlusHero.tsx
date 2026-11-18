import type { Outfit, Species } from '@blowy/domain';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { DressedPet } from '../atoms/DressedPet';
import { ItemImage } from '../atoms/ItemImage';
import { Text } from '../atoms/Text';
import { fitTitleSize, Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { useLoop } from '../lib/motion';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { alpha, color, motion, space } from '../theme';

type Pose = ComponentProps<typeof DressedPet>['pose'];

/** Un bénéfice illustré : une pose du minimoa et deux à quatre mots dessous. */
export interface PlusHeroPose {
  key: string;
  pose: Pose;
  /** « Plus de rencontres ». */
  label: string;
  /** Tenue de cette pose (la vitrine des objets premium) ; sinon le minimoa nu. */
  outfit?: Outfit | null;
}

export interface PlusHeroProps {
  /** Marque au-dessus du titre (« minimoa ») : le « + » jaune est ajouté. */
  brand: string;
  /** En haut à droite, à hauteur de la marque : la croix de fermeture. */
  corner?: ReactNode;
  /** Le grand titre bénéfice (« Nino te présente plus de monde. »). */
  headline: string;
  pet: { species: Species; name: string };
  /** Trois poses et trois bénéfices courts, sous le titre ; sur un petit écran, seule la dernière, à côté du titre. */
  poses: readonly PlusHeroPose[];
  /** Objets premium qui flottent près du minimoa (petit écran : le premier seulement). */
  floatingItems?: readonly string[];
  /** Preuve concrète (nombre réel venu du serveur) : absente à zéro. */
  teaser?: { label: string; species: readonly Species[] } | null;
  /** Petit écran : une seule pose à droite du titre, sans les bénéfices courts (la liste les reprend). */
  compact?: boolean;
}

/** Un objet premium qui flotte (boucle douce, arrêtée avec « réduire les animations »). */
function Floating({ id, size, delay, style }: { id: string; size: number; delay: number; style: object }) {
  const t = useLoop(2600, true, delay);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: -5 * t.value }, { rotate: `${-6 + 12 * t.value}deg` }] }));
  return (
    <PopIn delay={420 + delay / 4} from={0.3} style={[styles.floating, style]} pointerEvents="none">
      <Animated.View style={float}>
        <ItemImage id={id} size={size} />
      </Animated.View>
    </PopIn>
  );
}

function Teaser({ teaser }: { teaser: NonNullable<PlusHeroProps['teaser']> }) {
  return (
    <Appear delay={260} style={[layout.row, styles.teaser]}>
      <View style={[layout.row, styles.silhouettes]} accessible={false}>
        {teaser.species.slice(0, 3).map((s, i) => (
          <Avatar key={s} size={26} pet={{ name: s, species: s }} blurred cutout style={i ? styles.silhouetteNext : null} />
        ))}
      </View>
      <Text variant="bodyHeavy" size={14} style={layout.grow}>
        {teaser.label}
      </Text>
    </Appear>
  );
}

/**
 * Haut de la feuille Minimoa+ : un grand titre bénéfice, très lisible, puis le minimoa de la personne en trois poses qui
 * illustrent trois bénéfices courts. Petit écran : le titre à gauche, une seule pose (habillée en objets premium) à droite.
 */
export function PlusHero({ brand, corner, headline, pet, poses, floatingItems = [], teaser, compact }: PlusHeroProps) {
  const { width } = useWindowDimensions();
  const mark = <Title text={[{ text: brand }, { text: '+', color: color.accent }]} size={compact ? 24 : 26} style={styles.brand} />;
  if (compact) {
    const hero = poses[poses.length - 1];
    // Le titre partage la ligne avec le minimoa et la croix : son corps se règle pour qu'aucun mot ne soit coupé.
    const room = Math.min(width, 520) - 40 - PET_COMPACT - 44 - space.lg;
    return (
      <View style={styles.compact}>
        <View style={[layout.grow, styles.compactText]}>
          {mark}
          <Title text={headline} size={fitTitleSize(headline, 32, room, 22)} style={styles.headlineCompact} />
          {teaser ? <Teaser teaser={teaser} /> : null}
        </View>
        <View style={styles.compactPet} pointerEvents="none">
          <Appear from="right" distance={40} delay={120} duration={motion.slow}>
            <DressedPet species={pet.species} outfit={hero?.outfit ?? null} pose={hero?.pose} size={PET_COMPACT} animated accessibilityLabel={pet.name} />
          </Appear>
          {floatingItems[0] ? <Floating id={floatingItems[0]} size={30} delay={0} style={{ top: 60, right: -30 }} /> : null}
        </View>
        {corner}
      </View>
    );
  }
  return (
    <View>
      <View style={[layout.row, styles.head]}>
        <View style={layout.grow}>
          {mark}
          <Title text={headline} size={35} style={styles.headline} />
        </View>
        {corner}
      </View>
      {teaser ? <Teaser teaser={teaser} /> : null}
      <View style={[layout.row, styles.trio]}>
        {poses.slice(0, 3).map((p, i) => (
          <Appear key={p.key} delay={120 + i * 90} distance={14} style={styles.poseCell}>
            <View style={styles.halo} />
            <DressedPet species={pet.species} outfit={p.outfit ?? null} pose={p.pose} size={68} animated delay={i * 400} />
            <Text variant="bodyHeavy" size={14} center numberOfLines={2} style={styles.poseLabel}>
              {p.label}
            </Text>
          </Appear>
        ))}
      </View>
    </View>
  );
}

const HALO = 62;
/** Minimoa du petit écran, entre le titre et la croix. */
const PET_COMPACT = 84;

const styles = StyleSheet.create({
  brand: { lineHeight: 22, marginTop: 3, marginBottom: 3 },
  head: { alignItems: 'flex-start', gap: space.sm },
  headline: { lineHeight: 28 },
  headlineCompact: { lineHeight: 25 },
  trio: { marginTop: space.xs, alignItems: 'flex-start' },
  poseCell: { flex: 1, flexBasis: 0, alignItems: 'center' },
  // Disque clair derrière chaque pose : les trois minimoas posés sur la même scène.
  halo: {
    position: 'absolute',
    top: 12,
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: alpha(color.white, 0.07),
  },
  poseLabel: { marginTop: 0, lineHeight: 17, paddingHorizontal: 2 },
  compact: { flexDirection: 'row', alignItems: 'flex-start' },
  compactText: { paddingRight: space.xs },
  compactPet: { width: PET_COMPACT, marginTop: 2, marginRight: space.xs },
  floating: { position: 'absolute' },
  teaser: { gap: space.sm, alignItems: 'center', marginTop: space.sm },
  silhouettes: { alignItems: 'center' },
  silhouetteNext: { marginLeft: -10 },
});
