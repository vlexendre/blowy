import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { PopIn } from '../motion/PopIn';
import { useRipple, useRippleAnchor } from '../motion/Ripple';
import { color, speciesColor } from '../theme';
import { EncounterFrame, EncounterHead, EncounterOpen } from './EncounterParts';
import type { SuggestionLook } from '../types';
import { useUiStrings } from '../lib/strings';

export interface SuggestionCardProps {
  /** La rencontre (objet `Suggestion` du contrat accepté tel quel). */
  suggestion: SuggestionLook;
  /** « le pet de Sasha ». */
  ownerLabel: string;
  /** Puce à côté du nom (« nouveau »). */
  badgeLabel?: string;
  /** Sous le pourcentage (« d'accord »). */
  compatLabel: string;
  waveLabel: string;
  wavedLabel: string;
  onWave?: () => void;
  waving?: boolean;
  /** Plus de coucou possible pour l'instant (plafond du jour, coucous en attente) : bouton désactivé. */
  waveDisabled?: boolean;
  /** Version verrouillée (Minimoa+) : petite tuile floue. */
  locked?: boolean;
  /** Légende de la tuile verrouillée (« par la bande du 11e »). */
  lockedCaption?: string;
  onLockedPress?: () => void;
  /** Toucher la carte ouvre le détail de la rencontre (ce qu'ils se sont dit, le pourquoi axe par axe). */
  openLabel?: string;
  onOpen?: () => void;
  /** Pourquoi ton minimoa la présente (`MatchWhy`), sous l'en-tête : le pourcentage n'est jamais seul. */
  why?: ReactNode;
}

/** Un pet croisé : compatibilité, d'où il vient, ce que ton pet en dit, et « saluer ». */
export function SuggestionCard(props: SuggestionCardProps) {
  const uiStrings = useUiStrings();
  const { compatibility, user } = props.suggestion;
  const pet = user.pet;

  if (props.locked) {
    return (
      <Card onPress={props.onLockedPress} accessibilityLabel={`${uiStrings.closeness(compatibility)}, ${props.lockedCaption ?? ''}`} padding="none" style={[layout.fill, styles.locked]}>
        <View style={[layout.row, styles.lockedRow]}>
          <Avatar size={40} pet={pet} hidden blurred />
          <Title text={uiStrings.closeness(compatibility)} size={28} style={layout.grow} />
          <LinearGradient colors={[color.violet, color.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.lock}>
            <Glyph name="lock" size={13} color={color.white} />
          </LinearGradient>
        </View>
        {props.lockedCaption ? (
          <Text variant="small" size={12} muted numberOfLines={2} style={styles.lockedCaption}>
            {props.lockedCaption}
          </Text>
        ) : null}
      </Card>
    );
  }

  return <SuggestionBody {...props} />;
}

/**
 * Carte d'une rencontre, courte : qui, pourquoi (avec le chiffre, jamais seul) et « saluer ». Le reste (d'où il vient,
 * ce que ton minimoa en raconte, chaque axe) est sur l'écran de la rencontre, en touchant le haut de la carte.
 * « Saluer » lance l'action, puis l'onde autour du bouton et le coucou de l'avatar (rien n'attend).
 */
function SuggestionBody(props: SuggestionCardProps) {
  const { suggestion, ownerLabel, badgeLabel, compatLabel, waveLabel, wavedLabel, onWave, waving, waveDisabled, openLabel, onOpen, why } = props;
  const { user, compatibility, waved } = suggestion;
  const pet = user.pet;
  const tint = speciesColor[pet.species];
  const button = useRippleAnchor();
  const ripple = useRipple();
  const [waves, setWaves] = useState(0);
  const wave = () => {
    onWave?.();
    ripple(button.target(), { color: color.white });
    setWaves((n) => n + 1);
  };
  return (
    <EncounterFrame tint={tint}>
      <EncounterOpen onPress={onOpen} accessibilityLabel={openLabel ? `${openLabel}, ${pet.name}, ${ownerLabel}` : undefined}>
      <EncounterHead
        person={user}
        name={pet.name}
        badge={
          waved ? (
            <PopIn onMount={waves > 0}>
              <Chip label={wavedLabel} tone="glass" size="sm" />
            </PopIn>
          ) : badgeLabel ? (
            <Chip label={badgeLabel} tone="accent" size="sm" style={styles.badge} />
          ) : null
        }
        waveKey={waves}
        owner={ownerLabel}
        // Le chiffre, en petit à droite, et seulement avec son pourquoi juste en dessous.
        compatibility={why ? compatibility : null}
        compatLabel={compatLabel}
      />
      {why}
      </EncounterOpen>
      {waved ? null : (
        <View {...button.props}>
          <Button label={waveLabel} variant="white" size="md" labelSize={15} onPress={wave} loading={waving} disabled={waveDisabled} style={styles.cta} />
        </View>
      )}
    </EncounterFrame>
  );
}

const styles = StyleSheet.create({
  badge: { height: 22, paddingHorizontal: 9 },
  cta: { height: 44 },
  locked: { gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 24, minHeight: 44 },
  lockedRow: { gap: 8 },
  lockedCaption: { lineHeight: 15 },
  lock: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
