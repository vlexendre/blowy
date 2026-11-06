/**
 * 11 · « Nino (ton pet) t'a trouvé une sortie » (V5-Trouvee, -lyon, -banlieue) — gabarit unique V5.5.
 * V5.4 §A1 : aucun signal de compatibilité. Aperçu anonyme seulement : ni prénom, ni visage, ni pet
 * d'inconnu. Variante « ailleurs » quand la sortie n'est pas dans mon quartier (titre « Une sortie à
 * Lyon, trouvée par Nino »). Le trajet en minutes n'existe pas dans le contrat : jamais inventé.
 */
import type { OutingView } from '@blowy/api-contract';
import type { Species } from '@blowy/domain';
import {
  BodyText,
  Button,
  CardV5,
  DisplayText,
  Frame,
  Glyph,
  IconAction,
  Pill,
  PopIn,
  Sprite,
  v5,
} from '@blowy/ui-mobile';
import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { isNetworkError } from '../../../core/api/errors';
import { paths } from '../../../core/navigation/paths';
import { t, tDynamic } from '../../../i18n';
import { useMyNeighborhood, useOutingPreferences } from '../../account';
import { useAllowances } from '../../payments';
import { petSprite, useMyPet } from '../../pets';
import { LoadingScreen, OfflineScreen } from '../../system';
import { useMyOuting } from '../api/hooks';
import { fundingKind, headline, schedule } from '../model/presenters';
import { OutingGroup, travelLine } from './parts';

export { slotTile, toStripSlots } from './parts';

export function FoundScreen() {
  const { week, outing } = useMyOuting();
  const pet = useMyPet();
  const hood = useMyNeighborhood();
  const prefs = useOutingPreferences();
  const allowances = useAllowances();
  if (week.isLoading || outing.isLoading) return <LoadingScreen />;
  if (isNetworkError(week.error)) return <OfflineScreen onRetry={() => void week.refetch()} />;
  const o = outing.data;
  if (!o) return <Redirect href={week.data?.storyFeasibility ? paths.notYet : paths.waitlist} />;
  const species: Species = pet.data?.species ?? 'NINO';
  const home = hood.data?.neighborhood?.name ?? o.neighborhood.name;
  const petName = pet.data?.name ?? tDynamic(`petName.${species}`);
  const free = fundingKind(o, allowances.data?.firstOutingFree) === 'free';
  return (
    <FoundView
      o={o}
      species={species}
      petName={petName}
      home={home}
      maxTravel={prefs.data?.maxTravelMinutes}
      free={free}
      calm={prefs.data?.ambiance === 'CALM'}
    />
  );
}

const cityOf = (name: string) => (name.split(/[ ·]/)[0] ?? name).trim();
/** Ville de lancement : ailleurs (ou hors de ma ville), le titre nomme la ville de la sortie (maquettes Lyon, Nantes). */
const LAUNCH_CITY = 'Paris';

export function FoundView({
  o,
  species,
  petName,
  home,
  maxTravel,
  free,
  calm,
}: {
  o: OutingView;
  species: Species;
  petName: string;
  home: string;
  maxTravel?: number;
  free: boolean;
  calm?: boolean;
}) {
  const h = headline(o, tDynamic(`activity.${o.activity}`));
  const s = schedule(o);
  const away =
    cityOf(home) !== cityOf(o.neighborhood.name) || cityOf(o.neighborhood.name) !== LAUNCH_CITY;
  const travel = travelLine(o, home);
  const title = away
    ? t('found.awayTitleV55', {
        city: cityOf(o.neighborhood.name).toUpperCase(),
        pet: petName.toUpperCase(),
      })
    : t('found.titleV55', { pet: petName.toUpperCase() });
  return (
    <Frame pad={[56, 18, 22]} testID={away ? 'found-away' : 'found'}>
      <PopIn
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Pill
          label={maxTravel ? t('found.chip', { home, m: maxTravel }) : home}
          background={v5.white}
          shadow={v5.shadowCream}
          padding={[7, 12]}
          leading={<Glyph name="pin" size={12} />}
        />
        <IconAction
          glyph="share"
          label={t('found.shareA11y')}
          shadow={v5.shadowCream}
          onPress={() => router.push(paths.share('confirmation'))}
        />
      </PopIn>
      <PopIn
        delayMs={50}
        style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        {away ? null : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: v5.lime,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sprite path={petSprite(species)} size={34} />
          </View>
        )}
        <DisplayText size={34} lineHeight={0.92} style={{ flex: 1 }}>
          {title}
        </DisplayText>
      </PopIn>
      <BodyText size={13} weight={600} color={v5.inkSoft} style={{ marginTop: 6 }}>
        {calm ? `${t('found.subtitle')} ${t('found.calmAsked')}` : t('found.subtitle')}
      </BodyText>
      <PopIn delayMs={100} style={{ marginTop: 10 }}>
        <CardV5 style={{ padding: 14, gap: 10 }}>
          <View style={{ gap: 3 }}>
            <BodyText size={13} weight={800} color={v5.coralText}>
              {h.day}
            </BodyText>
            <DisplayText size={30} heading={false}>
              {h.hours}
            </DisplayText>
            <BodyText size={14} weight={700} color={v5.inkSoft}>
              {travel ? `${h.line} · ${travel}` : h.line}
            </BodyText>
          </View>
          <OutingGroup o={o} species={species} variant="found" bare />
        </CardV5>
      </PopIn>
      <BodyText size={13} weight={600} lh={1.45} color={v5.inkSoft} style={{ marginTop: 10 }}>
        {free ? t('found.footerFree', { lock: s.lock }) : t('found.footer', { lock: s.lock })}
      </BodyText>
      <View style={{ marginTop: 'auto', gap: 4 }}>
        <Button
          variant="b2"
          label={t('found.see')}
          icon="arrow"
          iconPosition="trailing"
          onPress={() => router.push(paths.outing(o.id))}
          testID="found-see"
        />
        <Button
          variant="ghost"
          tint={v5.ink}
          label={t('found.inviteV55')}
          onPress={() => router.push(paths.outingStep(o.id, 'team'))}
        />
      </View>
    </Frame>
  );
}
