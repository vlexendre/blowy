/**
 * Organismes V5 (maquettes design/v5) : barre d'onglets `.gnav` à 4 onglets, aperçu du groupe,
 * carte de conversation, carte de visage. Composés de molécules et d'atomes uniquement.
 */
import { BlurView } from 'expo-blur';
import { useState, type ReactNode } from 'react';
import { Pressable, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useA11yPrefs } from '../foundations/accessibility';
import { tabBarBottom } from '../foundations/layout';
import { bodyFont } from '../foundations/typography';
import { v5, v5Alpha, v5Gradient, type V5PortraitKey } from '../foundations/theme';
import { BodyText } from '../atoms/BodyText';
import { DisplayText } from '../atoms/DisplayText';
import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Portrait } from '../atoms/Portrait';
import { Sprite } from '../atoms/Sprite';
import { CountDot, Pill, Tap, UnknownTile, v5Shadow } from '../molecules/v5';

export interface GlassNavItem {
  key: string;
  label: string;
  glyph: GlyphName;
  glyphOn: GlyphName;
  badge?: string | null;
  badgeLabel?: string;
}

/**
 * `.gnav` V5 : left/right 14, bas 18, 4 colonnes écart 2, marge 6, rayon 34 ; verre dégradé blanc
 * .92 → .8, `backdrop-filter: blur(22px) saturate(190%)`, bord 1 px blanc .8, ombres (interne 1 px
 * blanc .95 ; 0 16 36 encre .24 ; 0 2 6 encre .08). Onglet 54, rayon 28, Inter 10 800 .05em,
 * #4E453C ; actif encre sur dégradé lime. Compteur `.bdg` rose 18 px, anneau blanc 2 px.
 */
