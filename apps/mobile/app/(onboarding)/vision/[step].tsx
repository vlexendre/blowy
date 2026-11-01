import { useLocalSearchParams } from 'expo-router';
import { VisionStepScreen, type VisionStep } from '../../../src/features/onboarding';

const STEPS: readonly VisionStep[] = ['school', 'sunday', 'passions', 'limit'];

/** Les 4 écrans de vision partagent une route dynamique et un composant paramétré. */
export default function VisionRoute() {
  const { step } = useLocalSearchParams<{ step: string }>();
  return <VisionStepScreen step={STEPS.find((s) => s === step) ?? 'school'} />;
}
