import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { color, onGradient, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface ConsentFact {
  key: string;
  glyph: GlyphName;
  /** « Ce qui part », « À qui »… (court, en gras). */
  label: string;
  text: string;
}

export interface ConsentFactsProps {
  /** « TA PREUVE, / VUE PAR UNE IA ? ». */
  title: TitleContent;
  /** Une phrase sous le titre, dans le panneau. */
  subtitle?: string;
  /** Le minimoa de la personne, qui passe la tête dans le panneau. */
  pet?: Pick<PetLook, 'species'>;
  /** Ce que la personne doit savoir avant d'accepter : quoi, à qui, pourquoi, combien de temps, et sans. */
  facts: readonly ConsentFact[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Accord avant de partager une donnée avec un tiers (App Review 5.1.2(i)) : panneau violet avec le titre et le minimoa,
 * puis une ligne par fait (pictogramme, intitulé, phrase). Les choix vont dans le pied de la feuille (`SheetTemplate`).
 */
export function ConsentFacts({ title, subtitle, pet, facts, style }: ConsentFactsProps) {
  const ink = onGradient.violet;
  return (
    <View style={[styles.root, style]}>
      <Panel gradient="violet" radius="lg" padding="none" overflow={false} style={styles.panel}>
        <View style={styles.copy}>
          <Title text={title} size={30} color={ink} />
          {subtitle ? (
            <Text variant="bodyBold" size={15} color={ink} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {pet ? (
          <View style={styles.pet} pointerEvents="none">
            <Appear from="below" distance={40} delay={120} duration={320}>
              <PetImage species={pet.species} mood="surpris" size={76} outline animation="breathe" />
            </Appear>
          </View>
        ) : null}
      </Panel>
      <View style={styles.box}>
        {facts.map((f, i) => (
          <View
            key={f.key}
            style={[layout.rowTop, styles.fact, i > 0 && styles.divider]}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${f.label}. ${f.text}`}
          >
            <View style={styles.glyph}>
              <Glyph name={f.glyph} size={16} color={color.accent} />
            </View>
            <View style={[layout.shrink, styles.factCopy]}>
              <Text variant="bodyHeavy" size={15}>
                {f.label}
              </Text>
              <Text size={15} muted style={styles.factText}>
                {f.text}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  panel: { minHeight: 120, overflow: 'hidden' },
  copy: { padding: space.md, paddingLeft: space.lg, paddingRight: 96, gap: space.xs },
  subtitle: { lineHeight: 19 },
  pet: { position: 'absolute', right: 8, bottom: -8 },
  box: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: 22, backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass },
  fact: { gap: space.sm, paddingVertical: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: veil.hairline },
  glyph: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: veil.glass, marginTop: 1 },
  factCopy: { gap: 2 },
  factText: { lineHeight: 20 },
});
