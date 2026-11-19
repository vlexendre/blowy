/**
 * Onglet Moi (V6-Moi) : qui tu es (en-tête), puis d'après `GET /v1/profil` (docs/CHEMIN.md) ton type Minimoa, trois
 * chiffres (jours d'affilée, réponses, liens) et « Ce que Nino sait de toi » (niveau, jauges, les floues grisées, lien
 * vers Ton chemin) ; puis le lien « 3 mots », Minimoa+ (les gens d'abord), la liste courte menant aux réglages.
 * Le profil détaillé est réservé à Minimoa+ (`detailLocked`).
 */
import { color, space } from '@blowy/tokens';
import { Appear, Banner, KnowsPanel, MinimoaTypeCard, NoteCard, PlusBanner, ProfileHero, SettingsSection, Skeleton, Stagger, StatLine, TabTemplate, WordsShareCard } from '@blowy/ui';
import { router } from 'expo-router';
import { RefreshControl, View } from 'react-native';

import { ScreenMotion, usePorts, wordsUrl } from '@/core';
import { useLinks } from '@/features/links';
import { displayUrl, useCopyShare, useMe } from '@/features/me';
import { openPlus, plusPerksLine, usePlusPerks, useSubscription } from '@/features/plus';
import { useDiscreet } from '@/features/map';
import { useLivePet } from '@/features/pet';
import { common } from '@/locales/common';
import { moi } from '@/locales/moi';
import { croissance } from '@/locales/croissance';
import { useTrackShare } from '@/features/growth';
import { knowsStep, profilGauges, useCheminMap, useProfil } from '@/features/chemin';
import { chemin } from '@/locales/chemin';

const t = moi.tab;
const DAY_MS = 86_400_000;

