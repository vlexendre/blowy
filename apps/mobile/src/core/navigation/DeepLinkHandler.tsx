/**
 * Liens entrants hors Expo Router : taps sur notification (url dans data) → route interne.
 * Les liens universels / schéma `blowy://` sont gérés par Expo Router via app/+native-intent.
 */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useServices } from '../providers/services';
import { resolveIncomingUrl } from './paths';

export function DeepLinkHandler() {
  const { notifications } = useServices();
  useEffect(() => notifications.onOpen((url) => router.push(resolveIncomingUrl(url) as never)), [notifications]);
  return null;
}
