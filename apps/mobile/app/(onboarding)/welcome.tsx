/** Bienvenue (V6-Welcome) : la promesse, un aperçu du chat avec le pet, puis « créer mon pet ». */
import { space } from '@blowy/tokens';
import { MessageBubble, OnboardingTemplate, Panel, PetImage, type PetLook, Sticker, Title } from '@blowy/ui';
import { router } from 'expo-router';
import { View } from 'react-native';

import { onboarding } from '@/locales/onboarding';

const t = onboarding.welcome;
const nino: PetLook = { name: t.petName, species: 'nino', mood: 'joie' };

export default function Welcome() {
  return (
    <OnboardingTemplate
      primaryLabel={t.create}
      onPrimary={() => router.push('/(onboarding)/craft')}
      secondaryLabel={t.login}
      onSecondary={() => router.push({ pathname: '/(onboarding)/compte', params: { mode: 'login' } })}
    >
      <Panel gradient="accent" padding="lg" style={{ flexGrow: 1, minHeight: 600 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm }}>
          <Sticker label={`${t.brand}.`} tone="dark" font="body" />
          <Sticker label={t.sticker} tone="white" size="sm" rotate={2} />
        </View>
        <View style={{ marginTop: space.lg }}>
          <Title text={t.title} size={58} accessibilityLabel={t.title.map((s) => s.text).join(' ')} />
        </View>
        <View style={{ flexGrow: 1, minHeight: space.lg }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: -50, bottom: -30 }}>
          <PetImage species="nino" mood="joie" size={230} animation="breathe" outline accessibilityLabel={t.petName} />
        </View>
        <View style={{ gap: space.xs, maxWidth: 240 }} accessibilityLabel={t.chat.map((m) => m.text).join(' · ')} accessible>
          {t.chat.map((m, i) => (
            <MessageBubble
              key={i}
              message={{ author: m.from === 'pet' ? 'my_pet' : 'me', kind: 'text', body: m.text, mediaUrl: null }}
              pet={m.from === 'pet' ? nino : undefined}
            />
          ))}
        </View>
      </Panel>
    </OnboardingTemplate>
  );
}
