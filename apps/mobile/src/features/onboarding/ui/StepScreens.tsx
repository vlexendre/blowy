/**
 * Étapes 1/9 → 9/9 de l'onboarding V5.3 (V5-Ville … V5-Dispos) + Moins de 18 ans (V5-Erreur-age).
 * Une question par écran ; le brouillon reste sur l'appareil jusqu'au compte (rien n'est envoyé
 * avant). Composition : gabarit `StepScreen` + molécules de @blowy/ui-mobile.
 */
import type { Gender, LookingFor, MeetingMode, Species } from '@blowy/domain';
import { BackButton, bodyFont, BodyText, Button, CheckLine, ChoiceCard, DisplayText, FieldFrame, Frame, Glyph, PopIn, Row, RowGroup, SecretNote, SectionLabel, Sprite, StepScreen, StepTag, Tap, v5 } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useNow } from '../../../core/clock';
import { paths } from '../../../core/navigation/paths';
import { t, tDynamic } from '../../../i18n';
import { SPECIES_CHOICES } from '../../pets';
import { useNeighborhoodSearch } from '../api/hooks';
import { isAnswered, isMinor, nextStep, parseBirthDate, previousStep, SLOT_KEYS, STEP_NUMBER, STEP_TOTAL, TRAVEL_CHOICES, type OnboardingStep } from '../model/flow';
import { useOnboarding } from '../model/store';
import { useDevicePrefs } from '../../settings';

type Step = Exclude<OnboardingStep, 'welcome'>;

function useStep(step: Step) {
  const draft = useOnboarding();
  const now = useNow();
  const go = (to: OnboardingStep | 'found') => {
    if (to === 'found') {
      draft.patch({ step: 'slots', completed: true });
      // V5.4 §A6 : « Éviter les personnes que je connais » proposé avant la 1ʳᵉ composition.
      router.push(useDevicePrefs.getState().avoidAsked ? paths.found : ({ pathname: paths.avoid, params: { from: 'onboarding' } } as never));
      return;
    }
    draft.patch({ step: to });
    router.push(paths.onboarding(to));
  };
  return {
    draft,
    ready: isAnswered(step, draft, now),
    common: {
      step: STEP_NUMBER[step],
      total: STEP_TOTAL,
      stepLabel: t(`onb.${step}.tag`),
      stepA11y: t('onb.stepA11y', { n: STEP_NUMBER[step], total: STEP_TOTAL, label: t(`onb.${step}.tag`) }),
      backLabel: t('common.back'),
      onBack: () => {
        const prev = previousStep(step, draft);
        if (router.canGoBack()) router.back();
        else router.replace(paths.onboarding(prev ?? 'welcome'));
      },
    },
    next: () => go(nextStep(step, draft)),
    now,
  };
}

/** Pied « Continuer → » ou bouton inactif `.bdis` avec la consigne. */
function Next({ ready, onPress, idle, testID }: { ready: boolean; onPress: () => void; idle: string; testID?: string }) {
  return ready ? <Button variant="b1" label={t('common.continue')} icon="arrow" iconPosition="trailing" onPress={onPress} testID={testID ?? 'step-next'} /> : <Button variant="bdis" label={idle} testID="step-idle" />;
}