export function GlassNav({
  items,
  activeKey,
  onSelect,
  bottomInset,
}: {
  items: readonly GlassNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  bottomInset: number;
}) {
  const { allowBlur } = useA11yPrefs();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: tabBarBottom(bottomInset),
        zIndex: 40,
      }}
    >
      <View
        style={{
          borderRadius: 34,
          overflow: 'hidden',
          padding: 6,
          borderWidth: 1,
          borderColor: v5Alpha.white80,
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 1,
              blurRadius: 1,
              spreadDistance: 0,
              color: v5Alpha.white95,
              inset: true,
            },
            { offsetX: 0, offsetY: 16, blurRadius: 36, spreadDistance: 0, color: v5Alpha.ink24 },
            { offsetX: 0, offsetY: 2, blurRadius: 6, spreadDistance: 0, color: v5Alpha.ink08 },
          ],
        }}
      >
        {allowBlur ? (
          <BlurView
            intensity={40}
            tint="light"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: v5.cream,
            }}
          />
        )}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: v5Gradient.glassNav,
          }}
        />
        <View style={{ flexDirection: 'row', gap: 2 }} accessibilityRole="tablist">
          {items.map((it) => {
            const on = it.key === activeKey;
            const ink = on ? v5.ink : v5.navInk;
            return (
              <Pressable
                key={it.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={[it.label, it.badgeLabel].filter(Boolean).join(', ')}
                onPress={() => onSelect(it.key)}
                testID={`tab-${it.key}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 54,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  ...(on ? { backgroundImage: v5Gradient.tabOn } : null),
                }}
              >
                <Glyph name={on ? it.glyphOn : it.glyph} size={21} color={ink} />
                <BodyText size={10} weight={800} ls={0.05} upper color={ink} nowrap>
                  {it.label}
                </BodyText>
                {it.badge ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: '50%',
                      marginLeft: 6,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 4,
                      borderRadius: 999,
                      backgroundColor: v5.rose,
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: [
                        {
                          offsetX: 0,
                          offsetY: 0,
                          blurRadius: 0,
                          spreadDistance: 2,
                          color: v5.white,
                        },
                      ],
                    }}
                  >
                    <BodyText size={10} weight={800} color={v5.white}>
                      {it.badge}
                    </BodyText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export interface GroupSlot {
  key: string;
  /** Sprite du pet (connu) ; null = place « à découvrir ». */
  sprite: string | null;
  label: string;
  background?: string;
  /** Libellé fort (« Toi ») : Inter 12 800 encre ; sinon 11 700 #5A5047. */
  strong?: boolean;
  accessibilityLabel?: string;
}

/** Grille du groupe (5 colonnes, écart 2) : vignettes 48 px rayon 15, libellé sous chaque place. */
export function GroupStrip({
  slots,
  tile = 48,
  sprite = 41,
  radius = 15,
}: {
  slots: readonly GroupSlot[];
  tile?: number;
  sprite?: number;
  radius?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {slots.map((s) => (
        <View key={s.key} style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 4 }}>
          {s.sprite ? (
            <View
              accessible
              accessibilityLabel={s.accessibilityLabel ?? s.label}
              style={{
                width: tile,
                height: tile,
                borderRadius: radius,
                backgroundColor: s.background,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sprite path={s.sprite} size={sprite} />
            </View>
          ) : (
            <UnknownTile size={tile} radius={radius} label={s.accessibilityLabel ?? s.label} />
          )}
          <BodyText
            size={s.strong ? 12 : 11}
            weight={s.strong ? 800 : 700}
            color={s.strong ? v5.ink : v5.inkSoft}
            nowrap
          >
            {s.label}
          </BodyText>
        </View>
      ))}
    </View>
  );
}

/** Carte de conversation (Chats) : vignette 64 rayon 20, titre `.d` 20, heure, aperçu, puce d'état, non-lus. */
export function ChatListCard({
  thumb,
  title,
  time,
  preview,
  chip,
  unread,
  unreadLabel,
  highlighted,
  onPress,
  testID,
}: {
  thumb: ReactNode;
  title: string;
  time: string;
  preview: string;
  chip?: { label: string; background: string; color: string };
  unread?: number;
  unreadLabel?: string;
  highlighted?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={[title, preview, chip?.label, unreadLabel].filter(Boolean).join(', ')}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: v5.white,
          borderRadius: 22,
          padding: 12,
        },
        highlighted
          ? {
              boxShadow: [
                { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 3, color: v5.lime },
                { offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: v5.limeShadow },
              ],
            }
          : v5Shadow(4, v5.shadowCream),
      ]}
    >
      {thumb}
      <View style={{ flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <DisplayText size={20} heading={false} numberOfLines={1}>
            {title}
          </DisplayText>
          <BodyText size={12} weight={700} color={v5.grey}>
            {time}
          </BodyText>
        </View>
        <BodyText size={13} weight={500} color={v5.inkSoft} ellipsis>
          {preview}
        </BodyText>
        {chip ? (
          <Pill
            label={chip.label}
            background={chip.background}
            color={chip.color}
            style={{ alignSelf: 'flex-start' }}
          />
        ) : null}
      </View>
      {unread ? <CountDot count={unread} label={unreadLabel ?? String(unread)} /> : null}
    </Tap>
  );
}

/** Mosaïque 2×2 des pets du groupe (vignette encre 64 px, marge 4, sprites 28). */
export function PetMosaic({
  sprites,
  size = 64,
  radius = 20,
  background = v5.ink,
  sprite = 28,
}: {
  sprites: readonly (string | null)[];
  size?: number;
  radius?: number;
  background?: string;
  sprite?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: background,
        padding: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        flexShrink: 0,
      }}
    >
      {sprites.slice(0, 4).map((s, i) => (
        <View
          key={i}
          style={{
            width: (size - 8) / 2,
            height: (size - 8) / 2,
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}
        >
          <Sprite path={s} size={sprite} />
        </View>
      ))}
    </View>
  );
}

/**
 * Carte de visage (Les visages) : hauteur 150, rayon 22, ombre `0 5px 0 rgba(22,17,13,.25)` ;
 * photo (ou portrait illustré de démonstration), filigrane « vu par <prénom> » incliné −24°,
 * pastille du pet 32 px en haut à droite, bandeau encre .82 (prénom · tranche, « selfie vérifié »).
 */
export function FaceCard({
  photo,
  portrait,
  petSprite,
  title,
  verifiedLabel,
  watermark,
  accessibilityLabel,
  height = 150,
  style,
}: {
  photo?: ReactNode;
  portrait?: V5PortraitKey;
  petSprite?: string | null;
  title: string;
  verifiedLabel?: string;
  watermark?: string;
  accessibilityLabel: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          position: 'relative',
          height,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: [
            { offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5Alpha.ink25 },
          ],
        },
        style,
      ]}
    >
      {photo ??
        (portrait ? (
          <Portrait
            who={portrait}
            bottomInset={44}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : null)}
      {watermark ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: -20,
            right: -20,
            top: '30%',
            transform: [{ rotate: '-24deg' }],
          }}
        >
          <BodyText size={12} weight={800} ls={0.1} color={v5Alpha.white60} align="center" nowrap>
            {watermark}
          </BodyText>
        </View>
      ) : null}
      {petSprite ? (
        <View
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: 32,
            height: 32,
            borderRadius: 11,
            backgroundColor: v5.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sprite path={petSprite} size={28} />
        </View>
      ) : null}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingVertical: 8,
          paddingHorizontal: 10,
          backgroundColor: v5Alpha.ink82,
          gap: 2,
        }}
      >
        <DisplayText size={16} color={v5.white} heading={false} numberOfLines={1}>
          {title}
        </DisplayText>
        {verifiedLabel ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Glyph name="check" size={11} color={v5.lime} />
            <BodyText size={11} weight={700} color={v5.limeSoft}>
              {verifiedLabel}
            </BodyText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Carte « Ton groupe » : `.lbl`, grille des 5 places, composition (13 700, 1,4), règle (12 600 #5A5047). */
export function GroupBlock({
  label,
  slots,
  composition,
  rule,
  gap = 8,
  tile = 48,
  sprite = 41,
  radius = 15,
}: {
  label?: string;
  slots: readonly GroupSlot[];
  composition?: string | null;
  rule?: string;
  gap?: number;
  tile?: number;
  sprite?: number;
  radius?: number;
}) {
  return (
    <View style={{ gap }}>
      {label ? (
        <BodyText size={11} weight={800} ls={0.14} upper color={v5.inkSoft}>
          {label}
        </BodyText>
      ) : null}
      <GroupStrip slots={slots} tile={tile} sprite={sprite} radius={radius} />
      {composition ? (
        <BodyText size={13} weight={700} lh={1.4}>
          {composition}
        </BodyText>
      ) : null}
      {rule ? (
        <BodyText size={12} weight={600} lh={1.4} color={v5.inkSoft}>
          {rule}
        </BodyText>
      ) : null}
    </View>
  );
}

/**
 * Carte encre de la sortie (fiche, « Tu y vas ») : rayon 26, marge 16, ombre `0 6px 0 #000` ;
 * jour 13 800 lime, heures `.d` 34, ligne 14 700, calendrier 12 600 #E3D9CF ; accessoire 60 px.
 */
export function OutingHero({
  day,
  hours,
  line,
  note,
  travel,
  milestones,
  accessory,
  style,
}: {
  day: string;
  hours: string;
  line: string;
  note?: string;
  travel?: string | null;
  milestones?: readonly { when: string; what: string }[];
  accessory?: string | null;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { overflow: 'hidden', borderRadius: 26, backgroundColor: v5.ink, padding: 16, gap: 10 },
        v5Shadow(6, v5.black),
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ gap: 4, flexShrink: 1 }}>
          <BodyText size={13} weight={800} color={v5.lime}>
            {day}
          </BodyText>
          <DisplayText size={34} color={v5.white} heading={false}>
            {hours}
          </DisplayText>
          <BodyText size={14} weight={700} color={v5.white}>
            {line}
          </BodyText>
          {travel ? (
            <BodyText size={12} weight={700} color={v5.mist}>
              {travel}
            </BodyText>
          ) : null}
          {note ? (
            <BodyText size={12} weight={600} color={v5.mist}>
              {note}
            </BodyText>
          ) : null}
        </View>
        {accessory ? <Sprite path={accessory} size={60} /> : null}
      </View>
      {milestones?.length ? (
        <View accessibilityRole="list" style={{ gap: 6 }}>
          {milestones.map((m) => (
            <View key={m.when} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: v5.lime,
                  transform: [{ translateY: 1 }],
                }}
              />
              <BodyText size={13} weight={800} color={v5.white} style={{ flexShrink: 0 }}>
                {m.when}
              </BodyText>
              <BodyText size={12} weight={600} color={v5.mist} style={{ flexShrink: 1 }}>
                {m.what}
              </BodyText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Bandeau citron « Tu y vas. » : rond encre + coche, titre `.d` 22, sous-titre 12 700, ombre `0 4px 0 #7DA11A`. */
export function StatusBanner({ title, sub }: { title: string; sub: string }) {
  return (
    <View
      accessibilityRole="summary"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: v5.lime,
          borderRadius: 18,
          paddingVertical: 12,
          paddingHorizontal: 14,
        },
        v5Shadow(4, v5.limeShadow),
      ]}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: v5.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Glyph name="check" size={18} color={v5.lime} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <DisplayText size={22} heading={false}>
          {title}
        </DisplayText>
        <BodyText size={12} weight={700}>
          {sub}
        </BodyText>
      </View>
    </View>
  );
}

/** « Règles d'annulation › » (`<details>` fermé) : 13 800, ouvert → texte 12 600 #5A5047. */
export function RulesDisclosure({
  summary,
  text,
  minHeight = 44,
}: {
  summary: string;
  text: string;
  minHeight?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ paddingHorizontal: 4 }}>
      <Tap
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ selected: open }}
        accessibilityLabel={summary}
        pressDepth={0}
        style={{ minHeight, justifyContent: 'center' }}
      >
        <BodyText size={13} weight={800}>
          {summary}
        </BodyText>
      </Tap>
      {open ? (
        <BodyText size={12} weight={600} lh={1.5} color={v5.inkSoft}>
          {text}
        </BodyText>
      ) : null}
    </View>
  );
}

/** Carte du lieu (Lieu confirmé) : photo 76 px + légende, nom `.d` 22, adresse 13 700, note 12 600. */
export function VenueCard({
  photo,
  photoCaption,
  name,
  address,
  note,
}: {
  photo?: ReactNode;
  photoCaption?: string;
  name: string;
  address: string;
  note?: string;
}) {
  return (
    <View
      style={[
        { backgroundColor: v5.white, borderRadius: 22, overflow: 'hidden' },
        v5Shadow(4, v5.shadowCream),
      ]}
    >
      {photo ? (
        <View style={{ height: 76 }}>
          {photo}
          {photoCaption ? (
            <View
              style={{
                position: 'absolute',
                left: 8,
                bottom: 6,
                backgroundColor: 'rgba(22,17,13,0.8)',
                borderRadius: 8,
                paddingVertical: 2,
                paddingHorizontal: 8,
              }}
            >
              <BodyText size={11} weight={800} color={v5.white}>
                {photoCaption}
              </BodyText>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={{ paddingVertical: 10, paddingHorizontal: 14, gap: 3 }}>
        <DisplayText size={22} heading={false}>
          {name}
        </DisplayText>
        <BodyText size={13} weight={700} color={v5.inkSoft}>
          {address}
        </BodyText>
        {note ? (
          <BodyText size={12} weight={600} color={v5.inkSoft}>
            {note}
          </BodyText>
        ) : null}
      </View>
    </View>
  );
}

/** Ligne de personne (liste du groupe) : vignette 32 rayon 10 + pet 27, libellé 14 800, pet à droite 12 600. */
export function PersonLine({
  sprite,
  tile,
  label,
  pet,
}: {
  sprite: string;
  tile: string;
  label: string;
  pet: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sprite path={sprite} size={27} />
      </View>
      <BodyText size={14} weight={800} style={{ flexShrink: 1 }} numberOfLines={1}>
        {label}
      </BodyText>
      <BodyText size={12} weight={600} color={v5.inkSoft} style={{ marginLeft: 'auto' }}>
        {pet}
      </BodyText>
    </View>
  );
}

/** Ligne horaire (« 19 h 30 » corail 12 800 sur 92 px + texte 13 600 #5A5047). */
export function TimelineLine({ when, text }: { when: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ width: 92, flexShrink: 0 }}>
        <BodyText size={12} weight={800} color={v5.coralText}>
          {when}
        </BodyText>
      </View>
      <BodyText size={13} weight={600} lh={1.4} color={v5.inkSoft} style={{ flex: 1 }}>
        {text}
      </BodyText>
    </View>
  );
}

/** Barre d'écriture : champ 48 px (bord encre 2, ombre `0 3px 0 #16110D`) + envoyer 48 px corail. */
export function ComposerBar({
  value,
  onChange,
  onSend,
  placeholder,
  label,
  sendLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  label: string;
  sendLabel: string;
}) {
  return (
    <View
      style={{
        paddingTop: 10,
        paddingHorizontal: 12,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={v5.grey}
        accessibilityLabel={label}
        style={{
          flex: 1,
          minWidth: 0,
          height: 48,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: v5.ink,
          backgroundColor: v5.white,
          paddingHorizontal: 14,
          ...bodyFont(15, 400),
          color: v5.ink,
          boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.ink }],
        }}
      />
      <Tap
        onPress={onSend}
        accessibilityLabel={sendLabel}
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: v5.coralBtn,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: [
            { offsetX: 0, offsetY: 3, blurRadius: 0, spreadDistance: 0, color: v5.coralBtnShadow },
          ],
        }}
      >
        <Glyph name="send" size={18} color={v5.white} />
      </Tap>
    </View>
  );
}

/** Puce de membre sur l'en-tête violet (vignette 26 rayon 8 + nom 12 800). */
export function MemberChip({
  sprite,
  tile,
  label,
  badge,
}: {
  sprite: string | null;
  tile: string;
  label: string;
  /** Pastille citron après le nom (« calme », V5.7 `members[].calm`). */
  badge?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: v5Alpha.white14,
        borderRadius: 999,
        paddingVertical: 2,
        paddingLeft: 2,
        paddingRight: 10,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          backgroundColor: tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sprite path={sprite} size={22} />
      </View>
      <BodyText size={12} weight={800} color={v5.white}>
        {label}
      </BodyText>
      {badge ? (
        <View
          style={{
            marginLeft: 4,
            backgroundColor: v5.limePale,
            borderRadius: 999,
            paddingHorizontal: 7,
            paddingVertical: 1,
          }}
        >
          <BodyText size={11} weight={800} color={v5.ink}>
            {badge}
          </BodyText>
        </View>
      ) : null}
    </View>
  );
}

/** Feuille du bas sur voile encre .45 (`role=dialog`) : crème, rayon 26 en haut, marges 18/16/30. */
export function BottomSheet({
  title,
  children,
  label,
}: {
  title: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        backgroundColor: v5Alpha.ink45,
        justifyContent: 'flex-end',
      }}
    >
      <View
        accessibilityViewIsModal
        accessibilityLabel={label}
        style={{
          backgroundColor: v5.cream,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingTop: 18,
          paddingHorizontal: 16,
          paddingBottom: 30,
          gap: 10,
        }}
      >
        <DisplayText size={24}>{title}</DisplayText>
        {children}
      </View>
    </View>
  );
}

