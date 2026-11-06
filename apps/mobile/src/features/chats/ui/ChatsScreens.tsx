/**
 * 20 · Chats (V5-Chats) · 59 · Chats vides (V5-Chats-vide) · 21 · Chat du groupe (V5-Groupe)
 * · 21b · Signaler, bloquer, quitter (V5-Groupe-menu) · 40 · Duo après une sortie (V5-Chat).
 * Conversations V5 : OUTING (groupe pré-sortie), BAND (bande), DUO. Aucun numéro ni réseau avant
 * la sortie ; messages modérés. Le contrat `MessageView` ne porte pas l'auteur : les messages des
 * autres sont affichés sans attribution (écart API documenté).
 */
import type { ConversationView, DuoView, MessageView, OutingView } from '@blowy/api-contract';
import {
  BodyText,
  BottomSheet,
  Bubble,
  Button,
  ChatListCard,
  ChatScreen,
  ComposerBar,
  DisplayText,
  Glyph,
  IconAction,
  MemberChip,
  Pill,
  PetMosaic,
  PetTile,
  Portrait,
  Row,
  RowGroup,
  SectionLabel,
  Sprite,
  TabScreen,
  Tap,
  VenueWelcome,
  v5,
  v5Alpha,
  type PortraitKey,
} from '@blowy/ui-mobile';
import type { Species } from '@blowy/domain';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useNow } from '../../../core/clock';
import { dayShortTime, shortAgo } from '../../../core/format/dates';
import { paths } from '../../../core/navigation/paths';
import { useTabs } from '../../../core/navigation/tabs';
import { t, tDynamic } from '../../../i18n';
import { useBand } from '../../band';
import { useConversation, useConversations } from '../../conversations';
import { useDuo, useDuos } from '../../duos';
import { schedule, useOuting, weekdayLabel } from '../../outings';
import { petSprite } from '../../pets';
import { LoadingScreen } from '../../system';

const TILE = [v5.violetPale, v5.peachLight, v5.greenPale, v5.peach] as const;

