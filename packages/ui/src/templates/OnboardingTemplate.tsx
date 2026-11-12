import type { Species } from '@blowy/domain';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { PetPose } from '../assets/pets';
import { Button } from '../atoms/Button';
import { IconButton } from '../atoms/IconButton';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { StepProgress } from '../molecules/StepProgress';
import { layout } from '../lib/styles';
import { color, radius, space } from '../theme';
import type { TitleContent } from '../types';
import { ScreenTemplate } from './ScreenTemplate';

export interface OnboardingTemplateProps {
  /** Étape courante (à partir de 1) et nombre d'étapes ; sans eux, pas de barre d'avancement. */
  step?: number;
  total?: number;
  /** L'étape courante est en cours (segment jaune à 45 %), comme le quiz de V6-Caractere. */
  stepPending?: boolean;
  /** Barre d'avancement continue sans compteur (V6-Profil), de 0 à 1 ; remplace `step` / `total`. */
  progress?: number;
  onBack?: () => void;
  backLabel?: string;
  /** Petite ligne jaune au-dessus du titre (`.lbl` jaune). */
  kicker?: string;
  /** Titre Anton avec sa partie estompée (« TON PET, / TON VIBE »). */
  title?: TitleContent;
  /** Corps du titre. Défaut 60 (V6-Craft). */
  titleSize?: number;
  /** Petit pet posé à droite du titre, aligné en bas (V6-Profil : de côté, 120 pt). */
  titlePet?: { species: Species; pose?: PetPose };
  text?: string;
  children?: ReactNode;
  /** Espace entre les blocs du contenu. Défaut 18 (10 si `dense`). */
  gap?: number;
  /** Mise en page serrée de V6-Profil : marges de 14, 10 entre chaque bloc, titre sans retrait. */
  dense?: boolean;
  /** Bouton principal ; sans lui, pas de pied (ou `actions`). */
  primaryLabel?: string;
  onPrimary?: () => void;
  /** Pied libre à la place du bouton principal (ex. « refaire » + « continuer »). */
  actions?: ReactNode;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Pictogramme à droite du bouton principal. Défaut `arrow`. */
  primaryIcon?: 'arrow' | null;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Mention légale sous les boutons. */
  footnote?: ReactNode;
  scroll?: boolean;
}

/** Marges des écrans d'inscription (maquettes : `padding: 6px 18px 22px`). */
const GUTTER = 18;

/** Gabarit d'inscription : avancement, titre à partie estompée, contenu, bouton principal et action secondaire. */
export function OnboardingTemplate({
  step,
  total,
  stepPending,
  progress,
  onBack,
  backLabel = 'Retour',
  kicker,
  title,
  titleSize = 60,
  titlePet,
  text,
  children,
  gap,
  dense,
  primaryLabel,
  onPrimary,
  actions,
  primaryDisabled,
  primaryLoading,
  primaryIcon = 'arrow',
  secondaryLabel,
  onSecondary,
  footnote,
  scroll = true,
}: OnboardingTemplateProps) {
  const header =
    onBack || (step && total) || progress !== undefined ? (
      <View style={[layout.row, styles.header]}>
        {onBack ? <IconButton glyph="back" variant="back" label={backLabel} onPress={onBack} size={40} /> : null}
        {progress !== undefined ? (
          <ProgressLine value={progress} />
        ) : step && total ? (
          <StepProgress step={step} total={total} pending={stepPending} style={layout.grow} />
        ) : null}
      </View>
    ) : undefined;
  const footer = actions ?? (
    <>
      {primaryLabel && onPrimary ? (
        <Button label={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} loading={primaryLoading} iconRight={primaryIcon ?? undefined} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Pressable onPress={onSecondary} accessibilityLabel={secondaryLabel} style={styles.secondary}>
          <Text variant="bodyBold" size={15} color={color.mute}>
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
      {footnote}
    </>
  );
  const heading =
    kicker || title || text ? (
      <View style={[styles.heading, dense && styles.headingDense]}>
        {kicker ? (
          <Text variant="label" size={11} color={color.accent} style={styles.kicker}>
            {kicker}
          </Text>
        ) : null}
        {title ? (
          <View style={[layout.row, styles.titleRow]}>
            <Title text={title} size={titleSize} style={[layout.grow, kicker ? styles.titleAfterKicker : null]} />
            {titlePet ? <PetImage species={titlePet.species} mood={titlePet.pose ?? 'cote'} size={120} style={styles.titlePet} /> : null}
          </View>
        ) : null}
        {text ? (
          <Text muted size={14} style={styles.text}>
            {text}
          </Text>
        ) : null}
      </View>
    ) : null;
  return (
    <ScreenTemplate header={header} headerStyle={styles.headerBox} footer={actions || primaryLabel ? footer : undefined} scroll={scroll} gutter={dense ? 14 : GUTTER}>
      {heading}
      <View style={[styles.body, { gap: gap ?? (dense ? 10 : 18), marginTop: dense ? 10 : 14 }]}>{children}</View>
    </ScreenTemplate>
  );
}

/** Barre d'avancement continue (V6-Profil : 6 pt, piste `card`, remplissage jaune). */
function ProgressLine({ value }: { value: number }) {
  const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={[layout.grow, styles.line]}>
      <View style={[styles.lineFill, { width: pct }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 6, borderRadius: radius.pill, backgroundColor: color.card },
  lineFill: { height: '100%', borderRadius: radius.pill, backgroundColor: color.accent },
  headerBox: { paddingTop: 6, paddingBottom: 0 },
  header: { gap: space.md, minHeight: 40 },
  heading: { paddingTop: space.lg, paddingHorizontal: space.xs },
  headingDense: { paddingTop: 10, paddingHorizontal: 0 },
  kicker: { letterSpacing: 1.32 },
  titleRow: { alignItems: 'flex-end', gap: space.xs },
  titlePet: { marginRight: -8, marginBottom: -12 },
  titleAfterKicker: { marginTop: 6 },
  text: { marginTop: 10 },
  body: { flexGrow: 1 },
  secondary: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