export interface ActionCardItem {
  key: string;
  title: string;
  sub: string;
  /** Carte rose (« Je ne viens pas, pour ma sécurité »). */
  danger?: boolean;
  onPress?: () => void;
}

/** « Si tu ne viens plus » (tour 9) : cartes d'action titre + règle, une par issue (Confirmation, Les visages). */
export function ActionCards({ label, items }: { label: string; items: readonly ActionCardItem[] }) {
  return (
    <View accessibilityRole="none" accessibilityLabel={label} style={{ gap: 6 }}>
      {items.map((it) => (
        <Tap
          key={it.key}
          onPress={it.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${it.title}. ${it.sub}`}
          pressDepth={0}
          style={{
            minHeight: 44,
            justifyContent: 'center',
            gap: 2,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: it.danger ? v5.dangerPale : v5.white,
            boxShadow: [
              { offsetX: 0, offsetY: 2, blurRadius: 0, spreadDistance: 0, color: v5.shadowCream },
            ],
          }}
        >
          <BodyText size={13} weight={800} color={it.danger ? v5.dangerDeep : v5.ink}>
            {`${it.title} ›`}
          </BodyText>
          <BodyText size={12} weight={600} lh={1.35} color={v5.inkSoft}>
            {it.sub}
          </BodyText>
        </Tap>
      ))}
    </View>
  );
}

/** « Message du lieu » (V5.7 `venue.welcomeMessage`) : encart pêche, titre gras puis le message entre guillemets. */
export function VenueWelcome({
  title,
  text,
  quoted = true,
}: {
  title: string;
  text: string;
  quoted?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: v5.peachLight,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <BodyText size={13} weight={800} lh={1.4}>
        {title}
      </BodyText>
      <BodyText size={13} weight={600} lh={1.4}>
        {quoted ? `« ${text} »` : text}
      </BodyText>
    </View>
  );
}

const HOLDS: readonly [number, number, string][] = [
  [30, 50, '#FFE36E'],
  [70, 22, '#FF3D7F'],
  [120, 44, '#9FE3F5'],
  [170, 14, '#C8F542'],
  [220, 40, '#FF8A3C'],
  [270, 20, '#FFE36E'],
  [320, 48, '#FF3D7F'],
];

/**
 * Illustration du lieu tant que sa photo n'est pas fournie (bandeau 76 px de `VenueCard`) :
 * terrain de foot à 5, mur d'escalade (maquettes Confirmation Lyon et banlieue).
 */
export function VenueArt({ kind }: { kind: 'pitch' | 'wall' }) {
  const line = 'rgba(255,255,255,0.8)';
  if (kind === 'pitch')
    return (
      <View style={{ height: 76, backgroundColor: '#2E8B57', overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            top: 8,
            bottom: 8,
            borderWidth: 2,
            borderColor: line,
            borderRadius: 4,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: 8,
            bottom: 8,
            width: 2,
            backgroundColor: line,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 30,
            height: 30,
            marginLeft: -15,
            marginTop: -15,
            borderWidth: 2,
            borderColor: line,
            borderRadius: 15,
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 26,
            top: 26,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: v5.white,
          }}
        />
      </View>
    );
  return (
    <View
      style={{
        height: 76,
        backgroundImage: 'linear-gradient(160deg, #5A6B7D, #3A4654)',
        overflow: 'hidden',
      }}
    >
      {HOLDS.map(([left, top, color]) => (
        <View
          key={`${left}-${top}`}
          style={{
            position: 'absolute',
            left,
            top,
            width: 14,
            height: 12,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 8,
            borderBottomRightRadius: 5,
            borderBottomLeftRadius: 9,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}
