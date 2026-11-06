/**
 * Cartes de partage (V5-Partage-invitation / -confirmation / -checkin / V5-Partage (soirée) /
 * -dimanche / -ville), « Décris-moi en 3 mots » (V5-Story) et l'invitation reçue (V5-Invite).
 * Jamais de visage, de prénom ni de pet d'une autre personne ; l'invitation est personnelle
 * (lien de team à usage unique, par message seulement).
 */
import { BodyText, Button, CheckRowsArt, DetailScreen, DisplayText, Frame, Glyph, NoteCard, SecretEnvelopeArt, Switch, TableOfFiveArt, Pill, PopIn, ShareActions, ShareCard, ShareNotes, ShareScreen, Sprite, Tap, v5, v5Alpha, type ShareAction } from '@blowy/ui-mobile';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import { timeLabel, weekdayName } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { t, tDynamic, type TKey } from '../../../i18n';
import { useMe, useMyNeighborhood } from '../../account';
import { teamMates, useCreateTeam, useMyOuting } from '../../outings';
import { petSprite, useMyPet } from '../../pets';
import { useOnboarding } from '../../onboarding';
import { copyText, shareCardImage, shareText } from '../adapters/sharing';
import { useInvitePreview, useShareLink } from '../api/hooks';
import { isShareCard, newPeopleCount, SHARE_STYLES, type ShareCardKind } from '../model/cards';

const BACK: Record<ShareCardKind, (outingId?: string) => string> = {
  invitation: (id) => (id ? paths.outingStep(id, 'team') : paths.home),
  confirmation: (id) => (id ? paths.outingStep(id, 'confirmation') : paths.home),
  checkin: (id) => (id ? paths.outingStep(id, 'faces') : paths.home),
  jeudi: (id) => (id ? paths.outingStep(id, 'vote') : paths.home),
  bande: () => paths.band,
  soiree: (id) => (id ? paths.outingStep(id, 'memory') : paths.home),
  dimanche: (id) => (id ? paths.outingStep(id, 'results') : paths.home),
  ville: () => paths.waitlist,
};

/** « blowy.app/s/Zx9mQ4 ↗ » ; sans lien : « lien indisponible ». */
const linkLabel = (url: string | null | undefined) => (url ? `${url.replace(/^https?:\/\//, '')} ↗` : t('share5.noLink'));

function BandArt({ petPath }: { petPath: string }) {
  const face = (c: string, k: string) => (
    <View key={k} style={{ width: 54, height: 62, borderTopLeftRadius: 27, borderTopRightRadius: 27, borderBottomLeftRadius: 23, borderBottomRightRadius: 23, backgroundColor: c, marginHorizontal: -4, boxShadow: [{ offsetX: 0, offsetY: -8, blurRadius: 0, spreadDistance: 0, color: 'rgba(0,0,0,0.08)', inset: true }] }}>
      <View style={{ position: 'absolute', left: '28%', top: '34%', width: 8, height: 8, borderRadius: 4, backgroundColor: v5.ink }} />
      <View style={{ position: 'absolute', right: '28%', top: '34%', width: 8, height: 8, borderRadius: 4, backgroundColor: v5.ink }} />
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {face('#FFE36E', 'a')}
      {face(v5.lime, 'b')}
      <Sprite path={petPath} size={100} style={{ marginHorizontal: 4 }} />
      {face('#FFE36E', 'c')}
    </View>
  );
}

function TableArt() {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ width: 150, height: 96, backgroundColor: '#FF8A3C', borderRadius: 10, transform: [{ perspective: 300 }, { rotateX: '18deg' }], alignItems: 'center', justifyContent: 'center', boxShadow: [{ offsetX: 0, offsetY: 10, blurRadius: 0, spreadDistance: 0, color: '#B3541C' }] }}>
        <DisplayText size={30} color={v5.ink} heading={false}>
          Blowy
        </DisplayText>
      </View>
      <BodyText size={13} weight={700} color={v5.peach}>
        {t('share5.checkin.table')}
      </BodyText>
    </View>
  );
}

