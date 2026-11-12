import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { hasOutfit } from '../assets/fit';
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
import { alpha, color, speciesColor } from '../theme';
import { EncounterFrame, EncounterHead, lighten, PetSays } from './EncounterParts';
import type { PetLook, SuggestionLook } from '../types';

export interface SuggestionCardProps {
  /** La rencontre (objet `Suggestion` du contrat accepté tel quel). */
  suggestion: SuggestionLook;
  /** « le pet de Sasha ». */
  ownerLabel: string;
  /** Comment ton pet l'a croisé (« par Malo, pote de pote »). */
  viaLabel?: string;
  /** Pet de l'intermédiaire (petit visage dans la puce « via »). */
  viaPet?: PetLook;
  /** Puce à côté du nom (« nouveau »). */
  badgeLabel?: string;
  /** Sous le pourcentage (« d'accord »). */
  compatLabel: string;
  /** Résumé du duo (« deux joueurs, une piquante »). */
  tagline?: string;
  /** Au-dessus de la bulle (« pia, à nino »). */
  introLabel?: string;
  waveLabel: string;
  wavedLabel: string;
  onWave?: () => void;
  waving?: boolean;
  /** Version verrouillée (Blowy+) : petite tuile floue. */
  locked?: boolean;
  /** Légende de la tuile verrouillée (« par la bande du 11e »). */
  lockedCaption?: string;
  onLockedPress?: () => void;
  /** Bouton secondaire vers le détail de la rencontre (« voir de plus près »). */
  openLabel?: string;
  onOpen?: () => void;
}

/** Un pet croisé : compatibilité, d'où il vient, ce que ton pet en dit, et « saluer ». */
export function SuggestionCard(props: SuggestionCardProps) {
  const { compatibility, user } = props.suggestion;
  const pet = user.pet;

  if (props.locked) {
    return (
      <Card onPress={props.onLockedPress} accessibilityLabel={`${compatibility} %, ${props.lockedCaption ?? ''}`} padding="none" style={[layout.fill, styles.locked]}>
        <View style={[layout.row, styles.lockedRow]}>
          <Avatar size={40} pet={pet} hidden blurred />
          <Title text={`${compatibility} %`} size={28} style={layout.grow} />
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

/** Carte dépliée : « saluer » lance l'action, puis l'onde autour du bouton et le coucou de l'avatar (rien n'attend). */
function SuggestionBody(props: SuggestionCardProps) {
  const { suggestion, ownerLabel, viaLabel, viaPet, badgeLabel, compatLabel, tagline, introLabel, waveLabel, wavedLabel, onWave, waving, openLabel, onOpen } = props;
  const { user, compatibility, intro, waved } = suggestion;
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
  const viaTint = viaPet ? speciesColor[viaPet.species] : null;
  return (
    <EncounterFrame tint={tint}>
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
        compatibility={compatibility}
        compatLabel={compatLabel}
      />
      {viaLabel || tagline ? (
        <View style={[layout.row, styles.chips]}>
          {viaLabel ? (
            <Chip
              label={viaLabel}
              tone="glass"
              ink={viaTint ? lighten(viaTint, 0.4) : undefined}
              left={viaPet ? <Avatar size={16} pet={viaPet} hidden /> : undefined}
              style={[styles.chip, viaTint ? { backgroundColor: alpha(viaTint, 0.18) } : null]}
            />
          ) : null}
          {tagline ? <Chip label={tagline} tone="glass" style={styles.chip} /> : null}
        </View>
      ) : null}
      {intro ? <PetSays label={introLabel} labelColor={lighten(tint, 0.3)} text={intro} /> : null}
      {openLabel && onOpen ? (
        <Button label={openLabel} variant="white" size="md" labelSize={15} onPress={onOpen} style={styles.cta} />
      ) : waved ? null : (
        <View {...button.props}>
          <Button label={waveLabel} variant="white" size="md" labelSize={15} onPress={wave} loading={waving} style={styles.cta} />
        </View>
      )}
    </EncounterFrame>
  );
}

const styles = StyleSheet.create({
  badge: { height: 22, paddingHorizontal: 9 },
  chips: { gap: 6, flexWrap: 'wrap' },
  chip: { height: 26, paddingHorizontal: 11 },
  cta: { height: 44 },
  locked: { gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 24, minHeight: 44 },
  lockedRow: { gap: 8 },
  lockedCaption: { lineHeight: 15 },
  lock: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
