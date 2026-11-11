import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { IconButton } from '../atoms/IconButton';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { StepProgress } from '../molecules/StepProgress';
import { layout } from '../lib/styles';
import { color, size, space } from '../theme';
import type { TitleContent } from '../types';
import { ScreenTemplate } from './ScreenTemplate';

export interface OnboardingTemplateProps {
  /** Étape courante (à partir de 1) et nombre d'étapes ; sans eux, pas de barre d'avancement. */
  step?: number;
  total?: number;
  onBack?: () => void;
  backLabel?: string;
  /** Petite ligne jaune au-dessus du titre. */
  kicker?: string;
  /** Titre Anton avec sa partie estompée (« TON PET, / TON VIBE »). */
  title?: TitleContent;
  text?: string;
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
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

/** Gabarit d'inscription : avancement, titre à partie estompée, contenu, bouton principal et action secondaire. */
export function OnboardingTemplate({
  step,
  total,
  onBack,
  backLabel = 'Retour',
  kicker,
  title,
  text,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  primaryIcon = 'arrow',
  secondaryLabel,
  onSecondary,
  footnote,
  scroll = true,
}: OnboardingTemplateProps) {
  const header =
    onBack || (step && total) ? (
      <View style={[layout.row, layout.gapMd, styles.header]}>
        {onBack ? <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} /> : null}
        {step && total ? <StepProgress step={step} total={total} style={layout.grow} /> : null}
      </View>
    ) : undefined;
  const footer = (
    <>
      <Button label={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} loading={primaryLoading} iconRight={primaryIcon ?? undefined} />
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
  return (
    <ScreenTemplate header={header} footer={footer} scroll={scroll}>
      <View style={[layout.gapLg, styles.body]}>
        {kicker || title || text ? (
          <View style={layout.gapSm}>
            {kicker ? (
              <Text variant="label" color={color.accent}>
                {kicker}
              </Text>
            ) : null}
            {title ? <Title text={title} size={56} /> : null}
            {text ? <Text muted>{text}</Text> : null}
          </View>
        ) : null}
        {children}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 52 },
  body: { flexGrow: 1, paddingTop: space.md },
  secondary: { minHeight: size.touch, alignItems: 'center', justifyContent: 'center' },
});
