import type { ReactElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { MessageBubble, type MessageBubbleProps } from '../molecules/MessageBubble';

export type ChatItem = MessageBubbleProps & { key: string };

export interface ChatThreadProps {
  items: readonly ChatItem[];
  onEndReached?: () => void;
  header?: ReactElement;
  footerSpace?: number;
}

/** Fil de messages inversé (plus récent en bas). */
export function ChatThread({ items, onEndReached, header, footerSpace = space.lg }: ChatThreadProps) {
  return (
    <FlatList
      inverted
      data={items as ChatItem[]}
      keyExtractor={(m) => m.key}
      renderItem={({ item: { key: _k, ...m } }) => <MessageBubble {...m} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={header}
      ListHeaderComponent={<View style={{ height: footerSpace }} />}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: space.lg } });