// ---------------------------------------------------------------- 1/9 Ville
export function CityScreen() {
  const { draft, ready, common, next } = useStep('city');
  const [q, setQ] = useState(draft.city.query);
  const search = useNeighborhoodSearch(q);
  const items = search.data?.items ?? [];
  const chosen = items.find((n) => n.id === draft.city.neighborhoodId);
  const waitlist = chosen ? chosen.status !== 'LIVE' : draft.city.live === false;
  return (
    <StepScreen
      {...common}
      testID="onb-city"
      title={t('onb.city.title')}
      titleSize={50}
      titleLineHeight={0.95}
      titleMarginTop={18}
      intro={t('onb.city.intro')}
      introColor={v5.grey}
      introMarginTop={6}
      footer={<Next ready={ready} onPress={next} idle={t('onb.city.idle')} />}
    >
      <PopIn delayMs={100} style={{ marginTop: 14 }}>
        <FieldFrame>
          <Glyph name="pin" size={18} />
          <TextInput
            value={q}
            onChangeText={(v) => {
              setQ(v);
              draft.patch({ city: { query: v, neighborhoodId: null, name: null, live: null } });
            }}
            accessibilityLabel={t('onb.city.inputA11y')}
            placeholder={t('onb.city.placeholder')}
            autoCorrect={false}
            style={{ height: 44, flex: 1, minWidth: 0, ...bodyFont(17, 700), color: v5.ink, padding: 0 }}
          />
        </FieldFrame>
      </PopIn>
      {waitlist && chosen ? (
        <PopIn delayMs={120} style={{ marginTop: 14, backgroundColor: v5.ink, borderRadius: 24, padding: 16, gap: 8 }}>
          <DisplayText size={26} color={v5.white} heading={false}>
            {t('onb.city.waitTitle', { city: chosen.city })}
          </DisplayText>
          <BodyText size={14} weight={600} lh={1.45} color={v5.sandDeep}>
            {t('onb.city.waitBody')}
          </BodyText>
        </PopIn>
      ) : items.length ? (
        <PopIn delayMs={120} style={{ marginTop: 10 }}>
          <RowGroup>
            {items.slice(0, 4).map((n, i) => {
              const on = n.id === draft.city.neighborhoodId;
              const live = n.status === 'LIVE';
              return (
                <Row
                  key={n.id}
                  first={i === 0}
                  minHeight={58}
                  background={on ? v5.limePale : v5.white}
                  label={n.name}
                  sub={live ? t('onb.city.live') : t('onb.city.waitlist')}
                  subColor={live ? v5.green : v5.grey}
                  leading={<Glyph name="pin" size={18} color={on ? v5.limeDark : v5.grey} />}
                  trailing={on ? <Glyph name="check" size={16} color={v5.green} /> : undefined}
                  onPress={() => draft.patch({ city: { query: q, neighborhoodId: n.id, name: n.name, live } })}
                />
              );
            })}
          </RowGroup>
        </PopIn>
      ) : null}
      {!waitlist ? (
        <BodyText size={13} weight={600} color={v5.inkSoft} style={{ marginTop: 14 }}>
          {t('onb.city.travelHint')}
        </BodyText>
      ) : null}
    </StepScreen>
  );
}

// ---------------------------------------------------------------- 2/9 Date de naissance
function DateField({ label, placeholder, value, onChange, flex, a11y }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; flex: number; a11y: string }) {
  return (
    <View style={{ flex, minHeight: 64, borderRadius: 16, borderWidth: 2, borderColor: v5.ink, backgroundColor: v5.white, justifyContent: 'center', paddingHorizontal: 12, boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.ink }] }}>
      <BodyText size={11} weight={800} color={v5.inkSoft}>
        {label}
      </BodyText>
      <TextInput value={value} onChangeText={(v) => onChange(v.replace(/\D/g, ''))} inputMode="numeric" accessibilityLabel={a11y} placeholder={placeholder} placeholderTextColor={v5.grey} style={{ height: 30, padding: 0, ...bodyFont(18, 700), color: v5.ink }} />
    </View>
  );
}

export function BirthdateScreen() {
  const { draft, ready, common, next, now } = useStep('birthdate');
  const b = draft.birthDate;
  const set = (k: 'day' | 'month' | 'year', max: number) => (v: string) => draft.patch({ birthDate: { ...b, [k]: v.slice(0, max) } });
  const onNext = () => {
    const iso = parseBirthDate(b);
    if (iso && isMinor(iso, now)) {
      // Moins de 18 ans : la saisie est effacée de l'appareil (rien n'a été envoyé).
      draft.reset();
      router.replace(paths.ageBlocked);
      return;
    }
    next();
  };
  return (
    <StepScreen {...common} testID="onb-birthdate" title={t('onb.birthdate.title')} titleSize={44} intro={t('onb.birthdate.intro')} footer={ready ? <Next ready onPress={onNext} idle="" /> : <Button variant="bdis" label={t('onb.birthdate.idle')} />}>
      <View style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}>
        <DateField label={t('onb.birthdate.day')} placeholder="JJ" a11y={t('onb.birthdate.day')} value={b.day} onChange={set('day', 2)} flex={1} />
        <DateField label={t('onb.birthdate.month')} placeholder="MM" a11y={t('onb.birthdate.month')} value={b.month} onChange={set('month', 2)} flex={1} />
        <DateField label={t('onb.birthdate.year')} placeholder="AAAA" a11y={t('onb.birthdate.year')} value={b.year} onChange={set('year', 4)} flex={1.4} />
      </View>
    </StepScreen>
  );
}

// ---------------------------------------------------------------- 3/9 Tu es…
const GENDER_OPTIONS: readonly Gender[] = ['WOMAN', 'MAN', 'NON_BINARY', 'UNDISCLOSED'];

