/**
 * Après la sortie : 32 · Sortie vécue (V5-Souvenir) · 33 · Vote secret sur un écran (V5-Apres :
 * Amitié / Plus / Non, aucun état par défaut affiché) · 34 · Tes accords (V5-Apres-resultats,
 * « Partager la soirée » en action principale) · 34d · Pas d'accord cette fois (V5-Apres-aucun).
 * Jamais de compteur ni d'état de vote d'autrui ; seuls MES accords mutuels, à la clôture.
 */
import type { OutingVotesView, OutingView } from '@blowy/api-contract';
import type { VoteChoice } from '@blowy/domain';
import { BackButton, Blob, BodyText, Button, CardV5, DisplayText, Frame, GlassesTableArt, Glyph, Pill, PopIn, SecretNote, Sprite, Tap, v5, v5Alpha, v5Gradient, v5Portraits } from '@blowy/ui-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { dayLong, dayLongTime, dayShort, dayShortTime } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { useDuos } from '../../duos';
import { petSprite, useMyPet } from '../../pets';
import { LoadingScreen } from '../../system';
import { useOuting, useSubmitVotes, useVotes, useWeek } from '../api/hooks';
import { teamMates, weekdayLabel } from '../model/presenters';

const GRADIENTS = [v5Portraits.lea, v5Portraits.malo, v5Portraits.sarah, v5Portraits.tom, v5Portraits.jade] as const;
const gradientFor = (url: string | undefined, i: number): string => {
  const key = url?.startsWith('demo-portrait:') ? (url.slice(14) as keyof typeof v5Portraits) : null;
  const p = (key && v5Portraits[key]) ?? GRADIENTS[i % GRADIENTS.length]!;
  return `linear-gradient(160deg, ${p.from}, ${p.to})`;
};

/** Vignette « initiale sur dégradé » (listes de vote et de résultats). */
function Initial({ name, gradient, size, radius, font, border }: { name: string; gradient: string; size: number; radius: number; font: number; border?: boolean }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t('faces.a11y', { name })} style={{ width: size, height: size, borderRadius: radius, backgroundImage: gradient, alignItems: 'center', justifyContent: 'center', ...(border ? { borderWidth: 3, borderColor: v5.white } : null) }}>
      <DisplayText size={font} color={border ? v5Alpha.white80 : 'rgba(255,255,255,0.75)'} heading={false}>
        {name.charAt(0)}
      </DisplayText>
    </View>
  );
}

function useParamOuting() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return { id, outing: useOuting(id), votes: useVotes(id) };
}

// ---------------------------------------------------------------- 32 · Sortie vécue
export function MemoryScreen() {
  const { outing } = useParamOuting();
  const pet = useMyPet();
  if (outing.isLoading) return <LoadingScreen />;
  const o = outing.data;
  return (
    <Frame pad={[52, 20, 22]} gradient={v5Gradient.sunset} decor={<Blob size={300} top={120} left={-150} color={v5.sun} opacity={0.8} />} testID="memory">
      <PopIn style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {o ? <Pill label={`${dayLong(o.startsAt, undefined, true)}${o.venue ? ` · ${o.venue.name}` : ''}`} background={v5.ink} color={v5.sun} padding={[7, 12]} /> : null}
      </PopIn>
      <View style={{ marginTop: 10, height: 230, alignItems: 'center', justifyContent: 'center' }}>
        <Sprite path="effects/confetti.webp" size={280} style={{ position: 'absolute' }} />
        <GlassesTableArt petPath={petSprite(pet.data?.species ?? 'NINO')} />
      </View>
      <DisplayText size={50} style={{ marginTop: 6, textAlign: 'center' }}>
        {t('memory.title')}
      </DisplayText>
      <BodyText size={15} weight={700} align="center" style={{ marginTop: 8 }}>
        {t('memory.body', { pet: pet.data?.name ?? '' })}
      </BodyText>
      <View style={{ marginTop: 16, backgroundColor: v5.white, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 12, alignItems: 'center', boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.amber }] }}>
        <Glyph name="lock" size={22} color={v5.ink} color2={v5.white} />
        <BodyText size={13} weight={600} lh={1.4} style={{ flex: 1 }}>
          {t('memory.secret', { close: o ? dayShortTime(o.timeline.votesCloseAt) : '' })}
        </BodyText>
      </View>
      <View style={{ marginTop: 'auto', gap: 8 }}>
        <Button variant="b2" label={t('memory.vote')} icon="arrow" iconPosition="trailing" onPress={() => o && router.push(paths.outingStep(o.id, 'vote'))} testID="memory-vote" />
        <Tap onPress={() => router.push(paths.share('soiree'))} accessibilityRole="link" pressDepth={0} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Glyph name="share" size={16} />
          <BodyText size={14} weight={700}>
            {t('memory.share')}
          </BodyText>
        </Tap>
      </View>
    </Frame>
  );
}

