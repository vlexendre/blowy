/**
 * Le Nid (V4-Nid) : compteurs (série, pièces, fiche), sélecteur de rendez-vous, scène 2D
 * (pan/parallaxe/pinch), pets avec présence réelle, actions pending → serveur, jauges figées
 * au dernier état officiel, Lien, mission, écrire. Données : useMyPet, useRelationships.
 */
import type { RelationshipView } from '@blowy/api-contract';
import type { Capability } from '@blowy/domain';
import { ACCESSORIES, ICONS, resolveSprite } from '@blowy/sprites';
import {
  ActionGrid,
  EmptyState,
  GaugePanel,
  IconButton,
  LinkCard,
  LoadingState,
  MissionCard,
  OfflineBanner,
  PetRenderer,
  PetScene,
  RelationSwitcher,
  StatChip,
  TabScreenTemplate,
  UnavailableState,
  petAccessibilityLabel,
  space,
} from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { viewStateOf } from '../../../core/api/query';
import { paths } from '../../../core/navigation/paths';
import { useNetwork } from '../../../core/network/network';
import { pendingCount } from '../../../core/offline/queue';
import { useOfflineQueue } from '../../../core/offline/store';
import { formatTime, t, tDynamic } from '../../../i18n';
import { actionAvailability, gaugeRows, petLabelWords, speciesName, useMyPet, usePetActions, type PetActionKind } from '../../pets';
import { linkProgress, useRelationships } from '../../relationships';
import { useWalletBalance } from '../../economy';
import { useTodayMission } from '../../social';
import { nestScene, scenePath } from '../model/scene';

const ACTIONS: readonly { kind: PetActionKind; icon: 'phone' | 'heart' | 'star' | 'check' | 'plus' }[] = [
  { kind: 'CALL', icon: 'phone' },
  { kind: 'HUG', icon: 'heart' },
  { kind: 'PLAY', icon: 'star' },
  { kind: 'FEED', icon: 'plus' },
  { kind: 'HEAL', icon: 'check' },
];

const REASON_KEY = { NEEDS_PARTNER: 'nest.actionNeedsPartner', NOT_UNLOCKED: 'link.state.locked', NEEDS_NETWORK: 'common.requiresNetwork', NO_RELATIONSHIP: 'nest.noDate' } as const;

