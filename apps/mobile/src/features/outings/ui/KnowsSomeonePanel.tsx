/**
 * « Je connais quelqu'un ici » (V5.6) : choix PRIVÉ de la personne, puis issue honnête
 * (déplacé·e vers un autre groupe, retiré·e remboursé·e, examen humain, sortie pour sécurité).
 */
import { BodyText, Button, CardV5, ChoicePills, SectionLabel, v5 } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ruleV57 } from '../../../core/content/rules';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useKnowsSomeone, useOuting } from '../api/hooks';
import { knowsOutcome } from '../model/knows';

export function KnowsSomeonePanel({ outingId }: { outingId: string }) {
  const q = useOuting(outingId);
  const send = useKnowsSomeone(outingId);
  const [who, setWho] = useState<string | null>(null);
  const people = (q.data?.members ?? []).filter((m) => !m.inMyTeam);
  const outcome = send.data ? knowsOutcome(send.data) : null;
  return (
    <CardV5 style={{ padding: 14, gap: 10 }}>
      <SectionLabel>{t('knows.title')}</SectionLabel>
      <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft}>
        {ruleV57('knows_someone')}
      </BodyText>
      {outcome ? (
        <View accessibilityLiveRegion="polite" style={{ gap: 8 }}>
          <BodyText size={14} weight={800}>
            {t(`knows.outcome.${outcome.kind}`)}
          </BodyText>
          {outcome.kind === 'moved' ? (
            <Button
              variant="b2"
              label={t('knows.openNew')}
              onPress={() => router.replace(paths.outing(outcome.newOutingId))}
            />
          ) : null}
        </View>
      ) : (
        <>
          {people.length ? (
            <ChoicePills
              label={t('knows.who')}
              options={people.map((m) => ({ key: m.userId, label: m.firstName ?? m.pet.name }))}
              value={who}
              onChange={setWho}
            />
          ) : (
            <BodyText size={13} weight={700} color={v5.inkSoft}>
              {t('knows.noFaces')}
            </BodyText>
          )}
          {send.isError ? (
            <BodyText size={13} weight={700} color={v5.danger} accessibilityLiveRegion="polite">
              {t('knows.failed')}
            </BodyText>
          ) : null}
          <Button
            variant="b2"
            label={t('knows.send')}
            disabled={!who}
            loading={send.isPending}
            onPress={() => who && send.mutate(who)}
          />
        </>
      )}
    </CardV5>
  );
}
