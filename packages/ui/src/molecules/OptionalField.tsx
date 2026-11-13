import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Appear } from '../motion/Appear';

export interface OptionalFieldProps {
  /** Lien centré qui ouvre le champ (« j'ai un code d'invitation »). */
  toggleLabel: string;
  open: boolean;
  onOpen: () => void;
  /** Le champ, montré une fois ouvert. */
  children: ReactNode;
}

/** Un champ facultatif replié derrière un petit lien centré ; ouvert, le champ arrive en fondu (et garde le focus). */
export function OptionalField({ toggleLabel, open, onOpen, children }: OptionalFieldProps) {
  if (open) return <Appear distance={8}>{children}</Appear>;
  return (
    <View style={styles.center}>
      <Button label={toggleLabel} variant="link" size="sm" onPress={onOpen} style={styles.toggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  toggle: { alignSelf: 'center' },
});
