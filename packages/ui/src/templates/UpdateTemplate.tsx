import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { EmptyState } from '../molecules/EmptyState';
import { space } from '../theme';
import type { TitleContent } from '../types';
import { ScreenTemplate } from './ScreenTemplate';

export interface UpdateTemplateProps {
  title: TitleContent;
  text: string;
  /** Ouvre la fiche de l'app dans le magasin. */
  actionLabel: string;
  onAction: () => void;
  /** Revenir après la mise à jour (ou si l'API sert de nouveau ce build). */
  retryLabel?: string;
  onRetry?: () => void;
  retrying?: boolean;
  species?: Species;
}

/**
 * Écran « Mets à jour Minimoa » (docs/VERSIONING.md) : l'API ne sert plus ce build. Plein écran, sans retour possible :
 * le minimoa passe la tête, une phrase, le bouton vers le magasin.
 */
export function UpdateTemplate({ title, text, actionLabel, onAction, retryLabel, onRetry, retrying, species }: UpdateTemplateProps) {
  return (
    <ScreenTemplate
      scroll={false}
      footer={
        <View style={styles.footer}>
          <Button label={actionLabel} onPress={onAction} />
          {retryLabel && onRetry ? <Button label={retryLabel} variant="ghost" onPress={onRetry} loading={retrying} /> : null}
        </View>
      }
    >
      <View style={styles.body}>
        <EmptyState peek species={species} mood="triste" title={title} text={text} />
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
  footer: { gap: space.sm },
});
