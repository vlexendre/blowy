import type { PetForm, Species } from '@blowy/domain';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { alpha, color } from '../theme';

export interface EvolutionStep {
  form: PetForm;
  /** Puce de date (« septembre », « aujourd'hui »). */
  when: string;
  /** Nom de la forme (« casanier »). */
  name: string;
  /** Légende (« que du canapé. »). */
  caption?: string;
  /** Étape actuelle : puce blanche, pet plus grand qui respire. */
  current?: boolean;
}

export interface EvolutionTimelineProps {
  species: Species;
  /** Étapes de la plus ancienne à l'actuelle (3 au plus). */
  steps: readonly EvolutionStep[];
}

/** Les formes successives du pet, reliées par des chevrons (panneau de l'écran Évolution). */
export function EvolutionTimeline({ species, steps }: EvolutionTimelineProps) {
  return (
    <View style={styles.row} accessibilityRole="list">
      {steps.map((s, i) => (
        <Fragment key={`${s.form}-${i}`}>
          {i > 0 ? <Glyph name="chevron" size={14} color={color.white} style={styles.arrow} /> : null}
          <View accessible accessibilityLabel={`${s.when}, ${s.name}${s.caption ? `, ${s.caption}` : ''}`} style={styles.step}>
            <View style={styles.art}>
              <PetImage species={species} form={s.form} size={s.current ? 112 : 98} animation={s.current ? 'breathe' : 'none'} style={styles.pet} />
            </View>
            <View style={[styles.when, s.current && styles.whenNow]}>
              <Text variant="bodyHeavy" size={12} color={s.current ? color.dark : color.white} numberOfLines={1}>
                {s.when}
              </Text>
            </View>
            <Title text={s.name} size={20} center numberOfLines={1} style={styles.name} />
            {s.caption ? (
              <Text variant="small" size={12} center style={styles.caption} numberOfLines={2}>
                {s.caption}
              </Text>
            ) : null}
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 10 },
  step: { flex: 1, minWidth: 0, alignItems: 'center' },
  art: { height: 92, justifyContent: 'flex-end', alignItems: 'center' },
  pet: { marginBottom: -10, shadowColor: color.night, shadowOpacity: 0.45, shadowRadius: 9, shadowOffset: { width: 0, height: 14 } },
  arrow: { marginTop: 56, opacity: 0.7 },
  when: { marginTop: 4, height: 26, paddingHorizontal: 11, borderRadius: 999, justifyContent: 'center', backgroundColor: alpha(color.white, 0.16) },
  whenNow: { backgroundColor: color.white },
  name: { marginTop: 6 },
  caption: { marginTop: 3, lineHeight: 15, opacity: 0.85 },
});
