import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { space, veil } from '../theme';
import type { TitleContent } from '../types';
import { ScreenTemplate } from './ScreenTemplate';

const GUTTER = 14;

export interface SettingsTemplateProps {
  /** Grand titre Anton à côté du retour (« RÉGLAGES », « MON COMPTE. »). */
  title: TitleContent;
  onBack: () => void;
  backLabel: string;
  children?: ReactNode;
  /** Boutons collés en bas (enregistrer, supprimer). */
  footer?: ReactNode;
  /** Espace entre les blocs. Défaut 10 (`.wrap`). */
  gap?: number;
  /** Phrase d'explication sous le titre. */
  intro?: string;
  /** Petite mention centrée tout en bas (« blowy 1.0.0 »). */
  note?: string;
}

/** Sous-écran de Moi (réglages, compte, notifications, bloqués, supprimer) : retour rond + grand titre, blocs serrés. */
export function SettingsTemplate({ title, onBack, backLabel, children, footer, gap = 10, intro, note }: SettingsTemplateProps) {
  return (
    <ScreenTemplate
      padded={false}
      header={
        <View style={styles.head}>
          <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} style={styles.back} />
          <View style={styles.title}>
            <Title text={title} size={44} numberOfLines={1} />
          </View>
        </View>
      }
      footer={footer ? <View style={styles.footer}>{footer}</View> : undefined}
      contentStyle={[styles.body, { gap }]}
    >
      {intro ? (
        <Text variant="small" size={14} muted style={styles.intro}>
          {intro}
        </Text>
      ) : null}
      {children}
      {note ? (
        <Text variant="small" size={12} muted center style={styles.note}>
          {note}
        </Text>
      ) : null}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  // ScreenTemplate ajoute 4 au-dessus et 8 en dessous : on retombe sur `padding: 6px 0 4px` + 10 d'écart.
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: GUTTER, paddingTop: 2, paddingBottom: 6 },
  back: { backgroundColor: veil.track },
  title: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: GUTTER },
  footer: { paddingHorizontal: GUTTER, gap: space.sm },
  intro: { paddingHorizontal: space.xs + 2 },
  note: { marginTop: 'auto', paddingTop: space.lg },
});
