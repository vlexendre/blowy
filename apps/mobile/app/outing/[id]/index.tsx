import { useLocalSearchParams } from 'expo-router';
import { OutingScreen } from '../../../src/features/outings';

export default function OutingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OutingScreen id={id} />;
}
