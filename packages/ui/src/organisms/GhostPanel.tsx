import { MAX_LIVES } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Banner } from '../molecules/Banner';
import { Hearts } from '../molecules/Hearts';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, extra, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface GhostPanelProps {
  /** Ton pet, en version fantôme. */
  pet: PetLook;
  /** « TU L'AS / GHOSTÉ. » */
  title: TitleContent;
  text?: string;
  /** Ce que dit ton pet, et le nom au-dessus (« nino, version fantôme »). */
  speech?: string;
  speakerLabel?: string;
  /** Le lien peut encore être ranimé (une seule fois). */
  canRevive: boolean;
  reviveLabel: string;
  /** Complément estompé (« (une seule fois) »). */
  reviveHint?: string;
  /** Affiché quand le lien a déjà été ranimé (« déjà ranimé une fois »). */
  alreadyRevivedLabel: string;
  leaveLabel?: string;
  onRevive?: () => void;
  onLeave?: () => void;
  reviving?: boolean;
  leaving?: boolean;
  /** Erreur de la dernière action (ranimer, partir). */
  error?: string | null;
  /** Retour aux chats (en-tête de l'écran). */
  onBack?: () => void;
  backLabel?: string;
  /** Puce de l'en-tête (« Tom · lien fantôme »). */
  badge?: string;
  /** Libellé lu des cœurs (« 0 vie sur 7 »). */
  livesLabel?: string;
}

/**
 * Lien fantôme en plein écran (V6-Fantome) : fond lie-de-vin, grand titre, ton pet transparent qui parle,
 * ranimer (une fois) ou laisser partir.
 */
export function GhostPanel({
  pet,
  title,
  text,
  speech,
  speakerLabel,
  canRevive,
  reviveLabel,
  reviveHint,
  alreadyRevivedLabel,
  leaveLabel,
  onRevive,
  onLeave,
  reviving,
  leaving,
  error,
  onBack,
  backLabel = 'Retour',
  badge,
  livesLabel,
}: GhostPanelProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 26) }]}>
      <LinearGradient colors={extra.ghost} style={StyleSheet.absoluteFill} />
      <InkProvider value={color.white}>
        <View style={[layout.row, styles.head]}>
          {onBack ? <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} style={styles.back} /> : null}
          {badge ? <Chip label={badge} tone="glass" /> : null}
          <Hearts lives={0} max={MAX_LIVES} ghost size={14} accessibilityLabel={livesLabel} style={styles.hearts} />
        </View>
        <Title text={title} size={76} style={styles.title} />
        {text ? (
          <Text variant="bodyBold" size={16} style={styles.text}>
            {text}
          </Text>
        ) : null}
        <View style={styles.stage}>
          <PetImage species={pet.species} mood="fantome" size={290} animation="bob" style={styles.ghost} />
          {speech ? (
            <View style={[layout.row, styles.speech]}>
              <View style={styles.avatar}>
                <Avatar size={30} pet={pet} hidden pose="fantome" bg={extra.ghostDisc} />
              </View>
              <View style={layout.shrink}>
                {speakerLabel ? (
                  <Text variant="bodyHeavy" size={11} color={extra.ghostInk} style={styles.who}>
                    {speakerLabel}
                  </Text>
                ) : null}
                <View style={styles.bubble}>
                  <Text variant="body" size={14} style={styles.bubbleText}>
                    {speech}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.actions}>
          {error ? <Banner tone="error" text={error} /> : null}
          {canRevive ? (
            <Button label={reviveLabel} hint={reviveHint} variant="white" onPress={onRevive} loading={reviving} />
          ) : (
            <Chip label={alreadyRevivedLabel} tone="glass" size="lg" style={styles.done} />
          )}
          {leaveLabel && onLeave ? <Button label={leaveLabel} variant="ghost" onPress={onLeave} loading={leaving} /> : null}
        </View>
      </InkProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 640, paddingHorizontal: 18 },
  head: { gap: 10 },
  back: { backgroundColor: veil.track },
  hearts: { marginLeft: 'auto' },
  title: { marginTop: 22 },
  text: { marginTop: 10, maxWidth: 300 },
  // Scène de 270 : le fantôme (290, 18 sous le haut) et sa bulle en haut à gauche.
  stage: { height: 270, marginTop: 2, alignItems: 'center' },
  // Le rendu du fantôme a plus de marge haute que celui de la maquette : on le remonte pour caler le pelage.
  ghost: { marginTop: -24, opacity: 0.92 },
  speech: { position: 'absolute', left: 0, top: 4, maxWidth: 210, gap: space.sm, alignItems: 'flex-end' },
  avatar: { alignSelf: 'flex-end' },
  who: { marginLeft: space.xs, marginBottom: 3 },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: veil.glass,
  },
  bubbleText: { lineHeight: 18 },
  actions: { marginTop: 'auto', gap: 10 },
  done: { alignSelf: 'stretch', justifyContent: 'center' },
});