export default function Moi() {
  const me = useMe();
  const pet = useLivePet();
  const links = useLinks();
  const words = useCopyShare();
  const track = useTrackShare();
  const { purchases } = usePorts();
  const discreet = useDiscreet();
  const subscription = useSubscription(!!me.data?.plus);
  // Les avantages viennent de la même source que la feuille Minimoa+ (jamais une autre liste ici).
  const perks = usePlusPerks(me.data?.pet.name ?? '');
  const profil = useProfil();
  const path = useCheminMap();
  const c = chemin.moi;

  const refresh = (
    <RefreshControl
      refreshing={me.isRefetching}
      tintColor={color.white}
      onRefresh={() => {
        void me.refetch();
        void pet.refetch();
        void links.refetch();
        void profil.refetch();
        void path.refetch();
      }}
    />
  );

  if (!me.data) {
    return (
      <ScreenMotion>
      <TabTemplate gutter={12} gap={8} top={6}>
        {me.isError ? (
          <Appear key="error">
            <Banner tone="error" title={common.errorTitle} text={t.errorText} actionLabel={common.retry} onAction={() => void me.refetch()} />
          </Appear>
        ) : (
          <View style={{ gap: space.md }} accessibilityLabel={common.loading}>
            <Skeleton height={100} radius="lg" />
            <Skeleton height={124} radius="lg" />
            <Skeleton height={56} radius="lg" />
          </View>
        )}
      </TabTemplate>
      </ScreenMotion>
    );
  }

  const m = me.data;
  const petName = m.pet.name;
  const wordsLink = wordsUrl(m.wordsCode);
  const wordsCount = pet.data?.wordsCount ?? 0;
  const linkList = links.data ?? [];
  const days = Math.max(1, Math.floor((Date.now() - Date.parse(m.pet.bornAt)) / DAY_MS) + 1);
  const pr = profil.data;
  const streakNow = path.data?.streak.current ?? 0;
  // Trois chiffres, même à zéro (V6-Moi) : jours d'affilée, réponses dans Ton chemin, liens.
  const stats = [
    { key: 'streak', value: streakNow, label: c.stats.streak(streakNow), color: color.orange },
    { key: 'answers', value: pr?.answers ?? 0, label: c.stats.answers(pr?.answers ?? 0) },
    { key: 'links', value: linkList.length, label: c.stats.links(linkList.length), color: color.accent },
  ];
  const member = m.plus;

  // Les blocs arrivent en cascade à la première visite seulement (l'onglet reste monté) ; les chiffres défilent.
  return (
    <ScreenMotion>
    <TabTemplate refreshControl={refresh} gutter={12} gap={8} top={6}>
      <Stagger onceKey="moi" step={55}>
      <ProfileHero
        key="hero"
        title={t.title(m.displayName, petName)}
        caption={t.together(days)}
        // Ta photo est toujours nette pour toi ; le flou pour les autres s'explique sur Mon compte, à côté de la photo.
        photoUri={m.avatarUrl}
        pet={m.pet}
        accessibilityLabel={t.heroLabel(m.displayName, petName)}
        onPress={() => router.push('/moi/compte')}
      />

      {pr ? <MinimoaTypeCard key="type" kicker={c.typeKicker} name={pr.type?.name ?? null} line={pr.type?.line ?? pr.typeHint ?? ''} species={m.pet.species} /> : null}

      <StatLine key="stats" items={stats} />

      {pr ? (
        <KnowsPanel
          key="knows"
          title={pr.title}
          level={c.knowsLevel(pr.knows.label, knowsStep(pr.knows.level))}
          gauges={profilGauges(pr).map((g) => ({
            key: g.axis,
            name: g.name,
            low: g.lowLabel,
            high: g.highLabel,
            value: g.value,
            confidence: g.confidence,
            foggy: g.foggy,
            label: g.foggy ? c.foggy(g.name) : g.name,
            accessibilityLabel: g.foggy ? c.gaugeFoggyA11y(g.name) : c.gaugeA11y(g.name, g.line),
          }))}
          more={{
            title: c.path,
            text: path.data ? c.pathText(path.data.stepsDone, path.data.stepsTotal) : (pr.typeHint ?? ''),
            onPress: () => router.navigate('/(tabs)/pet'),
          }}
        />
      ) : profil.isPending ? (
        <Skeleton key="knows" height={220} radius="lg" />
      ) : null}

      {pr?.detail ? <NoteCard key="detail" kicker={pr.detail.title} text={pr.detail.lines.join('\n')} /> : null}

      <WordsShareCard
        key="words"
        title={t.wordsTitle}
        badge={wordsCount > 0 ? t.wordsCount(wordsCount) : t.wordsBadge}
        badgeOn={wordsCount > 0}
        text={t.wordsLead(petName)}
        // Des mots sont arrivés : ton résultat et la carte à partager en story (dès 3 votes).
        moreLabel={wordsCount > 0 ? croissance.words.more : undefined}
        onMore={() => router.push('/mots')}
        shareLabel={t.wordsShareCta}
        onShare={() => {
          track('words');
          void words.share(t.wordsMessage(wordsLink), wordsLink);
        }}
        copyLabel={`${t.copy} ${displayUrl(wordsLink)}`}
        copiedLabel={t.copied}
        copied={words.copied}
        onCopy={() => void words.copy(wordsLink)}
      />

      <PlusBanner
        key="plus"
        // Pas de prix ici : le montant facturé se lit sur la feuille Minimoa+ (règle Apple 3.1.2, spéc §13).
        title={t.plusTitle}
        // Membre : l'état de l'abonnement (essai jusqu'au…, se renouvelle le…) tel que l'API le formule ; sinon deux avantages.
        // Les gens d'abord (V1) : qui t'a dit bonjour, plus de présentations, d'autres villes, le profil détaillé.
        text={member && subscription.data ? subscription.data.summary : pr?.detailLocked ? c.plusPeople : plusPerksLine(perks, 2)}
        ctaLabel={member ? undefined : purchases.available ? t.plusCta : t.plusSoonCta}
        onPress={() => openPlus('generic')}
      />

      <SettingsSection
        key="rows"
        variant="plain"
        rows={[
          {
            key: 'discreet',
            title: t.rows.discreet.title,
            subtitle: t.rows.discreet.subtitle(m.identity.discreet),
            switchValue: m.identity.discreet,
            onSwitchChange: (on: boolean) => discreet.mutate(on),
            disabled: discreet.isPending,
          },
          { key: 'ia', ...t.rows.ia, onPress: () => router.push('/moi/ia') },
          { key: 'settings', ...t.rows.settings, onPress: () => router.push('/moi/reglages') },
        ]}
      />
      </Stagger>
      {discreet.isError ? <Banner tone="error" text={t.discreetError} onClose={() => discreet.reset()} closeLabel={common.close} /> : null}
    </TabTemplate>
    </ScreenMotion>
  );
}
