/**
 * Écrans relation : arbre du Lien, emménager, vote secret, révélation, rendez-vous réel +
 * gardien, couvaison, naissance, garde, partir proprement, pause, aucun rendez-vous.
 * Toutes les commandes exigent le réseau et la validation serveur (jamais en file).
 * Un endpoint absent → message « indisponible » honnête, aucune donnée fabriquée.
 */
import type { RelationshipView } from '@blowy/api-contract';
import { ACCESSORIES, EFFECTS, EGGS, ICONS, ILLUSTRATIONS, SCENES, resolveSprite } from '@blowy/sprites';
import {
  Banner,
  Button,
  DetailScreenTemplate,
  EmptyStateTemplate,
  LinkTree,
  ListRow,
  LoadingState,
  NumberStepper,
  OptionCard,
  PetRenderer,
  Sprite,
  StatusPill,
  Surface,
  TextField,
  petAccessibilityLabel,
  space,
} from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { isUnavailable } from '../../../core/api/http';
import { paths, type RelationScreen } from '../../../core/navigation/paths';
import { useNetwork } from '../../../core/network/network';
import { formatRelative, t, tDynamic } from '../../../i18n';
import { useMe } from '../../account';
import { petLabelWords, useMyPet } from '../../pets';
import { gateStates, useRelationship, useRelationshipCommands } from '../../relationships';
import { useChildren, useCurrentEgg, useSafetyDates } from '../../social';
import { callEmergency } from '../../trust';

const back = () => router.back();
const LEVEL_ICON: Record<number, string> = {
  1: ICONS.cookie,
  2: ACCESSORIES.BALL.path,
  3: SCENES.HOUSE,
  4: ACCESSORIES.FLOWER.path,
  5: EFFECTS.hearts,
  6: ACCESSORIES.BACKPACK.path,
  7: EGGS.SHARED ?? ICONS.cookie,
};

/** Charge la relation de l'URL ; gère chargement / indisponible. */
function useRouteRelation(): { rel: RelationshipView | null; gate: ReactNode | null } {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useRelationship(id ?? null);
  if (q.isLoading) return { rel: null, gate: <LoadingState label={t('common.loading')} /> };
  if (!q.data) return { rel: null, gate: <EmptyStateTemplate title={t('common.unavailableTitle')} message={t('common.unavailableBody')} onBack={back} backLabel={t('common.back')} actionLabel={t('common.retry')} onAction={() => void q.refetch()} /> };
  return { rel: q.data, gate: null };
}

/** Bandeau d'erreur d'une commande relationnelle. */
function CommandError({ error }: { error: unknown }) {
  if (!error) return null;
  return <Banner message={isUnavailable(error) ? t('common.unavailableBody') : t('common.errorBody')} tone="danger" live />;
}

export function LinkTreeScreen() {
  const { rel, gate } = useRouteRelation();
  if (gate || !rel) return <>{gate}</>;
  const states = gateStates(rel);
  return (
    <DetailScreenTemplate title={t('link.title')} eyebrow={rel.otherPet.name} onBack={back} backLabel={t('common.back')} testID="screen-link-tree">
      <LinkTree
        nodes={[1, 2, 3, 4, 5, 6, 7].map((lvl, i) => ({
          level: lvl,
          title: tDynamic(`link.levels.${lvl}.title`),
          subtitle: tDynamic(`link.levels.${lvl}.sub`),
          xpLabel: t('link.xp', { xp: [0, 150, 500, 900, 1400, 2000, 3000][i] ?? 0 }),
          state: states[i] ?? 'locked',
          stateLabel: tDynamic(`link.state.${states[i] ?? 'locked'}`),
          iconPath: LEVEL_ICON[lvl],
        }))}
      />
      {rel.pendingOffers.length > 0 || rel.openBranchRound ? (
        <Surface style={{ gap: space.sm }}>
          {rel.pendingOffers.some((o) => o.scope === 'MOVE_IN') ? <ListRow icon="heart" title={t('relation.moveIn.title')} onPress={() => router.push(paths.relation(rel.id, 'move-in'))} /> : null}
          {rel.openBranchRound ? <ListRow icon="star" title={t('relation.vote.title')} onPress={() => router.push(paths.relation(rel.id, 'vote'))} /> : null}
          {rel.pendingOffers.some((o) => o.scope === 'PHOTO_REVEAL') ? <ListRow icon="camera" title={t('relation.reveal.title')} onPress={() => router.push(paths.relation(rel.id, 'reveal'))} /> : null}
        </Surface>
      ) : null}
    </DetailScreenTemplate>
  );
}