/** Contenu d'une carte (titre, texte, art) — partagé par l'écran de partage et les miniatures. */
function useShareModel(kind: ShareCardKind, when: 'week' | 'tomorrow' = 'week') {
  const my = useMyOuting();
  const pet = useMyPet();
  const hood = useMyNeighborhood();
  const st = SHARE_STYLES[kind];
  const o = my.outing.data;
  const species = pet.data?.species ?? 'NINO';
  const petName = pet.data?.name ?? tDynamic(`petName.${species}`);
  const size = o?.preview?.size ?? o?.capacity ?? 5;
  const mates = o ? teamMates(o).length : 0;
  const city = (hood.data?.neighborhood?.name ?? '').split(' ')[0] ?? '';

  const copy: { title: string; text: string; cta: string; notes: string[]; art: React.ReactNode } = (() => {
    switch (kind) {
      case 'invitation':
        return {
          title: o ? t('share5.invitation.title', { day: weekdayName(o.startsAt).toUpperCase() }) : t('share5.invitation.titleGeneric'),
          text: o ? t('share5.invitation.text', { day: weekdayName(o.startsAt, undefined, true), n: size, activity: tDynamic(`activity.${o.activity}`).toLowerCase(), hood: o.neighborhood.name }) : t('share5.invitation.textGeneric'),
          cta: o ? t('share5.invitation.cta', { day: weekdayName(o.startsAt) }) : t('share5.invitation.ctaGeneric'),
          notes: [t('share5.invitation.n1')],
          art: <CheckRowsArt rows={o ? [t('share5.invitation.r1', { when: `${weekdayName(o.startsAt, undefined, true)} ${timeLabel(o.startsAt)}` }), t('share5.invitation.r2'), t('share5.invitation.r3')] : [t('share5.invitation.r2'), t('share5.invitation.r3')]} />,
        };
      case 'confirmation':
        return { title: t(when === 'week' ? 'share5.confirmation.title' : 'share5.confirmation.titleTomorrow', { n: newPeopleCount(size, mates) }), text: t('share5.confirmation.text', { pet: petName }), cta: t('share5.confirmation.cta'), notes: [], art: <SecretEnvelopeArt label={t('share5.confirmation.secret')} /> };
      case 'checkin':
        return { title: t('share5.checkin.title'), text: t('share5.checkin.text'), cta: t('share5.checkin.cta'), notes: [t('share5.checkin.n1')], art: <TableArt /> };
      case 'soiree':
        return {
          title: t('share5.soiree.title', { n: size }),
          text: mates ? t('share5.soiree.textWithFriend', { n: newPeopleCount(size, mates) }) : t('share5.soiree.text', { n: newPeopleCount(size, mates) }),
          cta: t('share5.soiree.cta'),
          notes: [],
          art: <TableOfFiveArt label={t('share5.soiree.table', { n: size })} />,
        };
      case 'jeudi':
        return {
          title: t('share5.jeudi.title'),
          text: t('share5.jeudi.text'),
          cta: t('share5.jeudi.cta'),
          notes: [t('share5.capture')],
          art: (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 62, height: 46, borderRadius: 14, backgroundColor: v5.white, borderWidth: 3, borderStyle: 'dashed', borderColor: v5.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <BodyText size={22} weight={800}>
                    ?
                  </BodyText>
                </View>
              ))}
            </View>
          ),
        };
      case 'bande':
        return { title: t('share5.bande.title'), text: t('share5.bande.text'), cta: t('share5.bande.cta'), notes: [t('share5.capture')], art: <BandArt petPath={petSprite(species, 'leap')} /> };
      case 'dimanche':
        return { title: t('share5.dimanche.title'), text: t('share5.dimanche.text'), cta: t('share5.dimanche.cta'), notes: [t('share5.dimanche.n1'), t('share5.dimanche.n2')], art: <BandArt petPath={petSprite(species, 'leap')} /> };
      case 'ville':
        return {
          title: t('share5.ville.title', { city: city.toUpperCase() }),
          text: t('share5.ville.text'),
          cta: t('share5.ville.cta', { city }),
          notes: [t('share5.ville.n1'), t('share5.ville.n2')],
          art: (
            <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: v5Alpha.white18, alignItems: 'center', justifyContent: 'center' }}>
              <Glyph name="pin" size={64} color={v5.white} color2="#1C7DB0" />
            </View>
          ),
        };
    }
  })();
  return { st, o, city, copy };
}

/** Carte seule (aperçu plein format ou miniature). */
export function ShareCardFor({ kind, link, noLogo, when }: { kind: ShareCardKind; link: string; noLogo?: boolean; when?: 'week' | 'tomorrow' }) {
  const { st, copy } = useShareModel(kind, when);
  return <ShareCard gradient={st.gradient} dotColor={st.dot} title={copy.title} titleSize={st.titleSize} text={copy.text} art={copy.art} cta={copy.cta} ctaColor={st.ctaColor} noLogo={noLogo} link={link} ink={st.ink} darkTag={st.darkTag} a11yLabel={t('share5.preview', { title: copy.title })} />;
}

