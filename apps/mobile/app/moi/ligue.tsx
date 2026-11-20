/** Ligue de la semaine (maquette V7 « Ligue ») : tes voisins classés par étincelles, remise à zéro chaque lundi. */
import { Appear, Banner, LeagueRow, Skeleton, SettingsTemplate, Text, staggerDelay } from '@blowy/ui';

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
          </>
        )}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
