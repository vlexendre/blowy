/**
 * Kitchen-sink de la fondation visuelle (route interne `/(dev)/kitchen-sink`).
 *  - par défaut : V4-Welcome reproduit UNIQUEMENT avec les composants de @blowy/ui-mobile ;
 *  - `?t=2550` : animations figées à 2 550 ms (instant de la capture de référence
 *    design/v4-reference/renders/V4-Welcome.png, mesuré : voir docs/design/design-language.md) ;
 *  - `?view=catalog` : catalogue des atomes/molécules (états, variantes).
 * Les seuls styles locaux sont des coordonnées de mise en page reprises de la maquette.
 */
import {
  Badge,
  Blob,
  Button,
  Caption,
  Card,
  Chip,
  color,
  DisplayText,
  Label,
  MotionClockProvider,
  OrbitRing,
  PetSprite,
  PopIn,
  ScreenTemplate,
  Stamp,
} from '@blowy/ui-mobile';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { t } from '../../../i18n';

const ONLINE = 3143;

function WelcomeReplica() {
  return (
    <ScreenTemplate
      testID="kitchen-welcome"
      background={
        <>
          <Blob size={300} top={-60} right={-110} color={color.mango} opacity={0.8} drift="dr1" />
          <Blob size={320} top={360} left={-150} color={color.pink} opacity={0.45} drift="dr2" />
          <Blob size={280} bottom={-90} right={-90} color={color.lime} opacity={0.55} drift="dr1" />
        </>
      }
    >
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <DisplayText size={32}>
            {t('devKitchen.brand')}
            <Text style={{ color: color.coral }}>.</Text>
          </DisplayText>
          <Label variant="tagline">{t('devKitchen.tagline')}</Label>
        </View>
        <Chip label={t('devKitchen.online', { count: ONLINE.toLocaleString('fr-FR') })} dot={color.online} pulse="online" />
      </PopIn>

      <View style={{ marginTop: 26, gap: 4 }}>
        <PopIn delayMs={80} style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <DisplayText size={56}>{t('devKitchen.line1')}</DisplayText>
          <Stamp tone="ink">
            <DisplayText size={56} color={color.white} heading={false}>
              {t('devKitchen.stamp1')}
            </DisplayText>
          </Stamp>
        </PopIn>
        <PopIn delayMs={160} style={{ marginTop: 6 }}>
          <DisplayText size={56} color={color.coral}>
            {t('devKitchen.line2')}
          </DisplayText>
        </PopIn>
        {/* Maquette : `rotate(-2deg)` en ligne, mais `.pop` (fill both → transform:none) l'écrase au rendu. */}
        <PopIn delayMs={240} style={{ alignSelf: 'flex-start' }}>
          <Stamp tone="lime" rotate={0}>
            <DisplayText size={29}>{t('devKitchen.stamp2')}</DisplayText>
          </Stamp>
        </PopIn>
      </View>

      <PopIn delayMs={360} style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
        <OrbitRing
          satellites={[
            { key: 'kind', top: -14, left: '50%', marginLeft: -36, node: <Chip tone="ink" label={t('devKitchen.traits.kind')} /> },
            { key: 'art', top: '50%', right: -50, marginTop: -14, node: <Chip label={t('devKitchen.traits.art')} drop="strong" /> },
            { key: 'sporty', bottom: -14, left: '50%', marginLeft: -36, node: <Chip tone="coral" label={t('devKitchen.traits.sporty')} /> },
            { key: 'curious', top: '50%', left: -40, marginTop: -14, node: <Chip label={t('devKitchen.traits.curious')} drop="strong" /> },
          ]}
        />
        <PetSprite path="nino/young/joyful.webp" size={190} accessibilityLabel={t('devKitchen.pets.nino')} />
        <PetSprite path="suzie/young/joyful.webp" size={104} right={2} bottom={6} delayMs={-600} accessibilityLabel={t('devKitchen.pets.suzie')} />
        <PetSprite path="gaston/young/joyful.webp" size={100} left={0} bottom={4} delayMs={-1200} accessibilityLabel={t('devKitchen.pets.gaston')} />
        <PetSprite path="pia/young/presentation.webp" size={84} left={8} top={0} delayMs={-1800} accessibilityLabel={t('devKitchen.pets.pia')} />
      </PopIn>

      <PopIn delayMs={440} style={{ alignItems: 'center', marginBottom: 14 }}>
        <Caption>{t('devKitchen.caption')}</Caption>
      </PopIn>

      <PopIn delayMs={520} style={{ gap: 6 }}>
        <Button variant="b1" label={t('devKitchen.cta')} icon="arrow" iconPosition="trailing" />
        <Button variant="link" label={t('devKitchen.account')} />
      </PopIn>
    </ScreenTemplate>
  );
}

function Catalog() {
  return (
    <ScreenTemplate scroll>
      <View style={{ gap: 18 }}>
        <DisplayText size={40}>{t('devKitchen.catalog')}</DisplayText>
        <Label>b1 · b2 · b3 · lime · link · ghost</Label>
        <Button variant="b1" label={t('devKitchen.cta')} icon="arrow" iconPosition="trailing" />
        <Button variant="b2" label={t('devKitchen.cta')} />
        <Button variant="b3" label={t('devKitchen.cta')} />
        <Button variant="lime" label={t('devKitchen.cta')} />
        <Button variant="link" label={t('devKitchen.account')} />
        <Button variant="ghost" label={t('devKitchen.account')} />
        <Label>chips · badges</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Chip label={t('devKitchen.traits.kind')} tone="ink" />
          <Chip label={t('devKitchen.traits.sporty')} tone="coral" />
          <Chip label={t('devKitchen.traits.art')} drop="strong" />
          <Chip label={t('devKitchen.traits.curious')} size="sm" tone="lime" />
          <Chip label={t('devKitchen.online', { count: 12 })} dot={color.online} pulse="online" />
          <Badge label="4" />
          <Badge label="PLUS" kind="plus" />
        </View>
        <Label>stamps · caption · card</Label>
        <Stamp tone="ink">
          <DisplayText size={40} color={color.white}>
            {t('devKitchen.stamp1')}
          </DisplayText>
        </Stamp>
        <Stamp tone="lime">
          <DisplayText size={24}>{t('devKitchen.stamp2')}</DisplayText>
        </Stamp>
        <Caption>{t('devKitchen.caption')}</Caption>
        <Card style={{ padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <PetSprite path="nino/young/joyful.webp" size={64} motion="peek" />
          <DisplayText size={22}>Nino</DisplayText>
        </Card>
        <Label>sq · peek · beat · bob · wob</Label>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PetSprite path="nino/young/joyful.webp" size={60} motion="sq" />
          <PetSprite path="suzie/young/joyful.webp" size={60} motion="peek" />
          <PetSprite path="gaston/young/joyful.webp" size={60} motion="beat" />
          <PetSprite path="pia/young/presentation.webp" size={60} motion="bob" />
          <PetSprite path="nino/young/joyful.webp" size={60} motion="wob" />
        </View>
      </View>
    </ScreenTemplate>
  );
}

export function KitchenSinkScreen() {
  const params = useLocalSearchParams<{ t?: string; view?: string }>();
  const frozen = params.t !== undefined && Number.isFinite(Number(params.t)) ? Number(params.t) : null;
  return (
    <MotionClockProvider frozenAtMs={frozen}>
      {params.view === 'catalog' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <Catalog />
        </ScrollView>
      ) : (
        <WelcomeReplica />
      )}
    </MotionClockProvider>
  );
}
