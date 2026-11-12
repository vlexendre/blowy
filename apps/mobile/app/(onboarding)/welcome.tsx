/** Bienvenue (V6-Welcome) : la promesse, un aperçu du chat avec le pet, puis « créer mon pet ». */
import { type PetLook, WelcomeTemplate } from '@blowy/ui';
import { router } from 'expo-router';

import { onboarding } from '@/locales/onboarding';

const t = onboarding.welcome;
const nino: PetLook = { name: t.petName, species: 'nino', mood: 'joie' };

export default function Welcome() {
  return (
    <WelcomeTemplate
      brand={t.brand}
      tagline={t.sticker}
      title={t.title}
      chat={t.chat}
      pet={nino}
      primaryLabel={t.create}
      onPrimary={() => router.push('/(onboarding)/craft')}
      secondaryLabel={t.login}
      onSecondary={() => router.push({ pathname: '/(onboarding)/compte', params: { mode: 'login' } })}
    />
  );
}
