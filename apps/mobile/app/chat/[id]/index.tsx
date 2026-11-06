import { useLocalSearchParams } from 'expo-router';
import { ConversationScreen } from '../../../src/features/chats';

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ConversationScreen id={id} />;
}