export function NestScreen() {
  const params = useLocalSearchParams<{ relationship?: string }>();
  const pet = useMyPet();
  const rels = useRelationships();
  const mission = useTodayMission();
  const wallet = useWalletBalance();
  const online = useNetwork((s) => s.online);
  const queue = useOfflineQueue();
  const dates = (rels.data?.items ?? []).filter((r) => r.type === 'DATE' && r.status !== 'ENDED' && !queue.hiddenScopes.includes(r.id) && !(r.conversationId && queue.hiddenScopes.includes(r.conversationId)));
  const [selected, setSelected] = useState<string | null>(params.relationship ?? null);
  const rel: RelationshipView | null = dates.find((r) => r.id === selected) ?? dates[0] ?? null;
  const actions = usePetActions(pet.data?.id ?? null, rel?.id ?? null);
  const [reaction, setReaction] = useState<{ pose: 'AFFECTIONATE' | 'LEAP' | 'JOYFUL' | 'PROUD' | 'SURPRISED'; effect: 'hearts' | 'confetti' | null } | null>(null);

  const state = viewStateOf(pet);
  if (state === 'loading') return <LoadingState label={t('common.loading')} />;
  if (state !== 'ready' || !pet.data) {
    return (
      <TabScreenTemplate testID="screen-nest">
        <UnavailableState title={t('common.unavailableTitle')} message={state === 'offline' ? t('common.offline') : t('common.unavailableBody')} actionLabel={t('common.retry')} onAction={() => void pet.refetch()} />
      </TabScreenTemplate>
    );
  }

  const me = pet.data;
  const scene = nestScene(me, rel);
  const other = rel?.otherPet ?? null;
  const caps: readonly Capability[] = rel?.capabilities ?? [];
  const ctx = { hasRelationship: !!rel, bothHere: scene.meHere && scene.partnerVisible, myPetHere: scene.meHere, capabilities: caps, online };
  const progress = rel ? linkProgress(rel) : null;
  const shownPose = reaction?.pose ?? me.pose;

  const runAction = (kind: PetActionKind) => {
    const pose = kind === 'HUG' ? 'AFFECTIONATE' : kind === 'PLAY' ? 'LEAP' : kind === 'FEED' ? 'JOYFUL' : kind === 'HEAL' ? 'PROUD' : 'SURPRISED';
    setReaction({ pose, effect: kind === 'HUG' ? 'hearts' : null });
    void actions.run(kind).finally(() => setTimeout(() => setReaction(null), 3000));
  };

  const phaseLabel = (kind: PetActionKind): string | undefined => {
    const e = actions.state[actions.keyOf(kind)];
    if (!e) return undefined;
    if (e.phase === 'pending') return t('common.pending');
    if (e.phase === 'queued') return t('common.offlineQueued', { count: 1 });
    if (e.phase === 'failed') return t('common.failed');
    if (e.result) return e.result.outcome === 'REFUSED' ? tDynamic('nest.outcome.REFUSED', { name: me.name }) : e.result.gains.linkXp > 0 ? t('nest.gain', { xp: Math.round(e.result.gains.linkXp) }) : tDynamic(`nest.outcome.${e.result.outcome}`, { name: me.name });
    return undefined;
  };

  const sceneA11y = t('nest.a11yScene', {
    place: t(scene.placeKey),
    pets: [petAccessibilityLabel({ name: me.name, pose: shownPose, otherName: scene.partnerVisible ? other?.name : null }, petLabelWords), other ? (scene.partnerVisible ? t('nest.partnerHere', { name: other.name }) : t('nest.partnerOut', { name: other.name })) : null]
      .filter(Boolean)
      .join('. '),
  });

  return (
    <TabScreenTemplate
      testID="screen-nest"
      banner={!online ? <OfflineBanner message={t('common.offline')} pendingCount={pendingCount(queue)} pendingLabel={t('common.offlineQueued', { count: pendingCount(queue) })} /> : null}
      topBar={
        <>
          <StatChip iconPath={ICONS.flame} value={t('common.unknownValue')} accessibilityLabel={`${t('streak.title')}, ${t('common.unknownValueA11y')}`} onPress={() => router.push(paths.streak)} testID="nest-streak" />
          <StatChip iconPath={ICONS.coin} value={wallet.data ? String(wallet.data.balance) : t('common.unknownValue')} accessibilityLabel={wallet.data ? t('nest.coins', { coins: wallet.data.balance }) : `${t('shop.title')}, ${t('common.unknownValueA11y')}`} onPress={() => router.push(paths.shop)} testID="nest-coins" />
          <StatChip iconPath={resolveSprite(me.species, me.stage, 'PRESENTATION').path ?? ICONS.coin} value={me.name} tone="ink" accessibilityLabel={t('nest.petChip', { name: me.name })} onPress={() => router.push(paths.fiche)} testID="nest-fiche" />
          <IconButton icon="chats" accessibilityLabel={t('tabs.chats')} onPress={() => router.push(paths.chats)} />
        </>
      }
    >
      {dates.length > 0 ? (
        <RelationSwitcher
          items={dates.map((r) => ({ id: r.id, label: r.otherPet.name, spritePath: resolveSprite(r.otherPet.species, r.otherPet.stage, 'PRESENTATION').path, accessibilityLabel: t('nest.link', { name: r.otherPet.name }) }))}
          activeId={rel?.id ?? null}
          onSelect={setSelected}
          allLabel={t('nest.allDates')}
          onAll={() => router.push(paths.chats)}
        />
      ) : null}
      <PetScene
        backgroundPath={scenePath(scene.scene)}
        height={360}
        placeTitle={t(scene.placeKey)}
        placeSubtitle={other ? (scene.partnerVisible ? t('nest.partnerHere', { name: other.name }) : t('nest.partnerOut', { name: other.name })) : t('nest.alone', { name: me.name })}
        gestureHint={t('nest.gestureHint')}
        accessibilityLabel={sceneA11y}
        testID="nest-scene"
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: space.xl }}>
          <View>
            <PetRenderer
              species={me.species}
              stage={me.stage}
              pose={shownPose}
              bodyHeight={130}
              effect={reaction?.effect ?? null}
              accessibilityLabel={petAccessibilityLabel({ name: me.name, pose: shownPose, otherName: scene.partnerVisible ? other?.name : null }, petLabelWords)}
              accessibilityHint={t('pet.tapHint')}
              onTap={() => setReaction({ pose: 'SURPRISED', effect: null })}
              testID="nest-my-pet"
            />
            <IconButton icon="trophy" tone="ink" accessibilityLabel={t('nest.leagueUnknown', { name: me.name })} onPress={() => router.push(paths.league)} />
          </View>
          {other && scene.partnerVisible ? (
            <PetRenderer species={other.species} stage={other.stage} pose={other.pose} bodyHeight={120} flip phaseMs={1100} accessibilityLabel={petAccessibilityLabel({ name: other.name, pose: other.pose }, petLabelWords)} />
          ) : null}
        </View>
      </PetScene>

      <ActionGrid
        actions={ACTIONS.map(({ kind, icon }) => {
          const av = actionAvailability(kind, ctx);
          return {
            key: kind,
            label: tDynamic(`nest.actions.${kind}`),
            icon,
            onPress: () => runAction(kind),
            disabled: !av.enabled,
            state: actions.state[actions.keyOf(kind)]?.phase === 'pending' ? 'pending' : av.enabled ? 'idle' : 'unavailable',
            stateLabel: phaseLabel(kind) ?? (av.enabled ? undefined : t(REASON_KEY[av.reason])),
            testID: `action-${kind}`,
          };
        })}
      />

      <GaugePanel asOfLabel={t('common.stateAsOf', { time: formatTime(me.stateAsOf) })} stale={!online} gauges={gaugeRows(me.gauges)} />

      {rel && progress ? (
        <LinkCard
          title={t('nest.link', { name: rel.otherPet.name })}
          progressText={progress.next ? t('nest.linkProgress', { level: progress.level, xp: progress.xp, next: progress.next }) : t('nest.linkMax', { level: progress.level })}
          progress={progress.ratio}
          onPress={() => router.push(paths.linkTree(rel.id))}
          testID="nest-link"
        />
      ) : (
        <EmptyState title={t('nest.noDate')} actionLabel={t('nest.findDates')} onAction={() => router.push(paths.noDates)} />
      )}

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <MissionCard title={t('nest.mission')} subtitle={mission.isSuccess ? t('mission.title') : t('nest.missionUnavailable')} iconPath={ACCESSORIES.BALL.path} onPress={() => router.push(paths.mission)} testID="nest-mission" />
        {rel?.conversationId ? (
          <MissionCard variant="white" title={t('nest.write', { name: rel.otherPet.name })} subtitle={speciesName(rel.otherPet.species)} onPress={() => router.push(paths.conversation(rel.conversationId!))} testID="nest-write" />
        ) : null}
      </View>
    </TabScreenTemplate>
  );
}