export function GenderScreen() {
  const { draft, ready, common, next } = useStep('gender');
  return (
    <StepScreen {...common} testID="onb-gender" title={t('onb.gender.title')} titleSize={42} intro={t('onb.gender.intro')} footer={<Next ready={ready} onPress={next} idle={t('onb.chooseOne')} />}>
      <View accessibilityRole="radiogroup" style={{ marginTop: 14, gap: 8 }}>
        {GENDER_OPTIONS.map((g) => (
          <ChoiceCard key={g} title={tDynamic(`onb.gender.options.${g}.t`)} sub={tDynamic(`onb.gender.options.${g}.s`)} selected={draft.gender === g} onPress={() => draft.patch({ gender: g })} testID={`gender-${g}`} />
        ))}
      </View>
      <BodyText size={12} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('onb.gender.note')}
      </BodyText>
    </StepScreen>
  );
}

// ---------------------------------------------------------------- 4/9 Ton pet
export function PetScreen() {
  const { draft, ready, common, next } = useStep('pet');
  return (
    <StepScreen {...common} testID="onb-pet" title={t('onb.pet.title')} titleSize={44} intro={t('onb.pet.intro')} footer={<Next ready={ready} onPress={next} idle={t('onb.pet.idle')} />}>
      <View accessibilityRole="radiogroup" style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SPECIES_CHOICES.map((s) => {
          const on = draft.species === s.key;
          return (
            <Tap
              key={s.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: !s.available }}
              accessibilityLabel={s.available ? tDynamic(`species5.${s.key}`) : t('onb.pet.soon', { name: tDynamic(`species5.${s.key}`) })}
              onPress={s.available ? () => draft.patch({ species: s.key as Species }) : undefined}
              testID={`species-${s.key}`}
              style={{ width: 111.33, alignItems: 'center', gap: 4, paddingVertical: 8, minHeight: 112, borderRadius: 20, backgroundColor: on ? v5.ink : v5.white, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: on ? v5.black : v5.shadowCream }] }}
            >
              <Sprite path={s.sprite} size={72} />
              <BodyText size={13} weight={800} color={on ? v5.white : v5.ink}>
                {tDynamic(`species5.${s.key}`)}
              </BodyText>
            </Tap>
          );
        })}
      </View>
      <Button
        variant="ghost"
        label={t('onb.pet.random')}
        onPress={() => {
          const pool = SPECIES_CHOICES.filter((c) => c.available);
          draft.patch({ species: pool[new Date().getSeconds() % pool.length]!.key as Species });
        }}
      />
    </StepScreen>
  );
}

// ---------------------------------------------------------------- 5/9 Rencontrer
const MEET_OPTIONS: readonly MeetingMode[] = ['GROUP', 'DUO', 'BOTH'];

export function MeetScreen() {
  const { draft, ready, common, next } = useStep('meet');
  return (
    <StepScreen {...common} testID="onb-meet" title={t('onb.meet.title')} titleSize={42} footer={<Next ready={ready} onPress={next} idle={t('onb.chooseOne')} />}>
      <View accessibilityRole="radiogroup" style={{ marginTop: 14, gap: 8 }}>
        {MEET_OPTIONS.map((m) => (
          <ChoiceCard key={m} title={tDynamic(`onb.meet.options.${m}.t`)} sub={tDynamic(`onb.meet.options.${m}.s`)} selected={draft.meetingMode === m} onPress={() => draft.patch({ meetingMode: m })} testID={`meet-${m}`} />
        ))}
      </View>
      <BodyText size={12} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('onb.meet.note')}
      </BodyText>
    </StepScreen>
  );
}

// ---------------------------------------------------------------- 6/9 Tu cherches
const LOOKING_OPTIONS: readonly LookingFor[] = ['FRIENDS', 'STORY', 'BOTH'];

export function LookingScreen() {
  const { draft, ready, common, next } = useStep('looking');
  return (
    <StepScreen {...common} testID="onb-looking" title={t('onb.looking.title')} titleSize={42} footer={<Next ready={ready} onPress={next} idle={t('onb.chooseOne')} />}>
      <View accessibilityRole="radiogroup" style={{ marginTop: 14, gap: 8 }}>
        {LOOKING_OPTIONS.map((l) => (
          <ChoiceCard key={l} title={tDynamic(`onb.looking.options.${l}.t`)} sub={tDynamic(`onb.looking.options.${l}.s`)} selected={draft.lookingFor === l} onPress={() => draft.patch({ lookingFor: l, sensitiveConsent: l === 'FRIENDS' ? null : draft.sensitiveConsent })} testID={`looking-${l}`} />
        ))}
      </View>
      <SecretNote strong={t('onb.looking.secretStrong')} text={t('onb.looking.secret')} style={{ marginTop: 12 }} />
    </StepScreen>
  );
}

