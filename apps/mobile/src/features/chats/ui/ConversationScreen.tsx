/**
 * Conversation (V4-Chat) : fil pending/publié, placeholder averti « Afficher quand même »,
 * suggestion du pet (jamais auto-envoyée), arbre du Lien, menu sécurité (signaler, bloquer,
 * partir, pause) toujours accessible, bouton d'aide 17 hors API.
 */
import { MESSAGE_MAX_CHARS } from '@blowy/api-contract';
import { Button, ChatScreenTemplate, ChatThread, Composer, EmptyStateTemplate, IconButton, ListRow, StatusPill, space } from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { paths } from '../../../core/navigation/paths';
import { pendingForScope } from '../../../core/offline/queue';
import { useOfflineQueue } from '../../../core/offline/store';
import { formatTime, t, tDynamic } from '../../../i18n';
import { useConsents } from '../../account';
import { mergeMessages, useConversation, useConversations, useSuggestions } from '../../conversations';
import { useMyPet } from '../../pets';
import { useRelationships } from '../../relationships';
import { useSafetyActions } from '../../trust';
import { SafetyMenu } from './SafetyMenu';

export function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conv = useConversation(id);
  const list = useConversations();
  const rels = useRelationships();
  const consents = useConsents();
  const pet = useMyPet();
  const queue = useOfflineQueue();
  const safety = useSafetyActions();
  const [menu, setMenu] = useState(false);
  const [draft, setDraft] = useState('');

  const meta = list.data?.items.find((c) => c.id === id);
  const rel = rels.data?.items.find((r) => r.conversationId === id) ?? null;
  const otherName = rel?.otherPet.name ?? '';
  const blockedPending = pendingForScope(queue, id, 'BLOCK').length > 0;
  const suggestions = useSuggestions(id, !!meta?.canSend);
  const items = useMemo(
    () =>
      mergeMessages(conv.server, conv.local, conv.revealed).map((m) => ({
        key: m.key,
        mine: m.mine,
        body: m.kind === 'system' ? (m.systemTemplate ? tDynamic(`chat.system.${m.systemTemplate}`) : null) : m.body,
        state: m.kind,
        statusLabel: m.statusKey ? tDynamic(m.statusKey) : null,
        revealLabel: t('chat.showAnyway'),
        onReveal: m.messageId ? () => void conv.reveal(m.messageId!) : undefined,
        time: formatTime(m.createdAt),
      })),
    [conv],
  );

  const disabledReason = blockedPending
    ? t('chat.blockedPending')
    : consents.data && !consents.data.socialAllowed
      ? t('chat.consentNeeded')
      : meta?.closed
        ? t('chat.closed')
        : meta && !meta.canSend
          ? t('chat.cannotSend')
          : null;

  if (conv.hidden && !blockedPending) {
    return <EmptyStateTemplate title={t('chat.hiddenLocally')} onBack={() => router.back()} backLabel={t('common.back')} />;
  }

  const suggestion = suggestions.data?.items[0]?.text;
  return (
    <ChatScreenTemplate
      testID="screen-conversation"
      title={otherName}
      onBack={() => router.back()}
      backLabel={t('common.back')}
      trailing={
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          {rel ? <IconButton icon="trophy" accessibilityLabel={t('chat.tree')} onPress={() => router.push(paths.linkTree(rel.id))} /> : null}
          <IconButton icon="more" accessibilityLabel={t('chat.menu')} onPress={() => setMenu(true)} testID="chat-menu" />
        </View>
      }
      banner={blockedPending ? <StatusPill kind="pending" label={t('chat.blockedPending')} /> : null}
      thread={<ChatThread items={items} onEndReached={() => conv.pages.hasNextPage && void conv.pages.fetchNextPage()} />}
      aboveComposer={
        suggestion && !disabledReason ? (
          <ListRow title={t('chat.suggestion', { pet: pet.data?.name ?? '' })} subtitle={suggestion} trailing={<Button label={t('chat.useSuggestion')} size="sm" variant="secondary" fullWidth={false} onPress={() => setDraft(suggestion)} />} />
        ) : null
      }
      composer={
        <Composer
          placeholder={t('chat.placeholder', { name: otherName })}
          sendLabel={t('chat.send')}
          maxLength={MESSAGE_MAX_CHARS}
          onSend={(text) => void conv.send(text)}
          disabled={!!disabledReason}
          disabledReason={disabledReason}
          draft={draft}
          onDraftChange={setDraft}
        />
      }
      overlays={
        <SafetyMenu
          visible={menu}
          onClose={() => setMenu(false)}
          otherName={otherName}
          conversationId={id}
          relationshipId={rel?.id ?? null}
          onBlock={() => safety.block({ conversationId: id, relationshipId: rel?.id ?? null })}
        />
      }
    />
  );
}