export function ShareCardScreen() {
  const { card } = useLocalSearchParams<{ card: string }>();
  const kind = isShareCard(card) ? card : null;
  const createTeam = useCreateTeam();
  const link = useShareLink(kind === 'invitation' ? null : kind);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [when, setWhen] = useState<'week' | 'tomorrow'>('week');
  const [noLogo, setNoLogo] = useState(false);
  const model = useShareModel(kind ?? 'confirmation', when);
  if (!kind) return <Redirect href={paths.home} />;
  const { st, o, city, copy } = model;
  const url = kind === 'invitation' ? invite : (link.data?.url ?? null);

  const ensureInvite = async (): Promise<string | null> => {
    if (invite) return invite;
    const r = await createTeam.mutateAsync().catch(() => null);
    setInvite(r?.inviteUrl ?? null);
    return r?.inviteUrl ?? null;
  };
  const message = async () => {
    const u = kind === 'invitation' ? await ensureInvite() : url;
    if (kind === 'invitation' && !u) return;
    await shareText(u ? `${copy.text}\n${u}` : copy.text);
  };
  const ACTION: Record<(typeof st.actions)[number], ShareAction> = {
    story: { key: 'story', glyph: 'phoneStory', label: t('share5.action.story'), onPress: () => void shareCardImage(ref) },
    message: { key: 'message', glyph: 'chat', label: t('share5.action.message'), onPress: () => void message() },
    save: { key: 'save', glyph: 'download', label: t('share5.action.save'), onPress: () => void shareCardImage(ref) },
    textLink: { key: 'textLink', glyph: 'link', label: t('share5.action.textLink'), onPress: () => void message(), disabled: !url },
    copy: { key: 'copy', glyph: 'link', label: copied ? t('share5.action.copied') : t('share5.action.copy'), onPress: () => void ensureInvite().then(async (u) => {
        if (u && (await copyText(u))) setCopied(true);
      }) },
  };
  return (
    <ShareScreen title={t(`share5.${kind}.header` as TKey, { city })} backLabel={t('common.back')} onBack={() => (router.canGoBack() ? router.back() : router.replace(BACK[kind](o?.id) as never))} testID={`share-${kind}`}>
      <PopIn>
        <View ref={ref} collapsable={false}>
          <ShareCard gradient={st.gradient} dotColor={st.dot} title={copy.title} titleSize={st.titleSize} text={copy.text} art={copy.art} cta={copy.cta} ctaColor={st.ctaColor} noLogo={noLogo} link={kind === 'invitation' && !invite ? t('share5.invitation.linkOnSend') : linkLabel(url)} ink={st.ink} darkTag={st.darkTag} a11yLabel={t('share5.preview', { title: copy.title })} />
        </View>
      </PopIn>
      {copy.notes.length ? <ShareNotes plain={kind === 'invitation' || kind === 'checkin' || kind === 'jeudi' || kind === 'bande'} lines={copy.notes} /> : null}
      {kind === 'confirmation' ? (
        <View style={{ marginTop: 10, flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          {(['week', 'tomorrow'] as const).map((w) => (
            <Tap key={w} onPress={() => setWhen(w)} accessibilityRole="radio" accessibilityState={{ checked: when === w }} pressDepth={0} style={{ minHeight: 44, paddingHorizontal: 18, borderRadius: 14, justifyContent: 'center', backgroundColor: when === w ? v5.lime : 'rgba(255,255,255,0.14)' }}>
              <BodyText size={13} weight={800} color={when === w ? v5.ink : v5.white}>
                {t(`share5.confirmation.${w}`)}
              </BodyText>
            </Tap>
          ))}
        </View>
      ) : null}
      {kind === 'soiree' ? (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <BodyText size={13} weight={800} color={v5.white}>
            {t('story3.noLogo')}
          </BodyText>
          <Switch value={noLogo} onValueChange={setNoLogo} accessibilityLabel={noLogo ? t('share5.noLogoOn') : t('share5.noLogoOff')} />
        </View>
      ) : null}
      <ShareActions actions={st.actions.map((a) => ACTION[a])} />
    </ShareScreen>
  );
}

// ---------------------------------------------------------------- Décris-moi en 3 mots
const EXAMPLE_WORDS = ['DROLE', 'LOYAL'] as const;

export function StoryScreen() {
  const me = useMe();
  const link = useShareLink('confirmation');
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [noLogo, setNoLogo] = useState(false);
  const name = me.data?.displayName ?? '';
  const url = link.data?.url ?? null;
  const chip = (label: string, s: object) => (
    <View style={[{ position: 'absolute', backgroundColor: v5.white, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 }, s]}>
      <BodyText size={15} weight={800}>
        {label}
      </BodyText>
    </View>
  );
  return (
    <ShareScreen title={t('story3.header')} backLabel={t('common.back')} onBack={() => (router.canGoBack() ? router.back() : router.replace(paths.profile))} pad={[52, 16, 16]} testID="story">
      <PopIn>
        <View ref={ref} collapsable={false} style={{ marginTop: 12, alignSelf: 'center', width: 290, height: 516, borderRadius: 26, overflow: 'hidden', backgroundImage: 'linear-gradient(170deg, #16110D, #4C1D95 60%, #C2185B)', paddingVertical: 18, paddingHorizontal: 16 }} accessible accessibilityRole="image" accessibilityLabel={t('story3.title')}>
          {noLogo ? (
            <View style={{ height: 20 }} />
          ) : (
            <DisplayText size={20} color={v5.white} heading={false}>
              blowy
              <DisplayText size={20} color={v5.mango} heading={false}>
                .
              </DisplayText>
            </DisplayText>
          )}
          <DisplayText size={42} lineHeight={0.9} color={v5.white} heading={false} style={{ marginTop: 14 }}>
            {t('story3.title')}
          </DisplayText>
          <BodyText size={14} weight={700} lh={1.4} color={v5.white} style={{ marginTop: 10 }}>
            {t('story3.text')}
          </BodyText>
          <View style={{ flex: 1 }}>
            {chip(t(`words.${EXAMPLE_WORDS[0]}`), { left: 20, top: 10, transform: [{ rotate: '-6deg' }] })}
            {chip(t(`words.${EXAMPLE_WORDS[1]}`), { left: 196, top: 30, transform: [{ rotate: '5deg' }] })}
            {chip('…', { left: 60, top: 92, transform: [{ rotate: '3deg' }] })}
            <Sprite path="nino/young/dance.webp" size={130} style={{ position: 'absolute', right: 0, bottom: 0 }} />
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: v5.white, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, transform: [{ rotate: '-2deg' }] }}>
            <BodyText size={12} weight={800} color={v5.coralText}>
              {t('story3.for', { name })}
            </BodyText>
            <DisplayText size={17} heading={false}>
              {linkLabel(url)}
            </DisplayText>
          </View>
        </View>
      </PopIn>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        <Tap onPress={() => setNoLogo(!noLogo)} accessibilityRole="switch" accessibilityState={{ checked: noLogo }} pressDepth={0} style={{ minHeight: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: noLogo ? v5.white : 'rgba(255,255,255,0.14)', justifyContent: 'center' }}>
          <BodyText size={13} weight={800} color={noLogo ? v5.ink : v5.white}>
            {t('story3.noLogo')}
          </BodyText>
        </Tap>
        <Tap onPress={() => router.push(paths.share('confirmation'))} accessibilityRole="link" pressDepth={0} style={{ minHeight: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center' }}>
          <BodyText size={13} weight={800} color={v5.white}>
            {t('story3.others')}
          </BodyText>
        </Tap>
      </View>
      <ShareActions
        actions={[
          { key: 'story', glyph: 'phoneStory', label: t('share5.action.story'), onPress: () => void shareCardImage(ref) },
          { key: 'message', glyph: 'chat', label: t('share5.action.message'), onPress: () => void shareText(url ? `${t('story3.title')}\n${url}` : t('story3.title')), disabled: !url },
          { key: 'save', glyph: 'download', label: t('share5.action.save'), onPress: () => void shareCardImage(ref) },
          { key: 'copy', glyph: 'link', label: t('share5.action.copy'), onPress: () => void (url && copyText(url)), disabled: !url },
        ]}
      />
      <BodyText size={12} weight={600} color={v5.mist} align="center" style={{ marginTop: 6 }}>
        {t('story3.footer')}
      </BodyText>
    </ShareScreen>
  );
}

// ---------------------------------------------------------------- Invitation reçue
export function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const patchDraft = useOnboarding((s) => s.patch);
  const preview = useInvitePreview(code);
  const name = preview.data?.valid ? preview.data.inviter?.displayName : undefined;
  const accept = () => {
    patchDraft({ inviteRef: code ?? null });
    router.replace(paths.onboarding('city'));
  };
  return (
    <Frame pad={[56, 20, 22]} testID="invite">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <DisplayText size={28}>
          blowy
          <DisplayText size={28} color={v5.coralBright} heading={false}>
            .
          </DisplayText>
        </DisplayText>
        <Pill label={t('invite5.chip')} background={v5.ink} color={v5.lime} padding={[7, 12]} />
      </View>
      <DisplayText size={46} lineHeight={0.9} style={{ marginTop: 6 }}>
        {name ? t('invite5.titleNamed', { name: name.toUpperCase() }) : t('invite5.title')}
      </DisplayText>
      <NoteCard tone="light" style={{ marginTop: 14 }} lines={[t('invite5.l1'), t('invite5.l2'), t('invite5.l3')]} />
      <View style={{ marginTop: 'auto', gap: 2 }}>
        <Button variant="b1" label={name ? t('invite5.comeWith', { name }) : t('invite5.come')} icon="arrow" iconPosition="trailing" onPress={accept} testID="invite-accept" />
        <Button variant="ghost" tint={v5.inkSoft} label={t('invite5.no')} onPress={() => router.replace(paths.welcome)} />
      </View>
    </Frame>
  );
}

// ---------------------------------------------------------------- Mes cartes (galerie)
const CARDS: { key: string; gradient: string; href: () => string }[] = [
  { key: 'confirmation', gradient: 'linear-gradient(170deg, #16110D, #2E1065)', href: () => paths.share('confirmation') },
  { key: 'checkin', gradient: 'linear-gradient(170deg, #0E5E5A, #16110D)', href: () => paths.share('checkin') },
  { key: 'jeudi', gradient: 'linear-gradient(170deg, #FFE36E, #FFB347)', href: () => paths.share('jeudi') },
  { key: 'soiree', gradient: 'linear-gradient(170deg, #C2185B, #FF8A3C)', href: () => paths.share('soiree') },
  { key: 'dimanche', gradient: 'linear-gradient(170deg, #1E7A47, #3F5A0B)', href: () => paths.share('dimanche') },
  { key: 'bande', gradient: 'linear-gradient(170deg, #BFE8F7, #DDF5EA)', href: () => paths.share('bande') },
  { key: 'ville', gradient: 'linear-gradient(170deg, #0E4C6E, #1C7DB0)', href: () => paths.share('ville') },
  { key: 'story', gradient: 'linear-gradient(170deg, #4C1D95, #C2185B)', href: () => paths.story },
  { key: 'invitation', gradient: 'linear-gradient(170deg, #FFF7EC, #FFD9A8)', href: () => paths.share('invitation') },
];

export function CardsScreen() {
  const rows: (typeof CARDS)[] = [];
  CARDS.forEach((c, i) => (i % 4 === 0 ? rows.push([c]) : rows[rows.length - 1]!.push(c)));
  return (
    <DetailScreen title={t('cards5.title')} titleSize={40} backLabel={t('common.back')} onBack={() => (router.canGoBack() ? router.back() : router.replace(paths.profile))} pad={[52, 16, 22]} gap={10} testID="cards">
      <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft}>
        {t('cards5.intro')}
      </BodyText>
      <View style={{ gap: 8 }}>
        {rows.map((row) => (
          <View key={row[0]!.key} style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2, 3].map((i) => {
              const c = row[i];
              if (!c) return <View key={i} style={{ flex: 1 }} />;
              return (
                <Tap key={c.key} onPress={() => router.push(c.href() as never)} accessibilityRole="link" accessibilityLabel={`${t(`cards5.${c.key}.t` as TKey)}, ${t(`cards5.${c.key}.s` as TKey)}`} pressDepth={0} style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View style={{ width: 78, height: 126, borderRadius: 10, overflow: 'hidden', backgroundImage: c.gradient, boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream }] }}>
                    {c.key !== 'story' ? (
                      <View style={{ width: 290, transform: [{ translateX: -105.85 }, { translateY: -171.55 }, { scale: 0.27 }] }} pointerEvents="none">
                        <ShareCardFor kind={c.key as ShareCardKind} link={linkLabel(null)} />
                      </View>
                    ) : null}
                  </View>
                  <BodyText size={12} weight={800} lh={1.2}>
                    {t(`cards5.${c.key}.t` as TKey)}
                  </BodyText>
                  <BodyText size={11} weight={600} color={v5.inkSoft}>
                    {t(`cards5.${c.key}.s` as TKey)}
                  </BodyText>
                </Tap>
              );
            })}
          </View>
        ))}
      </View>
    </DetailScreen>
  );
}
