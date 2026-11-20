/** Ligue de la semaine (maquette V7 « Ligue ») : tes voisins classés par étincelles, remise à zéro chaque lundi. */
import { Appear, Banner, LeagueHeader, LeagueRow, ListRow, SettingsSection, Skeleton, SettingsTemplate, Text, staggerDelay } from '@blowy/ui';

import { ScreenMotion } from '@/core';
import { useProgression } from '@/features/progression';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { progression } from '@/locales/progression';
import { formatDate, formatNumber } from '@/locales/runtime';

const t = progression.league;

export default function Ligue() {
  const q = useProgression();
  const league = q.data?.league;
  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} onBack={() => goBack('/moi')} backLabel={common.back} intro={t.intro}>
        {q.isError ? (
          <Banner tone="error" title={t.error} text={errorMessage(q.error)} actionLabel={common.retry} onAction={() => void q.refetch()} />
        ) : !league ? (
          <Skeleton height={240} radius="lg" />
        ) : (
          <>
            <LeagueHeader
              tier={league.tier}
              title={t.tierTitle(t.tiers[league.tier])}
              goal={league.next ? t.goal(Math.max(0, league.next.sparks - (q.data?.sparks ?? 0)), t.tiers[league.next.tier]) : t.top}
              progress={league.next ? Math.min(1, (q.data?.sparks ?? 0) / league.next.sparks) : 1}
              tierLabels={t.tiers}
            />
            <Text variant="small" muted>
              {t.endsOn(formatDate(`${league.endsOn}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' }))}
            </Text>
            {league.rows.map((r, i) => {
              const name = r.me ? t.you : r.displayName;
              return (
                <Appear key={r.userId} once={`ligue:${r.userId}`} delay={staggerDelay(i)}>
                  <LeagueRow rank={r.rank} name={name} species={r.species} sparks={formatNumber(r.sparks)} podium={r.podium} me={r.me} accessibilityLabel={t.rowA11y(r.rank, name, r.sparks)} />
                </Appear>
              );
            })}
            {!league.located ? <Banner tone="info" text={t.alone} /> : null}
            <SettingsSection title={t.howTitle}>
              {t.how.map((h, i) => (
                <ListRow key={h.key} title={h.title} subtitle={h.text} right={<Text variant="bodyHeavy">{h.value}</Text>} divider={i < t.how.length - 1} />
              ))}
            </SettingsSection>
            <Text variant="small" muted>
              {t.howNote}
            </Text>
          </>
        )}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
