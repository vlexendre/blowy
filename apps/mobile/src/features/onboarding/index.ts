/** API publique de la feature onboarding V5. */
import type { ComponentType } from 'react';
import { AgeBlockedScreen, BirthdateScreen, CityScreen, ConsentScreen, GenderScreen, LookingScreen, MeetScreen, PetScreen, SlotsScreen, StoryScreen } from './ui/StepScreens';

export * from './model/flow';
export { useOnboarding, ONBOARDING_DRAFT_KEY } from './model/store';
export { WelcomeScreen } from './ui/WelcomeScreen';
export { AgeBlockedScreen };

const STEP_SCREENS: Record<string, ComponentType> = { city: CityScreen, birthdate: BirthdateScreen, gender: GenderScreen, pet: PetScreen, meet: MeetScreen, looking: LookingScreen, consent: ConsentScreen, story: StoryScreen, slots: SlotsScreen };
export const onboardingStepScreen = (step: string | undefined): ComponentType | null => (step ? (STEP_SCREENS[step] ?? null) : null);
export { AccountScreen, VerifyScreen, VerifyFailedScreen, NotificationsScreen, NotificationsRefusedScreen } from './ui/AccountScreens';
export { submitOnboarding, type SubmitPorts, type SubmitReport } from './model/submit';