function MoveIn({ rel }: { rel: RelationshipView }) {
  const cmd = useRelationshipCommands(rel.id);
  const online = useNetwork((s) => s.online);
  const offer = rel.pendingOffers.find((o) => o.scope === 'MOVE_IN');
  const eligible = rel.eligibleLevel >= 3 || rel.reachedLevel >= 3;
  const done = rel.status === 'MOVED_IN';
  return (
    <DetailScreenTemplate title={t('relation.moveIn.title')} lead={t('relation.moveIn.lead')} onBack={back} backLabel={t('common.back')} testID="screen-move-in" banner={!online ? <Banner message={t('common.requiresNetwork')} /> : null}>
      <View style={{ alignItems: 'center' }}>
        <Sprite path={ILLUSTRATIONS.HUG_NINO_SUZIE} size={230} accessibilityLabel={t('relation.moveIn.title')} />
      </View>
      <CommandError error={cmd.moveIn.error ?? cmd.respond.error} />
      {done ? <StatusPill kind="confirmed" label={t('relation.moveIn.done')} /> : null}
      {!done && !eligible ? <StatusPill kind="info" label={t('relation.moveIn.notYet')} /> : null}
      {!done && eligible && offer && !offer.proposedByMe && !offer.myDecision ? (
        <>
          <Button label={t('relation.moveIn.accept')} disabled={!online} loading={cmd.respond.isPending} onPress={() => void cmd.respond.mutateAsync({ offerId: offer.id, decision: 'ACCEPT', version: offer.version })} />
          <Button label={t('relation.moveIn.decline')} variant="secondary" disabled={!online} onPress={() => void cmd.respond.mutateAsync({ offerId: offer.id, decision: 'DECLINE', version: offer.version })} />
        </>
      ) : null}
      {!done && eligible && offer?.proposedByMe ? <StatusPill kind="pending" label={t('relation.moveIn.waiting')} /> : null}
      {!done && eligible && !offer ? <Button label={t('relation.moveIn.propose')} disabled={!online} loading={cmd.moveIn.isPending} onPress={() => void cmd.moveIn.mutateAsync()} testID="move-in-propose" /> : null}
    </DetailScreenTemplate>
  );
}

function Vote({ rel }: { rel: RelationshipView }) {
  const cmd = useRelationshipCommands(rel.id);
  const online = useNetwork((s) => s.online);
  const round = rel.openBranchRound;
  return (
    <DetailScreenTemplate title={t('relation.vote.title')} lead={t('relation.vote.lead')} onBack={back} backLabel={t('common.back')} testID="screen-vote">
      <CommandError error={cmd.ballot.error} />
      {!round ? (
        <StatusPill kind="info" label={t('relation.vote.none')} />
      ) : (
        <>
          {(['FRIEND', 'PLUS'] as const).map((c) => (
            <OptionCard key={c} title={t(c === 'FRIEND' ? 'relation.vote.friend' : 'relation.vote.plus')} selected={round.myChoice === c} disabled={!online} onPress={() => void cmd.ballot.mutateAsync(c)} testID={`vote-${c}`} />
          ))}
          {round.myChoice ? <StatusPill kind="pending" label={t('relation.vote.mine', { choice: t(round.myChoice === 'FRIEND' ? 'relation.vote.friend' : 'relation.vote.plus') })} /> : null}
          <StatusPill kind="info" label={t('relation.vote.deadline', { when: formatRelative(round.deadlineAt) })} />
        </>
      )}
    </DetailScreenTemplate>
  );
}

