import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Glyph } from '../atoms/Glyph';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title, titleWidthEm } from '../atoms/Title';
import { PopIn } from '../motion/PopIn';
import { alpha, color, radius, space } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface ProfileHeroProps {
  /** « ALEX. / ET BISCOTTE. » (deux lignes au plus, `\n` entre les deux). */
  title: TitleContent;
  /** Une ligne courte sous le nom (« 42 jours ensemble »). */
  caption?: string;
  /** Ta photo : toujours nette pour toi. Sans photo, ton minimoa prend sa place. */
  photoUri?: string | null;
  pet: PetLook;
  /** Libellé lu de l'en-tête entier (« Ton profil. Touche pour modifier ton nom ou ta photo. »). */
  accessibilityLabel: string;
  onPress?: () => void;
}

const AVATAR = 68;
const BADGE = 28;
/** Corps du nom : 32 au plus, réduit pour que la ligne la plus longue tienne (prénoms et noms de minimoa longs, 375 pt). */
const MAX_TITLE = 32;
const MIN_TITLE = 22;
/** Ce qui n'est pas le texte dans la largeur de l'écran (estimation avant la mesure) : marges de l'onglet et du panneau, avatar, écarts, chevron. */
const AROUND = 24 + 28 + AVATAR + 8 + space.md * 2 + 28;
/** Marge sur la chasse estimée des titres (crénage, rendu web). */
const SAFE = 0.92;

/**
 * En-tête de Moi : qui tu es, en une ligne de regard. Ta photo (nette pour toi) avec ton minimoa en pastille, ou ton
 * minimoa seul tant que tu n'as pas de photo ; ton nom et le sien ; une ligne courte. Tout l'en-tête mène à ton compte
 * (nom, photo). Ce que voient les autres de ta photo s'explique sur l'écran de la photo, pas ici.
 */
export function ProfileHero({ title, caption, photoUri, pet, accessibilityLabel, onPress }: ProfileHeroProps) {
  const { width } = useWindowDimensions();
  // Largeur réelle de la colonne de texte une fois mesurée ; avant, une estimation depuis la largeur de l'écran.
  const [measured, setMeasured] = useState(0);
  const avail = (measured || width - AROUND) * SAFE;
  const em = titleWidthEm(title);
  const size = Math.floor(Math.max(MIN_TITLE, Math.min(MAX_TITLE, em > 0 ? avail / em : MAX_TITLE)));
  const body = (
    <Panel gradient="rose" radius={radius.card + 2} padding="none" style={styles.panel}>
      <View style={styles.face}>
        {photoUri ? (
          <>
            <Avatar size={AVATAR} uri={photoUri} ring={color.white} />
            {/* Le minimoa arrive en « pop » sur le coin de ta photo. */}
            <PopIn delay={220} from={0.3} style={styles.badge} pointerEvents="none">
              <Avatar size={BADGE} pet={pet} hidden ring={color.white} />
            </PopIn>
          </>
        ) : (
          <PopIn delay={120} from={0.6}>
            <Avatar size={AVATAR} pet={pet} hidden ring={color.white} />
          </PopIn>
        )}
      </View>
      <View style={styles.texts} onLayout={(e) => setMeasured(Math.round(e.nativeEvent.layout.width))}>
        <Title text={title} size={size} numberOfLines={2} />
        {caption ? (
          <Text variant="bodyBold" size={13} numberOfLines={1} style={styles.caption}>
            {caption}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <View style={styles.more} pointerEvents="none">
          <Glyph name="chevron" size={16} color={color.dark} />
        </View>
      ) : null}
    </Panel>
  );
  if (!onPress) return <View accessible accessibilityLabel={accessibilityLabel}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} scaleTo={0.98}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + 2, paddingHorizontal: space.md + 2 },
  face: { width: AVATAR + 8, height: AVATAR + 8, alignItems: 'center', justifyContent: 'center' },
  // La pastille du minimoa déborde un peu du coin bas-droit de la photo.
  badge: { position: 'absolute', right: -4, bottom: -2 },
  texts: { flex: 1, minWidth: 0 },
  caption: { marginTop: 4, opacity: 0.75 },
  more: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(color.dark, 0.08) },
});
