import { color } from '@blowy/tokens';
import type { Person } from '@blowy/contract';
import {
  Banner,
  Button,
  ButtonRow,
  Chip,
  DotNote,
  EmptyState,
  EncounterStage,
  type EncounterStageHandle,
  Header,
  MessageBubble,
  ScreenTemplate,
  SettingsSection,
  SheetTemplate,
  Skeleton,
  Stack,
  Text,
  usePetBump,
  VisionMatch,
  WornPremium,
  useRipple,
  useRippleAnchor,
  useTypingPause,
} from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { ScreenMotion } from '@/core';
import {
  isWaveLimit,
  matchAxes,
  useAcceptEncounter,
  useDeclineEncounter,
  useEncounter,
  useWave,
  useWaveBlock,
} from '@/features/encounters';
import { ConfirmSheet, errorText, ReportSheet } from '@/features/links';
import { usePet } from '@/features/pet';
import { useMe } from '@/features/me';
import { itemLabel } from '@/locales/content';
import { dayOf, isPremiumItem, itemAvailable } from '@blowy/domain';
import { useBlock } from '@/features/safety';
import { chat as chatText, chats as chatsText, options as optionsText } from '@/locales/chats';
import { rencontre as t, rencontres as listText } from '@/locales/rencontres';
import { ui } from '@/locales/ui';

type Sheet = 'menu' | 'report' | 'block' | null;

