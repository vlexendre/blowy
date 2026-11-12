import type { PetForm, Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { Card } from '../atoms/Card';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { useAnimatedNumber } from '../lib/motion';
import { PillSpan } from '../motion/PillSpan';
import { alpha, color, motion } from '../theme';

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

/** Jauge de la forme choisie : remplissage depuis le centre et curseur qui glissent avec un léger dépassement. */
function FormGaugeTrack({ value, target }: { value: number; target: number }) {
  const x = useAnimatedNumber(pct(value), { duration: motion.slow, overshoot: 0.12, from: 50 });
  const t = useAnimatedNumber(pct(target), { duration: motion.slow, overshoot: 0.1 });
  const w = useSharedValue(0);
  const center = useDerivedValue(() => w.value / 2);
  const end = useDerivedValue(() => (Math.max(0, Math.min(100, x.value)) / 100) * w.value);
  const knob = useAnimatedStyle(() => ({ opacity: w.value > 0 ? 1 : 0, transform: [{ translateX: end.value }] }));
  const mark = useAnimatedStyle(() => ({ opacity: w.value > 0 ? 1 : 0, transform: [{ translateX: (t.value / 100) * w.value }] }));
  return (
    <View
      style={styles.track}
      onLayout={(e) => {
        w.value = e.nativeEvent.layout.width;
      }}
    >
      <View style={styles.zero} />
      <PillSpan from={center} to={end} height={10} color={color.accent} span={400} />
      <Animated.View style={[styles.knob, knob]} />
      <Animated.View style={[styles.target, mark]} />
    </View>
  );
}

/** Les formes que le pet peut prendre (grille de 3), puis comment y arriver avec sa jauge. */
export function FormPicker({ title, hint, species, options, selected, onSelect, how, gauge }: FormPickerProps) {
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
              bounceKey={on}
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
            <FormGaugeTrack value={gauge.value} target={gauge.target} />
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
  knob: {
    position: 'absolute',
    left: 0,
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
  target: { position: 'absolute', left: 0, top: -3, width: 4, height: 16, marginLeft: -2, borderRadius: 2, backgroundColor: color.rose },
});
