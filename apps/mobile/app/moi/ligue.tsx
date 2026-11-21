/**
 * Ligue de la semaine (V6-Ligue, façon Duolingo) : les cinq ligues (la tienne en grand), son nom et ce qui manque pour
 * monter, le classement (médailles, ta ligne en jaune, la ligne de montée), puis comment gagner des étincelles.
 */
import { LEAGUE_TIERS } from '@blowy/domain';
import {
  Appear,
  Banner,
  Header,
  LeagueHeader,
  LeagueHowCard,
  LeagueRow,
  LeagueZoneLine,
  ScreenTemplate,
  Skeleton,
  Stack,
  staggerDelay,
} from '@blowy/ui';

import { ScreenMotion } from '@/core';
import { useProgression } from '@/features/progression';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { progression } from '@/locales/progression';

const t = progression.league;
const TIERS = LEAGUE_TIERS as readonly (keyof typeof t.tiers)[];

/** Jours restants dans la semaine de ligue (dimanche compris). */
function daysLeft(endsOn: string): number {
  const end = Date.parse(`${endsOn}T23:59:59`);
  return Math.max(1, Math.ceil((end - Date.now()) / 86_400_000));
}

export default function Ligue() {
  const q = useProgression();
  const league = q.data?.league;
  const sparks = q.data?.sparks ?? 0;
  const tierIdx = league ? TIERS.indexOf(league.tier) : -1;
  const next = TIERS[tierIdx + 1];
  const prev = TIERS[tierIdx - 1];
  const days = league ? daysLeft(league.endsOn) : 0;
  const left = league?.toPromote ?? (league?.next ? Math.max(0, league.next.sparks - sparks) : 0);
  return (
    <ScreenMotion>
      <ScreenTemplate header={<Header onBack={() => goBack('/moi')} backLabel={common.back} />}>
        {q.isError ? (
          <Banner tone="error" title={t.error} text={errorMessage(q.error)} actionLabel={common.retry} onAction={() => void q.refetch()} />
        ) : !league ? (
          <Skeleton height={240} radius="lg" />
        ) : (
          <Stack gap={14}>
            <LeagueHeader
              tier={league.tier}
              title={t.tierTitle(t.tiers[league.tier])}
              goal={next ? t.goalShort(left, t.tiers[next], days) : t.topShort(days)}
              progress={next ? (left === 0 ? 1 : Math.min(0.95, sparks / Math.max(1, sparks + left))) : 1}
              tierLabels={t.tiers}
            />
            <Stack gap={2}>
              {league.rows.map((r, i) => {
                const name = r.me ? t.you : r.displayName;
                const z = league.zones;
                const size = z?.size ?? league.rows.length;
                const zone = z && r.rank <= z.promote ? 'up' : z && z.demote > 0 && r.rank > size - z.demote ? 'down' : null;
                return (
                  <Appear key={r.userId} once={`ligue:${r.userId}`} delay={staggerDelay(i)}>
                    {z && z.demote > 0 && prev && r.rank === size - z.demote + 1 ? <LeagueZoneLine kind="down" label={t.zoneDown(t.tiers[prev])} /> : null}
                    <LeagueRow
                      rank={r.rank}
                      name={name}
                      species={r.species}
                      sparks={t.sparksShort(r.sparks)}
                      podium={r.podium}
                      me={r.me}
                      zone={zone}
                      accessibilityLabel={t.rowA11y(r.rank, name, r.sparks)}
                    />
                    {z && z.promote > 0 && next && r.rank === z.promote && size > z.promote ? <LeagueZoneLine kind="up" label={t.zoneUp(t.tiers[next])} /> : null}
                  </Appear>
                );
              })}
            </Stack>
            {!league.located ? <Banner tone="info" text={t.alone} /> : null}
            <LeagueHowCard title={t.howTitle} rows={t.howRows} />
          </Stack>
        )}
      </ScreenTemplate>
    </ScreenMotion>
  );
}
