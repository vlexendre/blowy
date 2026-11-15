import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { TextField } from '../atoms/TextField';
import { DotNote } from '../molecules/DotNote';
import { layout } from '../lib/styles';
import { color, space } from '../theme';

export interface RenameCardProps {
  label: string;
  /** Aide sous le champ (longueur maximale). */
  hint?: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength?: number;
  /**
   * Changement impossible pour l'instant : champ en lecture seule, pas de bouton « garder ce nom »,
   * seulement `notice` et, s'il y en a une, `noticeAction` (Blowy+).
   */
  locked?: boolean;
  /** Ligne d'information avant de confirmer (quand ce sera possible, ou ce qu'implique ce changement). */
  notice?: string | null;
  noticeAction?: { label: string; onPress: () => void } | null;
  error?: string | null;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  canSave?: boolean;
}

/** Carte « changer son nom » : champ, rappel de la règle (une fois tous les 60 jours), boutons. */
export function RenameCard({
  label,
  hint,
  value,
  onChangeText,
  maxLength,
  locked = false,
  notice,
  noticeAction,
  error,
  cancelLabel,
  saveLabel,
  onCancel,
  onSave,
  saving,
  canSave = true,
}: RenameCardProps) {
  return (
    <Card padding="lg">
      <TextField
        label={label}
        hint={locked ? undefined : hint}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        editable={!locked}
        autoFocus={!locked}
        returnKeyType="done"
        onSubmitEditing={locked ? undefined : onSave}
        error={error}
      />
      {notice ? (
        <View style={styles.notice}>
          <DotNote text={notice} dot={locked ? color.mute : color.accent} />
        </View>
      ) : null}
      {noticeAction ? <Button label={noticeAction.label} variant="link" size="md" block={false} onPress={noticeAction.onPress} style={styles.link} /> : null}
      <View style={[layout.row, styles.row]}>
        <Button label={cancelLabel} variant="ghost" size="md" onPress={onCancel} style={layout.fill} />
        {locked ? null : <Button label={saveLabel} size="md" onPress={onSave} loading={saving} disabled={!canSave} style={layout.fill} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  notice: { marginTop: space.sm },
  link: { alignSelf: 'flex-start' },
  row: { flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
});
