import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { color, radius, space, speciesColor, veil } from '../theme';
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
  const { suggestion, ownerLabel, viaLabel, viaPet, badgeLabel, compatLabel, tagline, introLabel, waveLabel, wavedLabel, onWave, waving, openLabel, onOpen } = props;
  const { user, compatibility, intro, waved } = suggestion;
  const pet = user.pet;
  const tint = speciesColor[pet.species];

  if (props.locked) {
    return (
      <Card onPress={props.onLockedPress} accessibilityLabel={`${compatibility} %, ${props.lockedCaption ?? ''}`} padding="md" style={[layout.fill, layout.gapSm]}>
        <View style={layout.rowBetween}>
          <Avatar size={44} pet={pet} hidden blurred style={styles.blur} />
          <Title text={`${compatibility} %`} size={30} />
          <View style={styles.lock}>
            <Glyph name="lock" size={16} color={color.white} />
          </View>
        </View>
        {props.lockedCaption ? (
          <Text variant="small" muted numberOfLines={2}>
            {props.lockedCaption}
          </Text>
        ) : null}
      </Card>
    );
  }

  return (
    <Card padding="lg" highlight={tint} style={[layout.gapMd, { backgroundColor: color.panel }]}>
      <View style={[layout.rowTop, layout.gapMd]}>
        <View style={[styles.portrait, { borderColor: tint }]}>
          <PetImage species={pet.species} mood="salut" size={64} animation="bob" />
        </View>
        <View style={[layout.grow, styles.who]}>
          <View style={[layout.row, layout.gapSm]}>
            <Title text={pet.name} size={30} numberOfLines={1} style={layout.shrink} />
            {badgeLabel ? <Chip label={badgeLabel} tone="accent" size="sm" /> : null}
          </View>
          <Text variant="small" muted>
            {ownerLabel}
          </Text>
        </View>
        <View style={styles.compat}>
          <Title text={`${compatibility} %`} size={40} color={color.accent} />
          <Text variant="label" size={9} muted>
            {compatLabel}
          </Text>
        </View>
      </View>
      <View style={layout.wrap}>
        {viaLabel ? <Chip label={viaLabel} tone="glass" left={viaPet ? <Avatar size={18} pet={viaPet} hidden /> : undefined} /> : null}
        {tagline ? <Chip label={tagline} tone="glass" /> : null}
      </View>
      <View style={layout.gapXs}>
        {introLabel ? (
          <Text variant="bodyBold" size={11} color={tint}>
            {introLabel}
          </Text>
        ) : null}
        <View style={styles.intro}>
          <Text variant="body" size={15}>
            {intro}
          </Text>
        </View>
      </View>
      {openLabel && onOpen ? <Button label={openLabel} variant="ghost" size="sm" iconRight="chevron" onPress={onOpen} style={styles.open} /> : null}
      {waved ? (
        <Button label={wavedLabel} variant="ghost" icon="check" disabled />
      ) : (
        <Button label={waveLabel} variant="white" onPress={onWave} loading={waving} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  portrait: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: color.card },
  who: { paddingTop: space.xs, gap: 2 },
  compat: { alignItems: 'flex-end' },
  intro: { padding: space.md, borderRadius: radius.md, borderBottomLeftRadius: space.xs + 2, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
  blur: { opacity: 0.6 },
  open: { alignSelf: 'flex-start' },
  lock: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: color.violet },
});
