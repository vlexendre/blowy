import type { Ids } from '../../../shared/ids';
import type { GroupMembersRepository, GroupMessagesRepository } from '../ports';

/**
 * Bloquer un membre fait quitter à celui qui bloque les groupes qu'ils partagent (spéc §26) : deux personnes bloquées
 * ne sont jamais dans le même groupe. Le groupe voit un départ ordinaire (« X a quitté le groupe »), sans dire pourquoi.
 * Les invitations en attente entre eux deviennent invisibles d'elles-mêmes (`GroupCore.invitationReachable`).
 */
export async function leaveGroupsSharedWith(
  deps: { members: GroupMembersRepository; messages: GroupMessagesRepository; ids: Ids },
  blocker: { id: string; displayName: string },
  blockedId: string,
  at: string,
): Promise<number> {
  const mine = await deps.members.listForUser(blocker.id, ['active']);
  if (mine.length === 0) return 0;
  const all = await deps.members.listForGroups(mine.map((m) => m.groupId));
  const shared = mine.filter((m) =>
    all.some((o) => o.groupId === m.groupId && o.userId === blockedId && o.status === 'active'),
  );
  for (const m of shared) {
    await deps.members.update(m.groupId, blocker.id, { status: 'left', leftAt: at });
    await deps.messages.add([
      {
        id: deps.ids.uuid(),
        groupId: m.groupId,
        authorKind: 'system',
        authorId: null,
        kind: 'event',
        body: null,
        event: 'left',
        eventVars: { name: blocker.displayName },
        createdAt: at,
      },
    ]);
  }
  return shared.length;
}
