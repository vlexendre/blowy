import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { MessageBubble } from '../molecules/MessageBubble';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { alpha, color, gradient, radius, shadow, size, space } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface WelcomeTemplateProps {
  /** Marque (« blowy ») : le point jaune est ajouté. */
  brand: string;
  /** Puce à droite de la marque (« pas de swipe · pas de pub »). */
  tagline: string;
  title: TitleContent;
  /** Aperçu de conversation : le pet parle, la personne répond. */
  chat: readonly { from: 'pet' | 'me'; text: string }[];
  pet: PetLook;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}

/** Hauteur du bas d'écran de la maquette : bouton (56) + 4 + lien (48), puis 32 jusqu'au panneau. */
const ACTIONS = size.button.lg + space.xs + 48;
const PANEL_GAP = 32;
/** Positions de la maquette, mesurées depuis le bas du panneau jaune (V6-Welcome, panneau bas à 682). */
const CHAT_FROM_BOTTOM = [262, 188, 130] as const;
const CHAT_WIDTH = [230, 200, 236] as const;
const PET_FROM_BOTTOM = 326;
const PET_WIDTH = 380;

/** Écran d'accueil (V6-Welcome) : grand panneau jaune, promesse, aperçu de chat avec le pet, puis les deux actions. */
export function WelcomeTemplate({ brand, tagline, title, chat, pet, primaryLabel, onPrimary, secondaryLabel, onSecondary }: WelcomeTemplateProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const bottom = Math.max(insets.bottom, 22);
  const panelBottom = height - bottom - ACTIONS - PANEL_GAP;
  return (
    <View style={styles.root}>
      <View style={[styles.panel, { height: panelBottom - space.xs - 2 }]}>
        <LinearGradient colors={gradient.accent} style={StyleSheet.absoluteFill} />
        <View style={[styles.disc, styles.discLight]} />
        <View style={[styles.disc, styles.discDark, { top: 300 - 44 + insets.top }]} />
      </View>

      <InkProvider value={color.dark}>
        <View style={[layout.rowBetween, styles.top, { paddingTop: insets.top + 10 }]}>
          <View style={styles.brand}>
            <Text variant="bodyHeavy" size={26} color={color.white} style={styles.brandText}>
              {brand}
              <Text variant="bodyHeavy" size={26} color={color.accent}>
                .
              </Text>
            </Text>
          </View>
          <View style={styles.tagline}>
            <Text variant="bodyHeavy" size={12} style={styles.taglineText}>
              {tagline}
            </Text>
          </View>
        </View>
        <Title text={title} size={58} style={styles.title} />
      </InkProvider>

      <View pointerEvents="none" style={[styles.pet, { top: panelBottom - PET_FROM_BOTTOM }]}>
        <PetImage species={pet.species} mood="salut" size={PET_WIDTH} animation="breathe" style={shadow.lift} />
      </View>

      {chat.map((m, i) => (
        <View key={i} style={[styles.chat, { top: panelBottom - (CHAT_FROM_BOTTOM[i] ?? 0), width: CHAT_WIDTH[i] }]}>
          <MessageBubble
            message={{ author: m.from === 'pet' ? 'my_pet' : 'me', kind: 'text', body: m.text, mediaUrl: null }}
            pet={m.from === 'pet' ? pet : undefined}
            name={m.from === 'pet' ? pet.name : undefined}
            nameColor={color.dark}
            avatarBg={color.accent}
          />
        </View>
      ))}

      <View style={[styles.actions, { bottom }]}>
        <Button label={primaryLabel} onPress={onPrimary} iconRight="arrow" />
        <Pressable onPress={onSecondary} accessibilityLabel={secondaryLabel} style={styles.secondary}>
          <Text variant="bodyBold" size={15} color={color.mute}>
            {secondaryLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night },
  panel: { position: 'absolute', left: space.xs + 2, right: space.xs + 2, top: space.xs + 2, borderRadius: radius.xl + 4, overflow: 'hidden' },
  disc: { position: 'absolute', borderRadius: radius.pill },
  discLight: { width: 420, height: 420, right: -170, bottom: -150, backgroundColor: alpha(color.white, 0.28) },
  discDark: { width: 180, height: 180, left: -70, backgroundColor: alpha(color.dark, 0.06) },
  top: { paddingHorizontal: space.xl, zIndex: 2 },
  brand: { height: 42, paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: color.dark, justifyContent: 'center' },
  brandText: { lineHeight: 30, letterSpacing: -1.04 },
  tagline: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: alpha(color.dark, 0.1) },
  taglineText: { lineHeight: 16 },
  title: { marginTop: 22, marginHorizontal: space.xl, zIndex: 2 },
  pet: { position: 'absolute', right: -92, zIndex: 2, transform: [{ rotate: '-6deg' }] },
  chat: { position: 'absolute', left: space.lg, zIndex: 3 },
  actions: { position: 'absolute', left: 18, right: 18, gap: space.xs, zIndex: 4 },
  secondary: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
