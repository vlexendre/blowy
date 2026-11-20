/**
 * Onglet Chats (V6-Chats) : seulement les conversations. Les bonjours reçus vivent dans Rencontres (un évènement,
 * un seul endroit). En tête, les séries en jeu, puis les liens (vies, séries, niveaux). Les groupes sont
 * retirés de l'interface V1 (`GROUPS_IN_V1`) : le code reste, l'ancien serveur aussi.
 */
import { color } from '@blowy/tokens';
import type { GroupInvitation, Groups, GroupSummary } from '@blowy/contract';
import {
  Appear,
  Banner,
  Button,
  EmptyState,
  GroupInviteRow,
  GroupRow,
  IconButton,
  LinkRow,
  NudgeBanner,
  SectionHeader,
  SheetTemplate,
  Skeleton,
  staggerDelay,
  TabTemplate,
  Text,
} from '@blowy/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/core';
import { useEncounters, useShareInvite } from '@/features/encounters';
import { isMyTurn, isNewLink, sortLinks, streaksWaitingOnMe, timeLabel, useLinks, usePrefetchLink } from '@/features/links';
import { GROUPS_IN_V1, sortGroups, useAcceptGroup, useDeclineGroup, useGroups } from '@/features/groups';
import { errorText } from '@/features/links';
import { usePet } from '@/features/pet';
import { openPlus } from '@/features/plus';
import { chats as t } from '@/locales/chats';
import { groupes } from '@/locales/groupes';
import { rituels } from '@/locales/rituels';

const g = groupes.list;

export default function ChatsScreen() {
  const router = useRouter();
  const links = useLinks();
  const groups = useGroups();
  const encounters = useEncounters();
  const pet = usePet();
  const invite = useShareInvite(t.shareMessage);
  const [refreshing, setRefreshing] = useState(false);

  const list = sortLinks(links.data ?? []);
  // Séries en jeu où l'autre a déjà écrit aujourd'hui : c'est à toi (la plus longue d'abord).
  const waiting = streaksWaitingOnMe(list);
  const petName = pet.data?.pet.name ?? '';
  const liveLinks = list.filter((l) => l.status === 'active').length;
  const now = new Date();
  // Les chats qu'on a le plus de chances d'ouvrir (non lus, puis les premiers de la liste) : leurs messages sont lus
  // d'avance, le chat s'ouvre déjà rempli. Au plus 3, et pas plus d'une fois par 15 s (cache).
  const prefetch = usePrefetchLink();
  const likely = list
    .filter((l) => l.status === 'active')
    .sort((a, b) => b.unread - a.unread)
    .slice(0, 3)
    .map((l) => l.id)
    .join(',');
  useEffect(() => {
    if (likely) for (const id of likely.split(',')) prefetch(id);
  }, [likely, prefetch]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([links.refetch(), encounters.refetch(), groups.refetch()]);
    setRefreshing(false);
  };

  // Les bonjours reçus se traitent dans Rencontres (un évènement, un seul endroit) : ici, les séries en jeu.
  const waitingFirst = waiting[0];

  return (
    <ScreenMotion>
    <TabTemplate
      brand={t.brand}
      title={t.title(list.length)}
      right={<IconButton glyph="plus" label={t.newChat} variant="accent" onPress={() => router.push('/rencontres')} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.mute} />}
    >
      {waitingFirst ? (
        <Appear once={`chats:turn:${waitingFirst.id}:${waitingFirst.today.day}`}>
        <NudgeBanner
          gradient="orange"
          icon="flamme"
          kicker={t.turnKicker}
          title={t.turnTitle(waiting.length)}
          text={t.turnText(waiting.map((l) => l.other.displayName))}
          species={pet.data?.pet.species ?? waitingFirst.myPet.species}
          mood="joie"
          onPress={() => router.push(`/link/${waitingFirst.id}`)}
          accessibilityLabel={t.turnA11y}
        />
        </Appear>
      ) : null}

      {GROUPS_IN_V1 ? <GroupsBlock links={liveLinks} now={now} onOpen={(id) => router.push(`/groupe/${id}`)} onCreate={() => router.push('/groupe/nouveau')} /> : null}
      {GROUPS_IN_V1 && showGroups(groups.data, liveLinks) && list.length > 0 ? <SectionHeader title={g.linksSection} /> : null}

      {links.isError && !links.data ? <Banner tone="error" title={t.errorTitle} text={links.error.message} actionLabel={t.retry} onAction={() => void links.refetch()} /> : null}

      {links.isPending ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={72} height={44} radius="pill" />
              <View style={styles.grow}>
                <Skeleton width="50%" height={16} />
                <Skeleton width="85%" height={12} style={styles.skeletonLine} />
              </View>
            </View>
          ))}
        </View>
      ) : list.length === 0 && !links.isError ? (
        <View style={styles.empty}>
          <EmptyState
            peek
            seed={pet.data?.pet.id}
            species={pet.data?.pet.species ?? 'nino'}
            mood="triste"
            title={t.emptyTitle}
            text={t.emptyText(petName || t.yourPet)}
            actionLabel={t.emptyAction}
            onAction={() => router.push('/rencontres')}
          />
          <Button label={invite.copied ? t.copied : t.shareInvite} variant="ghost" icon="share" onPress={() => void invite.share()} disabled={!invite.ready} />
        </View>
      ) : (
        <View style={styles.list}>
          {list.map((l, i) => (
            <Appear key={l.id} once={`chats:${l.id}`} delay={(waitingFirst ? 140 : 0) + staggerDelay(i)}>
            <LinkRow
              link={l}
              timeLabel={l.lastMessage ? timeLabel(l.lastMessage.at, now) : undefined}
              levelLabel={t.level(l.level)}
              emptyPreview={t.emptyPreview}
              ghostLabel={t.ghost}
              newLabel={isNewLink(l, now) ? t.isNew : undefined}
              streak={l.status === 'active' ? l.streak : 0}
              streakUnit={t.streakUnit}
              turnLabel={isMyTurn(l) ? t.turn : undefined}
              onPress={() => {
                prefetch(l.id);
                router.push(`/link/${l.id}`);
              }}
            />
            </Appear>
          ))}
        </View>
      )}
    </TabTemplate>
    </ScreenMotion>
  );
}