function Reveal({ rel }: { rel: RelationshipView }) {
  const cmd = useRelationshipCommands(rel.id);
  const me = useMe();
  const online = useNetwork((s) => s.online);
  const never = me.data?.privacy.photoPreference === 'NEVER';
  const offer = rel.pendingOffers.find((o) => o.scope === 'PHOTO_REVEAL');
  const allowed = rel.capabilities.includes('PHOTO_CLEAR') || rel.capabilities.includes('PHOTO_BLURRED') || !!offer;
  return (
    <DetailScreenTemplate title={t('relation.reveal.title')} lead={t('relation.reveal.lead')} onBack={back} backLabel={t('common.back')} testID="screen-reveal">
      <CommandError error={cmd.reveal.error} />
      {never ? <Banner message={t('relation.reveal.never')} tone="cream" icon="lock" /> : null}
      {offer?.myDecision === 'ACCEPT' || cmd.reveal.isSuccess ? <StatusPill kind="pending" label={t('relation.reveal.waiting')} /> : null}
      {!never && allowed && offer?.myDecision !== 'ACCEPT' && !cmd.reveal.isSuccess ? <Button label={t('relation.reveal.cta')} variant="violet" disabled={!online} loading={cmd.reveal.isPending} onPress={() => void cmd.reveal.mutateAsync()} /> : null}
      {!allowed ? <StatusPill kind="info" label={tDynamic('link.state.locked')} /> : null}
    </DetailScreenTemplate>
  );
}

function Irl({ rel }: { rel: RelationshipView }) {
  const dates = useSafetyDates();
  return (
    <DetailScreenTemplate title={t('relation.irl.title')} lead={t('relation.irl.lead')} onBack={back} backLabel={t('common.back')} testID="screen-irl">
      <Button label={t('common.help')} variant="danger" icon="phone" onPress={() => void callEmergency()} accessibilityHint={t('common.helpHint')} testID="irl-help" />
      {dates.isSuccess ? null : <Banner message={t('common.unavailableBody')} tone="cream" />}
      <ListRow icon="shield" title={t('relation.irl.guardian')} subtitle={rel.capabilities.includes('GUARDIAN') ? undefined : tDynamic('link.state.locked')} />
      <ListRow icon="check" title={t('relation.irl.checkIn')} />
      <ListRow icon="pin" title={t('relation.irl.locationAlways')} />
    </DetailScreenTemplate>
  );
}

function Unavailable({ titleKey, leadKey, probe }: { titleKey: 'relation.egg.title' | 'relation.birth.title' | 'relation.custody.title'; leadKey: 'relation.egg.lead' | 'relation.birth.lead' | 'relation.custody.lead'; probe: { refetch: () => unknown } }) {
  return (
    <EmptyStateTemplate
      headerTitle={t(titleKey)}
      title={t('common.unavailableTitle')}
      message={`${t(leadKey)} ${t('common.unavailableBody')}`}
      illustrationPath={titleKey === 'relation.custody.title' ? resolveSprite('NINO', 'BABY', 'JOYFUL').path : EGGS.SHARED}
      onBack={back}
      backLabel={t('common.back')}
      actionLabel={t('common.retry')}
      onAction={() => void probe.refetch()}
    />
  );
}