// ---------------------------------------------------------------- 33 · Vote secret
const OPTIONS: { key: VoteChoice; bg: string; fg: string }[] = [
  { key: 'FRIEND', bg: v5.lime, fg: v5.ink },
  { key: 'PLUS', bg: v5.rose, fg: v5.white },
  { key: 'NO', bg: v5.ink, fg: v5.white },
];

export function VoteScreen() {
  const { id, outing, votes } = useParamOuting();
  if (outing.isLoading || votes.isLoading) return <LoadingScreen />;
  if (!outing.data || !votes.data) return <LoadingScreen />;
  return <VoteBody id={id} o={outing.data} v={votes.data} />;
}

function VoteBody({ id, o, v }: { id: string; o: OutingView; v: OutingVotesView }) {
  const submit = useSubmitVotes(id);
  // Aucun choix affiché par défaut (V5.3) : sans réponse, c'est « non », sans rien montrer.
  const [choices, setChoices] = useState<Record<string, VoteChoice>>({});
  const team = teamMates(o);
  return (
    <Frame pad={[50, 18, 28]} testID="vote">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={() => router.back()} label={t('common.back')} />
        <Pill label={t('vote.secretUntil', { close: dayShortTime(v.closesAt) })} background={v5.ink} color={v5.lime} padding={[7, 12]} leading={<Glyph name="lock" size={14} color={v5.lime} color2={v5.ink} />} style={{ marginLeft: 'auto' }} />
      </View>
      <DisplayText size={44} style={{ marginTop: 12 }}>
        {t('vote.title', { weekday: weekdayLabel(o.startsAt).toUpperCase() })}
      </DisplayText>
      <SecretNote strong={t('vote.plusStrong')} text={t('vote.plus')} style={{ marginTop: 8, alignItems: 'flex-start' }} glyphSize={20} padding={[10, 14]} />
      <View style={{ marginTop: 10, gap: 8 }}>
        {v.targets.map((p, i) => (
          <CardV5 key={p.userId} style={{ paddingTop: 6, paddingHorizontal: 12, paddingBottom: 10, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Initial name={p.firstName} gradient={gradientFor(p.photo?.url, i)} size={40} radius={13} font={20} />
              <BodyText size={17} weight={800}>
                {p.firstName}
              </BodyText>
              <Tap onPress={() => router.push({ pathname: paths.report, params: { outing: o.id, user: p.userId } } as never)} accessibilityRole="link" pressDepth={0} style={{ marginLeft: 'auto', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Glyph name="flag" size={14} color={v5.danger} />
                <BodyText size={12} weight={800} color={v5.danger}>
                  {t('vote.problem')}
                </BodyText>
              </Tap>
            </View>
            <View accessibilityRole="radiogroup" accessibilityLabel={t('vote.groupA11y', { name: p.firstName })} style={{ flexDirection: 'row', gap: 6 }}>
              {OPTIONS.map((opt) => {
                const on = choices[p.userId] === opt.key;
                return (
                  <Tap key={opt.key} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={t(`vote.${opt.key}`)} onPress={() => setChoices((c) => ({ ...c, [p.userId]: opt.key }))} style={{ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? opt.bg : v5.white, ...(on ? null : { boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.beige }] }) }}>
                    <BodyText size={13} weight={800} color={on ? opt.fg : v5.ink}>
                      {t(`vote.${opt.key}`)}
                    </BodyText>
                  </Tap>
                );
              })}
            </View>
          </CardV5>
        ))}
        {team.map((m) => (
          <View key={m.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: v5.peach, alignItems: 'center', justifyContent: 'center' }}>
              <Sprite path={petSprite(m.pet.species)} size={25} />
            </View>
            <BodyText size={13} weight={700} color={v5.inkSoft}>
              {t('vote.alreadyBand', { name: m.firstName ?? m.pet.name })}
            </BodyText>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 'auto', paddingTop: 10, gap: 14 }}>
        <Button variant="b2" label={t('vote.save')} loading={submit.isPending} onPress={() => submit.mutate(choices, { onSuccess: () => router.replace(paths.home) })} testID="vote-save" />
        <BodyText size={12} weight={600} color={v5.grey} align="center">
          {t('vote.editable', { close: dayShortTime(v.closesAt) })}
        </BodyText>
      </View>
    </Frame>
  );
}

// ---------------------------------------------------------------- 34 · Tes accords / aucun
export function ResultsScreen() {
  const { outing, votes } = useParamOuting();
  const week = useWeek();
  const duos = useDuos();
  const pet = useMyPet();
  if (outing.isLoading || votes.isLoading) return <LoadingScreen />;
  const v = votes.data;
  const o = outing.data;
  const mutual = (v?.targets ?? []).filter((x) => x.mutual);
  const close = v ? `${dayLongTime(v.closesAt, undefined, true)}` : '';
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <BackButton onPress={() => router.back()} label={t('common.back')} />
      <Pill label={close} background={v5.white} shadow={v5.shadowCream} padding={[7, 12]} style={{ marginLeft: 'auto' }} />
    </View>
  );
  if (!mutual.length) {
    return (
      <Frame pad={[52, 20, 22]} testID="results-none">
        {header}
        <Sprite path={petSprite(pet.data?.species ?? 'NINO')} size={130} style={{ marginTop: 24 }} />
        <DisplayText size={44} lineHeight={0.92} style={{ marginTop: 8 }}>
          {t('results.noneTitle')}
        </DisplayText>
        <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft} style={{ marginTop: 10 }}>
          {t('results.noneBody', { pet: pet.data?.name ?? '' })}
        </BodyText>
        <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft} style={{ marginTop: 10 }}>
          {t('results.nextWeek')}
        </BodyText>
        <View style={{ marginTop: 'auto', gap: 2 }}>
          {week.data?.myOutingId && week.data.myOutingId !== o?.id ? (
            <NextButton id={week.data.myOutingId} />
          ) : null}
          <Button variant="ghost" tint={v5.inkSoft} label={t('results.home')} onPress={() => router.replace(paths.home)} />
        </View>
      </Frame>
    );
  }
  const plus = mutual.find((x) => x.mutual === 'PLUS');
  const duoWithPlus = plus ? duos.data?.items.find((d) => d.other.firstName === plus.firstName) : undefined;
  return (
    <Frame pad={[52, 20, 22]} testID="results">
      {header}
      <DisplayText size={52} style={{ marginTop: 16 }}>
        {t('results.title')}
      </DisplayText>
      <BodyText size={14} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 6, marginBottom: 12 }}>
        {t('results.intro')}
      </BodyText>
      {mutual.map((m, i) => {
        const isPlus = m.mutual === 'PLUS';
        return (
          <PopIn key={m.userId} style={{ marginTop: i ? 10 : 0 }}>
            <View style={{ gap: 10, backgroundColor: isPlus ? v5.ink : v5.lime, borderRadius: 24, padding: 14, boxShadow: [{ offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: isPlus ? v5.black : v5.limeShadow }] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Initial name={m.firstName} gradient={gradientFor(m.photo?.url, i)} size={56} radius={18} font={28} border />
                <View style={{ gap: 3 }}>
                  <BodyText size={12} weight={800} ls={0.1} upper color={isPlus ? v5.lime : v5.limeDark}>
                    {isPlus ? t('results.plusBoth') : t('results.friend')}
                  </BodyText>
                  <DisplayText size={26} color={isPlus ? v5.white : v5.ink} heading={false}>
                    {m.firstName}
                  </DisplayText>
                </View>
              </View>
              <BodyText size={14} weight={600} lh={1.4} color={isPlus ? v5.white : v5.ink}>
                {isPlus ? t('results.plusBody') : t('results.friendBody', { name: m.firstName, venue: o?.venue?.name ?? '' })}
              </BodyText>
            </View>
          </PopIn>
        );
      })}
      {/* V5.4 §D19 : écrire à la personne de l'accord d'abord ; partager la soirée en second. */}
      <View style={{ marginTop: 'auto', gap: 2 }}>
        {plus && duoWithPlus ? <Button variant="b1" label={t('results.writeTo', { name: plus.firstName })} icon="arrow" iconPosition="trailing" onPress={() => router.push(paths.chat(duoWithPlus.conversationId))} testID="results-write" /> : <Button variant="b1" label={t('results.share')} onPress={() => router.push(paths.share('soiree'))} testID="results-share" />}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {plus && duoWithPlus ? (
            <View style={{ flex: 1 }}>
              <Button variant="ghost" tint={v5.ink} label={t('results.shareShort')} onPress={() => router.push(paths.share('soiree'))} testID="results-share" />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button variant="ghost" tint={v5.ink} label={t('results.bandGrows')} onPress={() => router.push(paths.share('dimanche'))} />
          </View>
        </View>
      </View>
    </Frame>
  );
}

function NextButton({ id }: { id: string }) {
  const next = useOuting(id);
  return <Button variant="b2" label={next.data ? t('results.seeNext', { day: dayShort(next.data.startsAt) }) : t('results.seeNextGeneric')} icon="arrow" iconPosition="trailing" onPress={() => router.push(paths.outing(id))} />;
}