/**
 * Les groupes (spéc. §26), au-dessus des liens : invitations en attente (accepter / refuser), puis les groupes du plus
 * actif au moins actif. « Nouveau groupe » : la création, ou Minimoa+ quand la limite est atteinte.
 */
function GroupsBlock({ links, now, onOpen, onCreate }: { links: number; now: Date; onOpen: (id: string) => void; onCreate: () => void }) {
  const groups = useGroups();
  const accept = useAcceptGroup();
  const decline = useDeclineGroup();
  const [joining, setJoining] = useState<GroupInvitation | null>(null);
  const data = groups.data;
  if (!data) return null;
  const list = sortGroups(data.groups.filter((x) => x.status !== 'closed'));
  const invitations = data.invitations;
  // Rien à montrer et personne à inviter : pas de section (la liste des liens reste seule).
  if (!showGroups(data, links)) return null;
  const create = () => (data.canCreate ? onCreate() : openPlus('generic'));
  const doAccept = (inv: GroupInvitation) => accept.mutate(inv.groupId, { onSuccess: (detail) => (setJoining(null), onOpen(detail.id)) });
  const failed = accept.isError ? errorText(accept.error, g.actionError) : decline.isError ? errorText(decline.error, g.actionError) : null;
  return (
    <View style={styles.groups}>
      <SectionHeader title={g.section} actionLabel={g.newGroup} actionA11y={g.newGroupA11y} onAction={create} />
      {invitations.map((inv) => (
        <GroupInviteRow
          key={inv.groupId}
          pet={inv.invitedBy.pet}
          title={g.invite(inv.invitedBy.displayName, inv.name)}
          subtitle={[inv.habitLabel, g.members(inv.memberCount)].filter(Boolean).join(' · ')}
          acceptLabel={g.accept}
          declineLabel={g.decline}
          // Groupe d'habitude : la transparence (et l'habitude ajoutée) est dite avant de rejoindre.
          onAccept={() => (inv.transparency || inv.addsHabit ? setJoining(inv) : doAccept(inv))}
          onDecline={() => decline.mutate(inv.groupId)}
          accepting={accept.isPending && accept.variables === inv.groupId}
          declining={decline.isPending && decline.variables === inv.groupId}
        />
      ))}
      {failed ? <Banner tone="error" text={failed} onClose={() => (accept.reset(), decline.reset())} closeLabel={groupes.join.cancel} /> : null}
      {list.map((x, i) => (
        <Appear key={x.id} once={`chats:group:${x.id}`} delay={staggerDelay(i)}>
          <GroupRow
            name={x.name}
            emoji={x.habit ? rituels.habits.emoji[x.habit.habitId] : undefined}
            preview={x.lastMessage?.preview ?? g.noMessage}
            timeLabel={x.lastMessage ? timeLabel(x.lastMessage.at, now) : undefined}
            unread={x.unread}
            habit={x.habit ? { lives: x.habit.lives, maxLives: x.habit.maxLives, streak: x.habit.streak, streakUnit: t.streakUnit } : null}
            statusLabel={statusOf(x)}
            onPress={() => onOpen(x.id)}
          />
        </Appear>
      ))}
      <SheetTemplate
        visible={!!joining}
        onClose={() => setJoining(null)}
        title={joining ? groupes.join.title(joining.name) : undefined}
        closeLabel={groupes.join.cancel}
        footer={
          <>
            <Button label={groupes.join.confirm} loading={accept.isPending} onPress={() => joining && doAccept(joining)} />
            <Button label={groupes.join.cancel} variant="ghost" onPress={() => setJoining(null)} />
          </>
        }
      >
        {joining?.transparency ? <Text size={15}>{joining.transparency}</Text> : null}
        {joining?.addsHabit && joining.habitLabel ? (
          <Text size={15} muted>
            {groupes.join.addsHabit(joining.habitLabel)}
          </Text>
        ) : null}
      </SheetTemplate>
    </View>
  );
}

/** La section des groupes : dès qu'il y a un groupe, une invitation, ou deux liens vivants (de quoi en créer un). */
const showGroups = (data: Groups | undefined, liveLinks: number): boolean =>
  !!data && (data.groups.some((x) => x.status !== 'closed') || data.invitations.length > 0 || liveLinks >= 2);

const statusOf = (x: GroupSummary): string | undefined =>
  x.status === 'forming' ? g.forming : x.status === 'asleep' ? g.asleep : x.status === 'closed' ? g.closed : undefined;

const styles = StyleSheet.create({
  groups: { gap: 6 },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  // Maquette : 6 pt entre le bandeau et la liste (le gabarit en met 12) ; les lignes se touchent, séparées par un filet.
  list: { marginTop: -6 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  skeletonLine: { marginTop: 8 },
  empty: { gap: 12, paddingTop: 24 },
});