// ---------------------------------------------------------------- 7/9 Consentement art. 9
export function ConsentScreen() {
  const { draft, common } = useStep('consent');
  const choose = (yes: boolean) => {
    draft.patch({ sensitiveConsent: yes, step: yes ? 'story' : 'slots', ...(yes ? null : { romanceGenders: [] }) });
    router.push(paths.onboarding(yes ? 'story' : 'slots'));
  };
  return (
    <Frame pad={[52, 20, 22]} testID="onb-consent">
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={common.onBack} label={common.backLabel} />
        <StepTag step={common.step} total={common.total} label={common.stepLabel} accessibilityLabel={common.stepA11y} />
      </PopIn>
      <View style={{ marginTop: 16, width: 60, height: 60, borderRadius: 20, backgroundColor: v5.ink, alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name="lock" size={32} color={v5.lime} color2={v5.ink} />
      </View>
      <DisplayText size={40} lineHeight={0.92} style={{ marginTop: 14 }}>
        {t('onb.consent.title')}
      </DisplayText>
      <BodyText size={14} weight={600} lh={1.5} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {t('onb.consent.intro')}
      </BodyText>
      <View style={{ marginTop: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: v5.white, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
        <Glyph name="lock" size={22} color={v5.ink} color2={v5.white} />
        <View style={{ flex: 1, gap: 5 }}>
          {(['l1', 'l2', 'l3', 'l4'] as const).map((k) => (
            <CheckLine key={k} text={t(`onb.consent.${k}`)} />
          ))}
        </View>
      </View>
      <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button variant="b3" size="sm" label={t('onb.consent.accept')} onPress={() => choose(true)} testID="consent-yes" />
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="b3" size="sm" label={t('onb.consent.friendsOnly')} onPress={() => choose(false)} testID="consent-no" />
        </View>
      </View>
      <BodyText size={12} weight={600} color={v5.inkSoft} align="center" style={{ marginTop: 10 }}>
        {t('onb.consent.note')}
      </BodyText>
    </Frame>
  );
}


// ---------------------------------------------------------------- 8/9 Pour une histoire
const ROMANCE_OPTIONS: readonly Gender[] = ['WOMAN', 'MAN', 'NON_BINARY'];

export function StoryScreen() {
  const { draft, ready, common, next } = useStep('story');
  const toggle = (g: Gender) => draft.patch({ romanceGenders: draft.romanceGenders.includes(g) ? draft.romanceGenders.filter((x) => x !== g) : [...draft.romanceGenders, g] });
  return (
    <StepScreen {...common} testID="onb-story" title={t('onb.story.title')} titleSize={40} intro={t('onb.story.intro')} introColor={v5.grey} footer={<Next ready={ready} onPress={next} idle={t('onb.chooseOne')} />}>
      <View style={{ marginTop: 14, gap: 10 }}>
        {ROMANCE_OPTIONS.map((g) => {
          const on = draft.romanceGenders.includes(g);
          return (
            <Tap key={g} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={tDynamic(`onb.story.options.${g}`)} onPress={() => toggle(g)} testID={`romance-${g}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 16, borderRadius: 18, backgroundColor: on ? v5.ink : v5.white, boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
              <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2.5, borderColor: on ? v5.lime : v5.greyWarm, backgroundColor: on ? v5.lime : v5.white, alignItems: 'center', justifyContent: 'center' }}>{on ? <Glyph name="check" size={14} color={v5.ink} strokeWidth={2.8} /> : null}</View>
              <DisplayText size={21} color={on ? v5.white : v5.ink} heading={false}>
                {tDynamic(`onb.story.options.${g}`)}
              </DisplayText>
            </Tap>
          );
        })}
      </View>
      <View style={{ marginTop: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: v5.ink, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 }}>
        <Glyph name="lock" size={22} color={v5.lime} color2={v5.ink} />
        <View style={{ flex: 1, gap: 5 }}>
          <CheckLine text={t('onb.story.l1')} color={v5.sandDeep} checkColor={v5.lime} />
          <CheckLine text={t('onb.story.l2')} color={v5.sandDeep} checkColor={v5.lime} />
        </View>
      </View>
    </StepScreen>
  );
}

// ---------------------------------------------------------------- 9/9 Créneaux
export function SlotsScreen() {
  const { draft, ready, common, next } = useStep('slots');
  const toggle = (k: (typeof SLOT_KEYS)[number]) => draft.patch({ slots: draft.slots.includes(k) ? draft.slots.filter((x) => x !== k) : [...draft.slots, k] });
  return (
    <StepScreen
      {...common}
      testID="onb-slots"
      title={t('onb.slots.title')}
      titleSize={40}
      titleMarginTop={14}
      footer={<Next ready={ready} onPress={next} idle={t('onb.slots.idle')} testID="slots-next" />}
    >
      <BodyText size={13} weight={600} lh={1.4} color={v5.inkSoft} style={{ marginTop: 6 }}>
        {t('onb.slots.intro')}
      </BodyText>
      <View style={{ marginTop: 10, gap: 6 }}>
        {SLOT_KEYS.map((k) => {
          const on = draft.slots.includes(k);
          return (
            <Tap key={k} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${tDynamic(`onb.slots.options.${k}.t`)}, ${tDynamic(`onb.slots.options.${k}.h`)}`} onPress={() => toggle(k)} testID={`slot-${k}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 14, borderRadius: 16, backgroundColor: on ? v5.ink : v5.white, boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
              <CheckBox on={on} />
              <BodyText size={15} weight={800} color={on ? v5.white : v5.ink}>
                {tDynamic(`onb.slots.options.${k}.t`)}
              </BodyText>
              <BodyText size={12} weight={600} color={on ? v5.mist : v5.inkSoft} style={{ marginLeft: 'auto' }}>
                {tDynamic(`onb.slots.options.${k}.h`)}
              </BodyText>
            </Tap>
          );
        })}
      </View>
      <Tap accessibilityRole="checkbox" accessibilityState={{ checked: draft.weeksOff }} accessibilityLabel={t('onb.slots.weeksOff')} onPress={() => {
          draft.patch({ weeksOff: !draft.weeksOff });
          if (!draft.weeksOff) router.push({ pathname: paths.weeks, params: { from: 'onboarding' } } as never);
        }} pressDepth={0} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 4 }}>
        <CheckBox on={draft.weeksOff} offBorder={v5.greyWarm} onBorder={v5.ink} />
        <BodyText size={14} weight={700} style={{ flexShrink: 1 }}>
          {t('onb.slots.weeksOff')}
        </BodyText>
      </Tap>
      <SectionLabel style={{ marginTop: 6 }}>{t('onb.slots.travelLabel')}</SectionLabel>
      <View accessibilityRole="radiogroup" style={{ marginTop: 6, flexDirection: 'row', gap: 6 }}>
        {TRAVEL_CHOICES.map((m) => {
          const on = draft.travel === m;
          // 15 min : affiché par la maquette, absent du contrat (`TRAVEL_MINUTES` = 20/30/45).
          const allowed = m !== 15;
          return (
            <Tap key={m} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: !allowed }} accessibilityLabel={allowed ? t('onb.slots.travel', { m }) : t('onb.slots.travelSoon', { m })} onPress={allowed ? () => draft.patch({ travel: m }) : undefined} style={{ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? v5.ink : v5.white, boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
              <BodyText size={13} weight={800} color={on ? v5.white : v5.ink} nowrap>
                {t('onb.slots.travel', { m })}
              </BodyText>
            </Tap>
          );
        })}
      </View>
    </StepScreen>
  );
}

function CheckBox({ on, onBorder = v5.lime, offBorder = v5.greyWarm }: { on: boolean; onBorder?: string; offBorder?: string }) {
  return (
    <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2.5, borderColor: on ? onBorder : offBorder, backgroundColor: on ? v5.lime : v5.white, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {on ? <Glyph name="check" size={13} color={v5.ink} strokeWidth={2.8} /> : null}
    </View>
  );
}

// ---------------------------------------------------------------- Moins de 18 ans
export function AgeBlockedScreen() {
  useEffect(() => {
    useOnboarding.getState().reset();
  }, []);
  return (
    <Frame pad={[52, 20, 22]} testID="onb-age">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={() => router.replace(paths.onboarding('welcome'))} label={t('onb.age.back')} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
        <Sprite path="nino/young/presentation.webp" size={120} />
        <DisplayText size={42} lineHeight={0.92}>
          {t('onb.age.title')}
        </DisplayText>
        <BodyText size={15} weight={600} lh={1.5} color={v5.inkSoft}>
          {t('onb.age.body')}
        </BodyText>
      </View>
      <View style={{ gap: 4 }}>
        <Button variant="b2" label={t('onb.age.ok')} onPress={() => router.replace(paths.onboarding('welcome'))} />
        <Button variant="ghost" tint={v5.inkSoft} label={t('onb.age.retry')} />
      </View>
    </Frame>
  );
}
