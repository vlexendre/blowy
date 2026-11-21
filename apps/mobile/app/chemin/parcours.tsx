/**
 * Tout le chemin (façon Duolingo, du bas vers le haut) : un chapitre par univers, chacun sur une page entière, son
 * bandeau en bas (on y entre par le bas), ses étapes qui montent, son coffre en haut. L'écran s'ouvre sur l'étape du jour.
 */
import { Banner, CheminPath, Header, ScreenTemplate, Skeleton, Title } from '@blowy/ui';
import { useRouter } from 'expo-router';
import { type ComponentRef, useRef } from 'react';
import { type ScrollView, useWindowDimensions } from 'react-native';

import { ScreenMotion } from '@/core';
import { hasSessionToDo, pathChapters, useCheminMap } from '@/features/chemin';
import { useMe } from '@/features/me';
import { goBack } from '@/features/session';
import { chemin as c } from '@/locales/chemin';
import { common } from '@/locales/common';

/** Place prise par l'en-tête et la barre du bas : le reste est la hauteur d'un chapitre. */
const CHROME = 150;
/** Hauteurs du chemin (CheminPath) pour estimer celle d'un chapitre. */
const NODE = 52;
const UNIT = 92;

export default function Parcours() {
  const router = useRouter();
  const map = useCheminMap();
  const me = useMe();
  const { height } = useWindowDimensions();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrolled = useRef(false);
  const cm = map.data;
  const todo = hasSessionToDo(cm);

  const label = (n: { kind: string; title: string; unitTitle: string }) =>
    n.kind === 'done'
      ? c.home.node.done(n.title)
      : n.kind === 'current'
        ? c.home.node.current(n.title)
        : n.kind === 'chest'
          ? c.home.node.chest(n.unitTitle)
          : n.kind === 'chestOpen'
            ? c.home.node.chestOpen(n.unitTitle)
            : c.home.node.locked(n.title);

  // Chaque chapitre remplit l'écran : un espace vide en haut de chapitre complète ses étapes.
  const page = Math.max(420, height - CHROME);
  const nodes = cm
    ? pathChapters(cm)
        .flatMap((ch, ci) => {
          const own = ch.nodes.map((n) =>
            n.kind === 'unit'
              ? {
                  key: n.key,
                  kind: n.kind,
                  index: (n.unitIndex ?? 1) - 1,
                  title: n.title,
                  subtitle: n.unitIndex === 1 && n.done === n.total ? c.home.unitSignup : c.home.unitKicker(n.unitIndex ?? 1, n.done ?? 0, n.total ?? 0),
                  accessibilityLabel: `${c.home.unitKicker(n.unitIndex ?? 1, n.done ?? 0, n.total ?? 0)}, ${n.title}`,
                }
              : { key: n.key, kind: n.kind, accessibilityLabel: label(n) },
          );
          const used = ch.nodes.reduce((sum, n) => sum + (n.kind === 'unit' ? UNIT : NODE), 0);
          return [...own, { key: `gap:${ci}`, kind: 'gap' as const, height: Math.max(0, page - used), accessibilityLabel: '' }];
        })
        .reverse()
    : [];

  return (
    <ScreenMotion>
      <ScreenTemplate
        scrollRef={scrollRef}
        header={<Header onBack={() => goBack('/pet')} backLabel={common.back} center={<Title text={c.home.pathTitle.toUpperCase()} size={28} />} />}
      >
        {map.isError ? (
          <Banner tone="error" text={c.home.loadError} actionLabel={c.home.retry} onAction={() => void map.refetch()} />
        ) : !cm ? (
          <Skeleton height={page} radius="lg" />
        ) : (
          <CheminPath
            nodes={nodes}
            onStart={todo ? () => router.push('/chemin/seance') : undefined}
            pet={me.data ? { species: me.data.pet.species, outfit: me.data.pet.outfit, id: me.data.pet.id } : null}
            onCurrentY={(y) => {
              if (scrolled.current) return;
              scrolled.current = true;
              setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - height / 2), animated: false }), 50);
            }}
          />
        )}
      </ScreenTemplate>
    </ScreenMotion>
  );
}
