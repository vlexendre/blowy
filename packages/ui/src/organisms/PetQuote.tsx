import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { MessageBubble } from '../molecules/MessageBubble';
import type { PetLook } from '../types';

export interface PetQuoteProps {
  pet: PetLook;
  /** Ce que dit le pet. */
  text: string;
  /** Petite ligne grise sous la bulle. */
  note?: string;
}

/** Le pet commente (bulle du chat avec son visage), suivi d'une note ; posé en bas de l'écran. */
export function PetQuote({ pet, text, note }: PetQuoteProps) {
  return (
    <View style={styles.wrap}>
      <MessageBubble message={{ author: 'my_pet', kind: 'text', body: text, mediaUrl: null }} name={pet.name.toLowerCase()} pet={pet} />
      {note ? (
        <Text variant="small" size={12} muted style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 'auto' },
  note: { marginTop: 6, marginLeft: 38, lineHeight: 16 },
});
