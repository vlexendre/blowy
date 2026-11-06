/**
 * Chats (V4-Chats) : rendez-vous (avec indication « ton pet est ici / ailleurs »), Quartier et
 * bandes séparés. Aucun badge romantique ni branche secrète affichés dans la liste.
 */
import type { RelationshipView } from '@blowy/api-contract';
import { resolveSprite } from '@blowy/sprites';
import { EmptyState, ListRow, LoadingState, SectionTitle, Sprite, StatusPill, Surface, TabScreenTemplate, UnavailableState } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { viewStateOf } from '../../../core/api/query';
import { paths } from '../../../core/navigation/paths';
import { useOfflineQueue } from '../../../core/offline/store';
import { t } from '../../../i18n';
import { useConversations } from '../../conversations';
import { useMyPet } from '../../pets';
import { useRelationships } from '../../relationships';

function RelationRow({ r, petName, unread }: { r: RelationshipView; petName: string; unread: number }) {
  const open = () => (r.conversationId ? router.push(paths.conversation(r.conversationId)) : router.push(paths.linkTree(r.id)));
  return (
    <ListRow
      title={r.otherPet.name}
      subtitle={[r.myPetHere ? t('chats.petHere', { pet: petName }) : t('chats.petAway', { pet: petName }), r.paused ? t('chats.paused') : null, r.legacy ? t('chats.legacy') : null].filter(Boolean).join(' · ')}
      leading={<Sprite path={resolveSprite(r.otherPet.species, r.otherPet.stage, r.otherPet.pose).path} size={44} />}
      trailing={unread > 0 ? <StatusPill kind="info" label={t('chats.unread', { count: unread })} /> : undefined}
      onPress={open}
      testID={`chat-row-${r.id}`}
    />
  );
}

export function ChatsScreen() {
  const rels = useRelationships();
  const convs = useConversations();
  const pet = useMyPet();
  const hidden = useOfflineQueue((s) => s.hiddenScopes);
  const state = viewStateOf(rels);
  const petName = pet.data?.name ?? '';
  const unreadOf = (convId: string | null) => {
    const c = convs.data?.items.find((x) => x.id === convId);
    return c ? Math.max(0, c.lastSeq - c.lastReadSeq) : 0;
  };
  const visible = (rels.data?.items ?? []).filter((r) => r.status !== 'ENDED' && !hidden.includes(r.id) && !(r.conversationId && hidden.includes(r.conversationId)));
  const sections = [
    { key: 'DATE', title: t('chats.datesSection'), empty: t('chats.empty'), items: visible.filter((r) => r.type === 'DATE') },
    { key: 'NEIGHBORHOOD', title: t('chats.neighborhoodSection'), empty: t('chats.neighborhoodEmpty'), items: visible.filter((r) => r.type === 'NEIGHBORHOOD') },
    { key: 'GROUP', title: t('chats.groupsSection'), empty: t('chats.groupsEmpty'), items: visible.filter((r) => r.type === 'GROUP' || r.type === 'COPARENT') },
  ];
  return (
    <TabScreenTemplate title={t('chats.title')} testID="screen-chats">
      {state === 'loading' ? <LoadingState label={t('common.loading')} /> : null}
      {state === 'unavailable' || state === 'error' || state === 'offline' ? <UnavailableState title={t('common.unavailableTitle')} message={t('common.unavailableBody')} actionLabel={t('common.retry')} onAction={() => void rels.refetch()} /> : null}
      {state === 'ready' || state === 'empty'
        ? sections.map((s) => (
            <Surface key={s.key} padding="md">
              <SectionTitle label={s.title} />
              {s.items.length === 0 ? <EmptyState title={s.empty} /> : s.items.map((r) => <RelationRow key={r.id} r={r} petName={petName} unread={unreadOf(r.conversationId)} />)}
            </Surface>
          ))
        : null}
    </TabScreenTemplate>
  );
}