function lastPreview(
  items: readonly MessageView[] | undefined,
): { text: string; at: string; mine: boolean } | null {
  const m = [...(items ?? [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((x) => x.kind !== 'SYSTEM' && x.body);
  return m ? { text: m.body!, at: m.publishedAt ?? m.createdAt, mine: m.mine } : null;
}

export function ChatsScreen() {
  const nav = useTabs('chats');
  const convs = useConversations();
  if (convs.isLoading) return <LoadingScreen tab="chats" />;
  const items = (convs.data?.items ?? []).filter((c) => !c.closed);
  const outing = items.filter((c) => c.kind === 'OUTING');
  const band = items.filter((c) => c.kind === 'BAND');
  const duos = items.filter((c) => c.kind === 'DUO');
  return (
    <TabScreen nav={nav} testID="chats">
      {items.length ? (
        <>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <DisplayText size={44}>{t('chats.title')}</DisplayText>
            <Pill
              label={t('chats.private')}
              background={v5.white}
              shadow={v5.shadowCream}
              padding={[7, 12]}
              leading={<Glyph name="lock" size={14} color={v5.ink} color2={v5.white} />}
            />
          </View>
          {outing.length ? (
            <SectionLabel style={{ marginTop: 18 }}>{t('chats.sectionOuting')}</SectionLabel>
          ) : null}
          {outing.map((c) => (
            <View key={c.id} style={{ marginTop: 8 }}>
              <OutingChatCard c={c} />
            </View>
          ))}
          {band.length ? (
            <SectionLabel style={{ marginTop: 16 }}>{t('chats.sectionBand')}</SectionLabel>
          ) : null}
          {band.slice(0, 2).map((c) => (
            <View key={c.id} style={{ marginTop: 8 }}>
              <BandChatCard c={c} />
            </View>
          ))}
          {duos.length ? (
            <SectionLabel style={{ marginTop: 16 }}>{t('chats.sectionDuos')}</SectionLabel>
          ) : null}
          {duos.map((c) => (
            <View key={c.id} style={{ marginTop: 8 }}>
              <DuoChatCard c={c} />
            </View>
          ))}
        </>
      ) : (
        <>
          <DisplayText size={44}>{t('chats.title')}</DisplayText>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              paddingBottom: 80,
            }}
          >
            <Sprite path="lutin/young/chat.png" size={150} />
            <DisplayText size={32} style={{ textAlign: 'center' }}>
              {t('chats.empty.title')}
            </DisplayText>
            <BodyText
              size={14}
              weight={600}
              lh={1.5}
              color={v5.inkSoft}
              align="center"
              style={{ maxWidth: 300 }}
            >
              {t('chats.empty.body')}
            </BodyText>
            <View style={{ alignSelf: 'stretch', marginTop: 10 }}>
              <Button
                variant="b2"
                label={t('chats.empty.cta')}
                icon="arrow"
                iconPosition="trailing"
                onPress={() => router.push(paths.found)}
              />
              <Button
                variant="ghost"
                tint={v5.ink}
                label={t('chats.empty.duo')}
                onPress={() => router.push(paths.duoLane)}
              />
            </View>
          </View>
        </>
      )}
    </TabScreen>
  );
}

const unreadOf = (c: ConversationView) => Math.max(0, c.lastSeq - c.lastReadSeq);

function OutingChatCard({ c }: { c: ConversationView }) {
  const o = useOuting(c.outingId);
  const conv = useConversation(c.id);
  const now = useNow();
  const last = lastPreview(conv.server);
  const others = (o.data?.members ?? []).length;
  return (
    <ChatListCard
      highlighted
      onPress={() => router.push(paths.chat(c.id))}
      thumb={
        <PetMosaic
          sprites={(o.data?.members ?? []).slice(0, 4).map((m) => petSprite(m.pet.species))}
        />
      }
      title={
        o.data
          ? t('chats.outingTitle', { day: weekdayLabel(o.data.startsAt), n: others })
          : t('chats.sectionOuting')
      }
      time={last ? shortAgo(last.at, now) : ''}
      preview={last?.text ?? t('chats.noMessage')}
      chip={
        o.data
          ? {
              label: t('chats.venueChip', { lock: schedule(o.data).lock }),
              background: v5.lime,
              color: v5.ink,
            }
          : undefined
      }
      unread={unreadOf(c)}
      unreadLabel={t('chats.unread', { n: unreadOf(c) })}
    />
  );
}

function BandChatCard({ c }: { c: ConversationView }) {
  const band = useBand();
  const conv = useConversation(c.id);
  const now = useNow();
  const link = band.data?.items.find((b) => b.linkId === c.bandLinkId);
  const last = lastPreview(conv.server);
  return (
    <ChatListCard
      onPress={() => router.push(paths.chat(c.id))}
      thumb={
        <PetTile
          path={link ? petSprite(link.pet.species) : null}
          size={64}
          spriteSize={55}
          radius={20}
          background={v5.peach}
        />
      }
      title={link?.user.firstName ?? ''}
      time={last ? shortAgo(last.at, now) : ''}
      preview={last ? `${link?.user.firstName ?? ''} : ${last.text}` : t('chats.noMessage')}
      chip={
        link
          ? {
              label: tDynamic(`chats.origin.${link.origin}`),
              background: v5.sand,
              color: v5.inkSoft,
            }
          : undefined
      }
      unread={unreadOf(c)}
      unreadLabel={t('chats.unread', { n: unreadOf(c) })}
    />
  );
}

const duoName = (d: DuoView) =>
  d.status === 'EXCHANGE' ? `${d.other.firstName.charAt(0)}.` : d.other.firstName;

function DuoChatCard({ c }: { c: ConversationView }) {
  const duo = useDuo(c.duoId);
  const conv = useConversation(c.id);
  const now = useNow();
  const d = duo.data;
  const last = lastPreview(conv.server);
  return (
    <ChatListCard
      onPress={() => router.push(d ? paths.duo(d.id) : paths.chat(c.id))}
      thumb={
        <PetTile
          path="hybrid/baby-nino-suzie.webp"
          size={64}
          spriteSize={55}
          radius={20}
          background={v5.rosePale}
        />
      }
      title={d ? `${duoName(d)} · ${d.other.pet.name}` : ''}
      time={last ? shortAgo(last.at, now) : ''}
      preview={
        last && !last.mine && d?.status === 'EXCHANGE'
          ? t('chats.duoAnswered', { name: duoName(d) })
          : (last?.text ?? t('chats.noMessage'))
      }
      chip={
        d?.exchange
          ? {
              label: t('chats.facesChip', { when: dayShortTime(d.exchange.endsAt) }),
              background: v5.rosePale,
              color: v5.rose,
            }
          : undefined
      }
      unread={unreadOf(c)}
      unreadLabel={t('chats.unread', { n: unreadOf(c) })}
    />
  );
}

// ---------------------------------------------------------------- conversation
export function ConversationScreen({ id, menu }: { id: string; menu?: boolean }) {
  const convs = useConversations();
  const c = convs.data?.items.find((x) => x.id === id);
  if (convs.isLoading) return <LoadingScreen tab="chats" />;
  if (c?.kind === 'OUTING') return <GroupChat c={c} menu={!!menu} />;
  return <PersonChat id={id} c={c} />;
}

function Messages({ id, footer }: { id: string; footer?: string }) {
  const conv = useConversation(id);
  const list = conv.messages;
  return (
    <>
      {list.map((d) => {
        if (d.kind === 'system')
          return d.body ? (
            <VenueWelcome key={d.key} title={t('chats.venueWelcome')} text={d.body} />
          ) : null;
        if (!d.body) return null;
        if (d.mine || !d.author) return <Bubble key={d.key} text={d.body} mine={d.mine} />;
        const a = d.author;
        return (
          <View key={d.key} style={{ gap: 4 }}>
            <BodyText size={12} weight={800} color={v5.inkSoft} style={{ marginLeft: 42 }}>
              {[a.firstName, a.pet.name].filter(Boolean).join(' · ')}
              {a.calm ? ` · ${t('chats.calm')}` : ''}
            </BodyText>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: v5.violetPale,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sprite path={petSprite(a.pet.species as Species)} size={29} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Bubble text={d.body} mine={false} />
              </View>
            </View>
          </View>
        );
      })}
      {footer ? (
        <BodyText
          size={12}
          weight={700}
          color={v5.grey}
          align="center"
          style={{ marginTop: 'auto', alignSelf: 'center' }}
        >
          {footer}
        </BodyText>
      ) : null}
    </>
  );
}

function GroupChat({ c, menu }: { c: ConversationView; menu: boolean }) {
  const o = useOuting(c.outingId);
  const conv = useConversation(c.id);
  const [draft, setDraft] = useState('');
  const members = o.data?.members ?? [];
  const lock = o.data ? schedule(o.data).lock : '';
  const now = useNow();
  return (
    <ChatScreen
      testID="group-chat"
      header={
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconAction
              glyph="back"
              glyphSize={16}
              label={t('chats.backA11y')}
              background={v5Alpha.white18}
              glyphColor={v5.white}
              onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.chats))}
            />
            <Tap
              onPress={() => o.data && router.push(paths.outing(o.data.id))}
              accessibilityRole="link"
              pressDepth={0}
              style={{ flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center' }}
            >
              <DisplayText size={22} color={v5.white} heading={false} numberOfLines={1}>
                {o.data
                  ? t('chats.outingTitle', {
                      day: weekdayLabel(o.data.startsAt),
                      n: members.length,
                    })
                  : ''}
              </DisplayText>
              <BodyText size={12} weight={700} color={v5.violetPaler}>
                {t('chats.seeOuting')}
              </BodyText>
            </Tap>
            <IconAction
              glyph="dots"
              label={t('outing.menuA11y')}
              background={v5Alpha.white18}
              glyphColor={v5.white}
              onPress={() => router.push(paths.chatMenu(c.id))}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {members.map((m, i) => (
              <MemberChip
                key={m.userId}
                sprite={petSprite(m.pet.species)}
                tile={m.inMyTeam ? v5.peach : (TILE[i % TILE.length] ?? v5.violetPale)}
                label={m.firstName ?? m.pet.name}
              />
            ))}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: v5Alpha.white14,
              borderRadius: 14,
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
          >
            <Glyph name="lock" size={18} color={v5.lime} color2={v5.ink} />
            <BodyText size={12} weight={700} color={v5.white}>
              {t('chats.moderated', {
                day: o.data ? weekdayLabel(o.data.startsAt).toLowerCase() : '',
              })}
            </BodyText>
          </View>
        </>
      }
      composer={
        <ComposerBar
          value={draft}
          onChange={setDraft}
          onSend={() => draft.trim() && void conv.send(draft.trim()).then(() => setDraft(''))}
          placeholder={t('chats.writeGroup')}
          label={t('chats.writeGroupA11y')}
          sendLabel={t('chats.send')}
        />
      }
      overlay={
        menu ? (
          <BottomSheet
            title={t('chats.menu.title', {
              day: o.data ? weekdayLabel(o.data.startsAt).toLowerCase() : '',
            })}
            label={t('chats.menu.a11y')}
          >
            <RowGroup>
              <Row
                first
                label={t('chats.menu.report')}
                color={v5.danger}
                chevron
                onPress={() =>
                  router.push({
                    pathname: paths.report,
                    params: { outing: c.outingId ?? '' },
                  } as never)
                }
              />
              <Row
                label={t('chats.menu.block')}
                chevron
                onPress={() =>
                  router.push({
                    pathname: paths.report,
                    params: { outing: c.outingId ?? '', block: '1' },
                  } as never)
                }
              />
              <Row
                label={t('chats.menu.leave')}
                chevron
                onPress={() => c.outingId && router.push(paths.outing(c.outingId))}
              />
              <Row label={t('chats.menu.mute')} chevron onPress={() => router.back()} />
            </RowGroup>
            <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft}>
              {t('chats.menu.note', { lock })}
            </BodyText>
            <Button variant="b3" label={t('common.close')} onPress={() => router.back()} />
          </BottomSheet>
        ) : null
      }
    >
      <IcebreakerCard o={o.data} />
      {o.data && !o.data.venue && now < Date.parse(o.data.timeline.lockAt) ? (
        <VenueWelcome
          title={t('chats.venueWelcome')}
          text={t('chats.venueSoon', { lock })}
          quoted={false}
        />
      ) : null}
      <Messages
        id={c.id}
        footer={t('chats.nothingRequired', {
          day: o.data ? weekdayLabel(o.data.startsAt).toLowerCase() : '',
        })}
      />
    </ChatScreen>
  );
}

