import type { PetForm, Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { alpha, color } from '../theme';

export interface FormOption {
  form: PetForm;
  name: string;
  /** « plus de câlins ». */
  caption: string;
}

export interface FormGauge {
  /** Valeur actuelle (-100…100). */
  value: number;
  /** Seuil visé (repère rose). */
  target: number;
  low: string;
  high: string;
}

export interface FormPickerProps {
  /** « ce qu'il peut devenir ». */
  title: string;
  /** « touche pour voir ». */
  hint?: string;
  species: Species;
  options: readonly FormOption[];
  selected: PetForm;
  onSelect: (form: PetForm) => void;
  /** Explication de la forme choisie : « pour devenir tendre : » + comment + allure. */
  how: { title: string; text: string; look?: string };
  gauge?: FormGauge | null;
}

const pct = (v: number): number => 50 + Math.max(-100, Math.min(100, v)) / 2;

/** Les formes que le pet peut prendre (grille de 3), puis comment y arriver avec sa jauge. */
export function FormPicker({ title, hint, species, options, selected, onSelect, how, gauge }: FormPickerProps) {
  const x = gauge ? pct(gauge.value) : 50;
  const lead = gauge ? (gauge.value > 0 ? 'high' : gauge.value < 0 ? 'low' : null) : null;
  return (
    <View style={styles.wrap}>
      <View style={[layout.rowBetween, styles.head]}>
        <Text variant="bodyHeavy" size={11} style={styles.label}>
          {title}
        </Text>
        {hint ? (
          <Text variant="small" size={12} muted>
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={[layout.row, styles.grid]}>
        {options.map((o) => {
          const on = o.form === selected;
          return (
            <Pressable
              key={o.form}
              onPress={() => onSelect(o.form)}
              haptic="selection"
              scaleTo={0.96}
              accessibilityLabel={`${o.name}, ${o.caption}`}
              accessibilityState={{ selected: on }}
              style={[styles.cell, on && styles.cellOn]}
            >
              <PetImage species={species} form={o.form} size={88} style={styles.pet} />
              <Title text={o.name} size={20} center numberOfLines={1} />
              <Text variant="bodyBold" size={11} muted center numberOfLines={1}>
                {o.caption}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Card padding="none" style={styles.how}>
        <Text size={15} style={styles.howText}>
          <Text variant="bodyBold" size={15} style={styles.howText}>
            {how.title}
          </Text>
          {how.text}
          {how.look ? (
            <Text size={15} muted style={styles.howText}>
              {` ${how.look}`}
            </Text>
          ) : null}
        </Text>
        {gauge ? (
          <View style={[layout.row, styles.gaugeRow]}>
            <Text variant={lead === 'low' ? 'bodyHeavy' : 'body'} size={12} muted={lead !== 'low'} numberOfLines={1} style={styles.pole}>
              {gauge.low}
            </Text>
            <View style={styles.track}>
              <View style={styles.zero} />
              <View style={[styles.fill, { left: `${Math.min(50, x)}%`, right: `${100 - Math.max(50, x)}%` }]} />
              <View style={[styles.knob, { left: `${x}%` }]} />
              <View style={[styles.target, { left: `${pct(gauge.target)}%` }]} />
            </View>
            <Text variant={lead === 'high' ? 'bodyHeavy' : 'body'} size={12} muted={lead !== 'high'} numberOfLines={1} style={[styles.pole, styles.right]}>
              {gauge.high}
            </Text>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const KNOB = 18;

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  head: { paddingHorizontal: 4 },
  label: { letterSpacing: 1.32, textTransform: 'uppercase' },
  grid: { gap: 8, alignItems: 'stretch' },
  cell: {
    flex: 1,
    minHeight: 120,
    paddingTop: 2,
    paddingHorizontal: 6,
    paddingBottom: 8,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: alpha(color.white, 0.08),
    backgroundColor: color.panel,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cellOn: { borderColor: color.accent, backgroundColor: color.card },
  pet: { marginBottom: -2 },
  how: { padding: 14, gap: 8, borderRadius: 24 },
  howText: { lineHeight: 20 },
  gaugeRow: { gap: 8 },
  pole: { width: 52 },
  right: { textAlign: 'right' },
  track: { flex: 1, height: 10, borderRadius: 999, backgroundColor: alpha(color.white, 0.12) },
  zero: { position: 'absolute', left: '50%', top: -3, bottom: -3, width: 2, backgroundColor: alpha(color.white, 0.35) },
  fill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 999, backgroundColor: color.accent },
  knob: {
    position: 'absolute',
    top: (10 - KNOB) / 2,
    width: KNOB,
    height: KNOB,
    marginLeft: -KNOB / 2,
    borderRadius: KNOB / 2,
    backgroundColor: color.white,
    shadowColor: color.night,
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  target: { position: 'absolute', top: -3, width: 4, height: 16, marginLeft: -2, borderRadius: 2, backgroundColor: color.rose },
});