export default function RencontreScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const encounter = useEncounter(userId);
  const pet = usePet();
  const me = useMe();
  const wave = useWave();
  const accept = useAcceptEncounter();
  const decline = useDeclineEncounter();
  const block = useBlock();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [reported, setReported] = useState(false);
  const stage = useRef<EncounterStageHandle>(null);
  const waveButton = useRippleAnchor();
  const [waves, setWaves] = useState(0);
  const ripple = useRipple();
  const bump = usePetBump();
  // Le pet « écrit » avant que sa bulle s'affiche.
  const typing = useTypingPause(800, 450, encounter.incoming?.id ?? encounter.suggestion?.user.id);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/quartier'));
  const { incoming, suggestion } = encounter;
  const person: Person | null = incoming?.from ?? suggestion?.user ?? null;
  const compat = incoming?.compatibility ?? suggestion?.compatibility ?? 0;
  // Le pourcentage ne s'affiche jamais sans son explication (3 points communs, 1 différence).
  const explanation = incoming?.explanation ?? suggestion?.explanation ?? null;
  const via = suggestion
    ? suggestion.via === 'friend_of_friend'
      ? listText.via.friend_of_friend(suggestion.mutualName)
      : listText.via[suggestion.via]()
    : null;
  const myPet = pet.data?.pet;
  const myPetName = myPet?.name ?? chatsText.yourPet;
  // Trop de coucous : bouton désactivé et une explication, pas un écran d'erreur.
  const waveBlock = useWaveBlock(wave.error);
  const error = (isWaveLimit(wave.error) ? null : wave.error) ?? accept.error ?? decline.error;

  const header = (
    <Header
      onBack={back}
      backLabel={t.back}
      center={via ? <Chip label={via} tone="glass" size="sm" /> : undefined}
      right={
        person && explanation ? (
          <Chip
            label={ui.closeness(compat)}
            tone="accent"
            size="sm"
            accessibilityLabel={ui.closeness(compat)}
          />
        ) : undefined
      }
    />
  );

  if (!person) {
    return (
      <ScreenMotion>
        <ScreenTemplate header={header} background="violet">
          {/* Acceptée ou refusée à l'instant : on part déjà, pas de « plus là » pendant une image. */}
          {accept.isSuccess || decline.isSuccess ? null : encounter.isPending ? (
            <Stack top={6}>
              <Skeleton height={240} radius="xl" />
              <Skeleton height={120} radius="lg" />
            </Stack>
          ) : encounter.isError ? (
            <Banner
              tone="error"
              title={listText.loadError}
              text={encounter.error.message}
              actionLabel={listText.retry}
              onAction={() => void encounter.refetch()}
            />
          ) : (
            <EmptyState
              peek
              mood="triste"
              title={t.goneTitle}
              text={t.goneText}
              actionLabel={t.goneAction}
              onAction={() => router.replace('/quartier')}
            />
          )}
        </ScreenTemplate>
      </ScreenMotion>
    );
  }

  const worn =
    Object.values(person.pet.outfit ?? {}).find(
      (id): id is string =>
        typeof id === 'string' && isPremiumItem(id) && itemAvailable(id, dayOf(new Date()), new Set()),
    ) ?? null;
  const axes = explanation
    ? matchAxes(explanation, person.displayName, { same: t.sameSide, apart: t.apartSide })
    : null;

  /** Accepté : le lien s'ouvre tout de suite ; les deux pets quittent la scène pour se cogner au centre. */
  const onAccepted = async (linkId: string) => {
    // La place des pets est relevée avant de partir ; la navigation n'attend pas la mesure.
    const measuring = stage.current?.petRects();
    stage.current?.hidePets();
    router.replace(`/link/${linkId}`);
    if (!myPet) return;
    const rects = await measuring;
    bump({ left: myPet.species, right: person.pet.species, from: { left: rects?.me, right: rects?.them } });
  };
  /** Saluer : l'action part, puis ton pet fait signe et une onde part du bouton. */
  const onWave = () => {
    wave.mutate(person.id);
    setWaves((n) => n + 1);
    ripple(waveButton.target(), { color: color.accent });
  };

  const footer = incoming ? (
    <>
      <Button
        label={t.accept(person.displayName)}
        onPress={() => accept.mutate(incoming.id, { onSuccess: (link) => void onAccepted(link.id) })}
        loading={accept.isPending}
        disabled={decline.isPending}
      />
      <Button
        label={t.decline}
        variant="link"
        size="md"
        labelSize={15}
        onPress={() => {
          // Optimiste : la rencontre quitte la liste tout de suite, on n'attend pas l'API pour revenir.
          decline.mutate(incoming.id);
          back();
        }}
        disabled={accept.isPending}
      />
    </>
  ) : suggestion?.waved ? (
    <Button label={t.waved} variant="ghost" icon="check" disabled />
  ) : (
    <ButtonRow
      left={<Button label={t.decline} variant="glass" block={false} onPress={back} />}
      right={
        <View {...waveButton.props}>
          <Button label={t.sayHi} onPress={onWave} loading={wave.isPending} disabled={!!waveBlock} />
        </View>
      }
    />
  );

  return (
    <ScreenMotion>
      <ScreenTemplate footer={footer}>
        <Stack top={6} gap={12} grow>
          <EncounterStage
            ref={stage}
            waveKey={waves}
            onBack={back}
            backLabel={t.back}
            heading={[
              { text: person.displayName.toUpperCase() },
              { text: ` & ${person.pet.name.toUpperCase()}`, dim: true },
            ]}
            subtitle={via ?? undefined}
            compat={incoming ? undefined : t.presentedBy(myPetName)}
            compatLabel={incoming ? undefined : t.presentedBy(myPetName)}
            onMore={() => setSheet('menu')}
            moreLabel={t.more}
            me={myPet ? { pet: myPet, label: t.me(myPetName) } : undefined}
            them={{ pet: person.pet, label: t.them(person.pet.name, person.displayName) }}
            saysLabel={incoming ? t.theySay(person.pet.name) : t.saysTitle(myPetName)}
            text={suggestion?.waved ? t.waitingText(person.displayName) : t.text(person.displayName)}
          >
            <MessageBubble
              message={{
                author: incoming ? 'other_pet' : 'my_pet',
                kind: 'text',
                body: incoming?.intro ?? suggestion?.intro ?? '',
                mediaUrl: null,
              }}
              name={(incoming ? person.pet.name : myPetName).toLowerCase()}
              pet={incoming ? person.pet : myPet}
              fade={false}
              enter="receive"
              typing={typing}
              typingLabel={chatText.typing((incoming ? person.pet.name : myPetName).toLowerCase())}
            />
          </EncounterStage>
          {incoming?.intro || suggestion?.intro ? (
            <Text size={17} variant="bodyHeavy">
              {incoming?.intro ?? suggestion?.intro}
            </Text>
          ) : null}
          {explanation ? (
            <VisionMatch
              common={axes?.common ?? []}
              explore={
                axes?.explore ?? {
                  axis: explanation.explore.axis,
                  name: explanation.explore.name,
                  text: explanation.explore.text,
                }
              }
              commonTitle={t.shareTitle}
              exploreTitle={t.differTitle}
              legend={axes?.hasMarkers ? { mine: t.legendMe, theirs: person.displayName } : undefined}
            />
          ) : (
            <DotNote text={t.unknownVision} />
          )}
          {waveBlock && !incoming && !suggestion?.waved ? <Banner tone="info" text={waveBlock} /> : null}
          {/* Objet premium déjà visible sur son minimoa : l'essayer sur le sien (aperçu, docs/DESIR.md). */}
          {worn && me.data && !me.data.plus ? (
            <WornPremium
              item={worn}
              label={t.wornBy(person.displayName, itemLabel[worn] ?? worn)}
              actionLabel={t.tryIt(myPetName)}
              onPress={() =>
                router.push({ pathname: '/pet/garde-robe', params: { try: worn, from: 'worn' } })
              }
            />
          ) : null}
          {error ? (
            // Le serveur laisse saluer même quand le minimoa boude : une erreur dit sa vraie raison (texte de l'API).
            <Banner tone="error" text={errorText(error, listText.actionError)} />
          ) : null}
          {reported ? (
            <Banner
              tone="success"
              text={optionsText.reportDone}
              onClose={() => setReported(false)}
              closeLabel={optionsText.close}
            />
          ) : null}
        </Stack>

        <SheetTemplate
          visible={sheet === 'menu'}
          onClose={() => setSheet(null)}
          title={t.safetyTitle}
          closeLabel={optionsText.close}
        >
          <SettingsSection
            rows={[
              {
                key: 'report',
                title: optionsText.report(person.displayName),
                subtitle: optionsText.reportSub,
                onPress: () => setSheet('report'),
                chevron: true,
              },
              {
                key: 'block',
                title: optionsText.block(person.displayName),
                subtitle: optionsText.blockSub,
                onPress: () => setSheet('block'),
                destructive: true,
              },
            ]}
          />
        </SheetTemplate>
        <ReportSheet
          visible={sheet === 'report'}
          onClose={() => setSheet(null)}
          userId={person.id}
          name={person.displayName}
          onDone={() => {
            setSheet(null);
            setReported(true);
          }}
        />
        <ConfirmSheet
          visible={sheet === 'block'}
          onClose={() => setSheet(null)}
          title={optionsText.blockTitle(person.displayName)}
          text={optionsText.blockText(person.displayName)}
          confirmLabel={optionsText.blockConfirm}
          loading={block.isPending}
          error={block.isError ? errorText(block.error, optionsText.error) : null}
          onConfirm={() =>
            block.mutate(person.id, {
              onSuccess: () => {
                setSheet(null);
                router.replace('/quartier');
              },
            })
          }
        />
      </ScreenTemplate>
    </ScreenMotion>
  );
}
