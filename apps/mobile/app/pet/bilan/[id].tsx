/**
 * Le bilan de la semaine (V6-GBilan), présenté par le minimoa : ce que tu as fait, ce qu'il a remarqué de ta vision,
 * une idée pour la semaine, un mot par lien. Toujours positif (les phrases viennent de l'API). Minimoa+ : le détail.
 */
import { color } from '@blowy/tokens';
import {
  Appear,
  Banner,
  Button,
  Chip,
  EntryCard,
  FactRow,
  Glyph,
  Icon,
  NoteCard,
  ReviewHero,
  ScreenTemplate,
  Skeleton,
  Stack,
  TipRow,
  VisionMeter,
} from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ScreenMotion } from '@/core';
import { useMe } from '@/features/me';
import { usePet } from '@/features/pet';
import { isoWeek, useReadReview, useReview, useVision } from '@/features/rituals';
import { openPlus } from '@/features/plus';
import { goBack } from '@/features/session';
import { lowerFirst } from '@/features/onboarding';
import { rituels } from '@/locales/rituels';

const t = rituels.review;

export default function ReviewScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const review = useReview(id);
  const pet = usePet();
  const me = useMe();
  const read = useReadReview();
  const vision = useVision();
  const marked = useRef(false);
  const close = () => goBack('/(tabs)/pet');

  const r = review.data;
  useEffect(() => {
    if (!r || r.read || marked.current) return;
    marked.current = true;
    read.mutate(r.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.id, r?.read]);

  const p = pet.data?.pet;
  if (!r || !p) {
    return (
      <ScreenTemplate>
        <Stack top={6}>
          {review.isError || pet.isError ? (
            <Banner tone="error" title={t.loadError} text="" actionLabel={t.retry} onAction={() => void Promise.all([review.refetch(), pet.refetch()])} onClose={close} />
          ) : (
            <>
              <Skeleton height={214} radius="xl" />
              <Skeleton height={92} radius="lg" />
              <Skeleton height={140} radius="lg" />
            </>
          )}
        </Stack>
      </ScreenTemplate>
    );
  }

  const f = r.facts;
  // L'axe qui a le plus bougé cette semaine (en crans, dit par l'API) : sa barre, et le sens du mouvement.
  const order = { small: 1, medium: 2, large: 3 } as const;
  const moved = (r.axisMoves ?? []).filter((m) => m.direction !== 'steady' && m.size).sort((a, b) => order[b.size ?? 'small'] - order[a.size ?? 'small'])[0];
  const movedAxis = moved ? vision.data?.axes.find((a) => a.axis === moved.axis) : undefined;
  const movedPole = moved && movedAxis ? lowerFirst(moved.direction === 'up' ? movedAxis.highLabel : movedAxis.lowLabel) : null;
  return (
    <ScreenMotion>
      <ScreenTemplate>
        <Stack top={6} gap={10}>
          <ReviewHero
            pet={{ species: p.species, outfit: p.outfit, name: p.name, id: p.id }}
            kicker={t.kicker(isoWeek(r.weekStart))}
            title={t.title(r.title)}
            onClose={close}
            closeLabel={t.close}
          />
          <Appear once={`review:${r.id}:facts`} delay={120}>
            <FactRow
              facts={[
                { count: f.outings, label: t.outings(f.outings), gradient: 'accent' },
                { count: f.habitsKept, label: t.habits(f.habitsKept), gradient: 'orange' },
                { count: f.streak, label: t.streak(f.streak), gradient: 'violet' },
              ]}
            />
          </Appear>
          {r.did.length ? (
            <Appear once={`review:${r.id}:did`} delay={200}>
              <NoteCard kicker={t.did} text={r.did.join('\n')} />
            </Appear>
          ) : null}
          <Appear once={`review:${r.id}:noticed`} delay={260}>
            <NoteCard kicker={t.noticed(p.name)} text={r.noticed} icon={<Icon name="etoiles" size={30} />}>
              {moved?.size && movedAxis && movedPole ? (
                <VisionMeter
                  title={t.moveTitle(movedAxis.name)}
                  value={movedAxis.value}
                  low={movedAxis.lowLabel}
                  high={movedAxis.highLabel}
                  sticker={t.moveSticker(movedPole, moved.size)}
                  accessibilityLabel={t.moveA11y(movedAxis.name, movedPole, moved.size)}
                />
              ) : null}
            </NoteCard>
          </Appear>
          <Appear once={`review:${r.id}:tip`} delay={320}>
            <NoteCard text={r.tip} icon={<Icon name="eclair" size={30} />} accent />
          </Appear>
          {r.links.map((line, i) => (
            <Appear key={line} once={`review:${r.id}:link:${i}`} delay={360 + i * 45}>
              <TipRow icon={<Glyph name="heart" size={18} color={color.rose} />} text={line} />
            </Appear>
          ))}
          {r.detailed ? (
            <>
              <NoteCard kicker={t.detailedAxes} text={r.detailed.axes.join('\n')} badge={<Chip label={t.plusChip} tone="violet" size="sm" />} />
              <NoteCard kicker={t.detailedLinks} text={r.detailed.links.join('\n')} />
            </>
          ) : me.data?.plus ? null : (
            <EntryCard
              left={<Glyph name="lock" size={22} color={color.violet} />}
              title={t.plusLead}
              text={t.plusText}
              chevron
              onPress={() => openPlus('detailed_review')}
              accessibilityLabel={t.plusA11y}
            />
          )}
          <Button label={t.all} variant="ghost" size="md" onPress={() => router.push('/pet/bilans')} />
        </Stack>
      </ScreenTemplate>
    </ScreenMotion>
  );
}