function Leave({ rel }: { rel: RelationshipView }) {
  const cmd = useRelationshipCommands(rel.id);
  const pet = useMyPet();
  const online = useNetwork((s) => s.online);
  const [reason, setReason] = useState('');
  if (cmd.leave.isSuccess) {
    return (
      <EmptyStateTemplate
        title={t('relation.leave.done', { pet: pet.data?.name ?? '' })}
        illustrationPath={ILLUSTRATIONS.NINO_SUITCASE}
        actionLabel={t('nest.findDates')}
        onAction={() => router.replace(paths.noDates)}
      />
    );
  }
  return (
    <DetailScreenTemplate
      title={t('relation.leave.title')}
      lead={t('relation.leave.lead')}
      onBack={back}
      backLabel={t('common.back')}
      testID="screen-leave"
      footer={<Button label={t('relation.leave.cta')} disabled={!online} loading={cmd.leave.isPending} onPress={() => void cmd.leave.mutateAsync('CLEAN_LEAVE')} testID="leave-confirm" />}
    >
      <CommandError error={cmd.leave.error} />
      <View style={{ alignItems: 'center' }}>
        {pet.data ? <PetRenderer species={pet.data.species} stage={pet.data.stage} pose="PRESENTATION" bodyHeight={140} accessibilityLabel={petAccessibilityLabel({ name: pet.data.name, pose: 'PRESENTATION' }, petLabelWords)} /> : null}
      </View>
      {/* Raison intime facultative : jamais envoyée au serveur ni à l'autre (aide à la réflexion locale). */}
      <TextField label={t('relation.leave.reasonOptional')} value={reason} onChangeText={setReason} multiline />
      <ListRow title={rel.otherPet.name} subtitle={t('chats.petHere', { pet: pet.data?.name ?? '' })} />
    </DetailScreenTemplate>
  );
}

function Pause({ rel }: { rel: RelationshipView }) {
  const cmd = useRelationshipCommands(rel.id);
  const online = useNetwork((s) => s.online);
  const [days, setDays] = useState(7);
  return (
    <DetailScreenTemplate
      title={t('relation.pause.title')}
      lead={t('relation.pause.lead')}
      onBack={back}
      backLabel={t('common.back')}
      testID="screen-pause"
      footer={<Button label={t('relation.pause.cta')} disabled={!online || rel.paused} loading={cmd.pause.isPending} onPress={() => void cmd.pause.mutateAsync(days)} />}
    >
      <CommandError error={cmd.pause.error} />
      {rel.paused || cmd.pause.isSuccess ? <StatusPill kind="confirmed" label={t('chats.paused')} /> : null}
      <NumberStepper label={t('relation.pause.days', { days })} value={days} min={1} max={14} onChange={setDays} decreaseLabel={t('onboarding.preferences.decrease')} increaseLabel={t('onboarding.preferences.increase')} />
    </DetailScreenTemplate>
  );
}

/** Routeur des sous-écrans relation (un seul fichier de route dynamique). */
export function RelationScreenRouter() {
  const { screen } = useLocalSearchParams<{ screen: RelationScreen }>();
  const { rel, gate } = useRouteRelation();
  const egg = useCurrentEgg();
  const children = useChildren();
  if (screen === 'egg') return <Unavailable titleKey="relation.egg.title" leadKey="relation.egg.lead" probe={egg} />;
  if (screen === 'birth') return <Unavailable titleKey="relation.birth.title" leadKey="relation.birth.lead" probe={egg} />;
  if (screen === 'custody') return <Unavailable titleKey="relation.custody.title" leadKey="relation.custody.lead" probe={children} />;
  if (gate || !rel) return <>{gate}</>;
  switch (screen) {
    case 'move-in':
      return <MoveIn rel={rel} />;
    case 'vote':
      return <Vote rel={rel} />;
    case 'reveal':
      return <Reveal rel={rel} />;
    case 'irl':
      return <Irl rel={rel} />;
    case 'leave':
      return <Leave rel={rel} />;
    case 'pause':
      return <Pause rel={rel} />;
    default:
      return <LinkTreeScreen />;
  }
}

/** Aucun rendez-vous (V4-Vide) : le pet garde tout ; prochaine proposition à 21 h. */
export function NoDatesScreen() {
  const pet = useMyPet();
  const name = pet.data?.name ?? '';
  return (
    <EmptyStateTemplate
      headerTitle={t('chats.title')}
      onBack={back}
      backLabel={t('common.back')}
      title={t('relation.noDates.title', { pet: name })}
      message={`${t('relation.noDates.lead', { pet: name })} ${t('relation.noDates.next')}`}
      illustrationPath={pet.data ? resolveSprite(pet.data.species, pet.data.stage, 'SAD').path : null}
      actionLabel={t('social.neighborhood.title')}
      onAction={() => router.push(paths.neighborhood)}
    />
  );
}