/** « Les pets demandent » : question soufflée + les 3 mots de chaque pet (vision, jamais d'intention). */
function IcebreakerCard({ o }: { o: OutingView | undefined }) {
  const rows = (o?.members ?? []).filter((m) => m.threeWords.length);
  return (
    <View
      style={{
        backgroundColor: v5.ink,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 8,
        boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.black }],
      }}
    >
      <BodyText size={11} weight={800} ls={0.14} upper color={v5.lime}>
        {t('chats.ice.label')}
      </BodyText>
      <BodyText size={15} weight={600} lh={1.35} color={v5.white}>
        {t('chats.ice.question')}
      </BodyText>
      {rows.length ? (
        <View style={{ gap: 6, backgroundColor: v5.cream, borderRadius: 14, padding: 8 }}>
          {rows.map((m, i) => (
            <View
              key={m.userId}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  backgroundColor: m.inMyTeam ? v5.peach : (TILE[i % TILE.length] ?? v5.violetPale),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sprite path={petSprite(m.pet.species)} size={22} />
              </View>
              <BodyText
                size={12}
                weight={800}
                color={v5.grey}
                style={{ width: 26 }}
                numberOfLines={1}
              >
                {m.firstName ?? m.pet.name}
              </BodyText>
              {m.threeWords.map((w) => (
                <Pill
                  key={w}
                  label={tDynamic(`words.${w}`)}
                  background={v5.white}
                  shadow={v5.shadowCream}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PersonChat({ id, c }: { id: string; c: ConversationView | undefined }) {
  const duos = useDuos();
  const band = useBand();
  const conv = useConversation(id);
  const [draft, setDraft] = useState('');
  const duo = duos.data?.items.find((d) => d.conversationId === id);
  const link = band.data?.items.find((b) => b.conversationId === id);
  const name = duo ? duoName(duo) : (link?.user.firstName ?? '');
  const portrait = (duo?.other.photo?.url ?? link?.user.photo?.url)?.replace(
    'demo-portrait:',
    '',
  ) as PortraitKey | undefined;
  return (
    <ChatScreen
      testID="person-chat"
      header={
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconAction
              glyph="back"
              glyphSize={16}
              label={t('chats.backA11y')}
              background={v5Alpha.white18}
              glyphColor={v5.white}
              onPress={() => (router.canGoBack() ? router.back() : router.replace(paths.chats))}
            />
            {portrait ? (
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={t('chats.faceOf', { name })}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: v5.white,
                }}
              >
                <Portrait
                  who={portrait}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              </View>
            ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              <DisplayText size={22} color={v5.white} heading={false} numberOfLines={1}>
                {name}
              </DisplayText>
              <BodyText size={12} weight={700} color={v5.violetPaler} ellipsis>
                {duo
                  ? t(duo.origin === 'OUTING_VOTE' ? 'chats.duoAfterOuting' : 'chats.duoLane')
                  : t('chats.bandSub')}
              </BodyText>
            </View>
            <IconAction
              glyph="flag"
              label={t('chats.report')}
              background={v5Alpha.white18}
              glyphColor={v5.white}
              onPress={() => router.push(paths.report)}
            />
            <IconAction
              glyph="dots"
              label={t('chats.duoMenuA11y')}
              background={v5Alpha.white18}
              glyphColor={v5.white}
              onPress={() => (duo ? router.push(paths.duoEgg(duo.id)) : router.push(paths.leave))}
            />
          </View>
          {duo ? (
            <Tap
              onPress={() => router.push(paths.duoDate(duo.id))}
              accessibilityRole="link"
              pressDepth={0}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: v5Alpha.white16,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: v5.lime }} />
              <BodyText size={14} weight={800} color={v5.white}>
                {duo.currentDate?.status === 'PROPOSED' && duo.currentDate.proposedByMe
                  ? t('chats.datePending', { name })
                  : t('chats.proposeDate')}
              </BodyText>
              <View style={{ marginLeft: 'auto' }}>
                <Glyph name="chevron" size={14} color={v5.white} />
              </View>
            </Tap>
          ) : null}
        </>
      }
      composer={
        <ComposerBar
          value={draft}
          onChange={setDraft}
          onSend={() => draft.trim() && void conv.send(draft.trim()).then(() => setDraft(''))}
          placeholder={t('chats.writeTo', { name })}
          label={t('chats.writeToA11y', { name })}
          sendLabel={t('chats.send')}
        />
      }
    >
      {c?.closed ? (
        <BodyText size={12} weight={700} color={v5.inkSoft} align="center">
          {t('chats.closed')}
        </BodyText>
      ) : null}
      <Messages id={id} />
      <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <Sprite path="nino/young/presentation.webp" size={40} />
        <View
          style={{
            flex: 1,
            backgroundColor: v5.ink,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 6,
            paddingVertical: 12,
            paddingHorizontal: 14,
            gap: 8,
            boxShadow: [
              { offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.black },
            ],
          }}
        >
          <BodyText size={11} weight={800} ls={0.14} upper color={v5.lime}>
            {t('chats.idea.label')}
          </BodyText>
          <BodyText size={15} weight={600} lh={1.35} color={v5.white}>
            {t('chats.idea.q1')}
          </BodyText>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Tap
              onPress={() => setDraft(t('chats.idea.q1'))}
              pressDepth={0}
              style={{
                minHeight: 44,
                minWidth: 44,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: v5.lime,
                justifyContent: 'center',
              }}
            >
              <BodyText size={13} weight={800}>
                {t('chats.idea.use')}
              </BodyText>
            </Tap>
            <Tap
              onPress={() => undefined}
              pressDepth={0}
              style={{
                minHeight: 44,
                minWidth: 44,
                paddingHorizontal: 12,
                borderRadius: 14,
                backgroundColor: v5Alpha.white16,
                justifyContent: 'center',
              }}
            >
              <BodyText size={13} weight={800} color={v5.white}>
                {t('chats.idea.next')}
              </BodyText>
            </Tap>
          </View>
        </View>
      </View>
    </ChatScreen>
  );
}
