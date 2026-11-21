/** Ligue de la semaine (maquette V7 « Ligue ») : tes voisins classés par étincelles, remise à zéro chaque lundi. */
import {
  Appear,
  Banner,
  LeagueHeader,
  LeagueRow,
  LeagueZoneLine,
  ListRow,
  SettingsSection,
  Skeleton,
  SettingsTemplate,
  Text,
  staggerDelay,
} from '@blowy/ui';

import { LEAGUE_TIERS } from '@blowy/domain';

import { ScreenMotion } from '@/core';
import { useProgression } from '@/features/progression';
import { errorMessage, goBack } from '@/features/session';
import { common } from '@/locales/common';
import { progression } from '@/locales/progression';
import { formatDate, formatNumber } from '@/locales/runtime';

const t = progression.league;
const TIERS = LEAGUE_TIERS as readonly (keyof typeof t.tiers)[];

export default function Ligue() {
  const q = useProgression();
  const league = q.data?.league;
  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} onBack={() => goBack('/moi')} backLabel={common.back} intro={t.intro}>
        {q.isError ? (
          <Banner
            tone="error"
            title={t.error}
            text={errorMessage(q.error)}
            actionLabel={common.retry}
            onAction={() => void q.refetch()}
          />
        ) : !league ? (
          <Skeleton height={240} radius="lg" />
        ) : (
          <>
            {league.result ? (
              <Banner
                tone={league.result.outcome === 'down' ? 'info' : 'success'}
                text={
                  league.result.outcome === 'up'
                    ? t.resultUp(t.tiers[league.result.to])
                    : league.result.outcome === 'down'
                      ? t.resultDown(t.tiers[league.result.to])
                      : t.resultStay(t.tiers[league.result.to], league.result.rank)
                }
              />
            ) : null}
            <LeagueHeader
              tier={league.tier}
              title={t.tierTitle(t.tiers[league.tier])}
              goal={
                league.next
                  ? league.toPromote != null
                    ? t.goalZone(league.toPromote, t.tiers[league.next.tier])
                    : t.goal(
                        Math.max(0, league.next.sparks - (q.data?.sparks ?? 0)),
                        t.tiers[league.next.tier],
                      )
                  : t.top
              }
              progress={
                league.next
                  ? league.toPromote != null
                    ? league.toPromote === 0
                      ? 1
                      : Math.min(
                          0.95,
                          (q.data?.sparks ?? 0) / Math.max(1, (q.data?.sparks ?? 0) + league.toPromote),
                        )
                    : Math.min(1, (q.data?.sparks ?? 0) / league.next.sparks)
                  : 1
              }
              tierLabels={t.tiers}
            />
            <Text variant="small" muted>
              {t.endsOn(
                formatDate(`${league.endsOn}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' }),
              )}
            </Text>
            {league.rows.map((r, i) => {
              const name = r.me ? t.you : r.displayName;
              const z = league.zones;
              const size = z?.size ?? league.rows.length;
              const zone =
                z && r.rank <= z.promote
                  ? 'up'
                  : z && z.demote > 0 && r.rank > size - z.demote
                    ? 'down'
                    : null;
              const tierIdx = TIERS.indexOf(league.tier);
              const next = TIERS[tierIdx + 1];
              const prev = TIERS[tierIdx - 1];
              return (
                <Appear key={r.userId} once={`ligue:${r.userId}`} delay={staggerDelay(i)}>
                  {z && z.demote > 0 && prev && r.rank === size - z.demote + 1 ? (
                    <LeagueZoneLine kind="down" label={t.zoneDown(t.tiers[prev])} />
                  ) : null}
                  <LeagueRow
                    rank={r.rank}
                    name={name}
                    species={r.species}
                    sparks={formatNumber(r.sparks)}
                    podium={r.podium}
                    me={r.me}
                    zone={zone}
                    accessibilityLabel={t.rowA11y(r.rank, name, r.sparks)}
                  />
                  {z && z.promote > 0 && next && r.rank === z.promote && size > z.promote ? (
                    <LeagueZoneLine kind="up" label={t.zoneUp(t.tiers[next])} />
                  ) : null}
                </Appear>
              );
            })}
            {!league.located ? <Banner tone="info" text={t.alone} /> : null}
            <SettingsSection title={t.howTitle}>
              {t.how.map((h, i) => (
                <ListRow
                  key={h.key}
                  title={h.title}
                  subtitle={h.text}
                  right={<Text variant="bodyHeavy">{h.value}</Text>}
                  divider={i < t.how.length - 1}
                />
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
