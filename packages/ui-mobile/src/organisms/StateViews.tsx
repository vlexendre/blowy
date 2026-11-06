/**
 * États transverses : vide, erreur, chargement, indisponible (endpoint non livré), hors ligne.
 * Toujours un texte explicite + une action quand elle existe.
 */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { color, space } from '../foundations/theme';
import { Button } from '../atoms/Button';
import { Sprite } from '../atoms/Sprite';
import { Text } from '../atoms/Text';
import { Banner } from '../molecules/Banner';

export interface StateViewProps {
  title: string;
  message?: string;
  illustrationPath?: string | null;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}

export function EmptyState({
  title,
  message,
  illustrationPath,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  testID,
}: StateViewProps) {
  return (
    <View style={styles.wrap} testID={testID}>
      {illustrationPath ? <Sprite path={illustrationPath} size={150} /> : null}
      <Text variant="displayM" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" tone="inkSoft" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
      {secondaryLabel && onSecondary ? (
        <Button label={secondaryLabel} variant="secondary" onPress={onSecondary} />
      ) : null}
    </View>
  );
}

export function ErrorState(props: StateViewProps) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.flex}>
      <EmptyState {...props} />
    </View>
  );
}

/** Fonction prévue mais dont l'endpoint n'est pas encore disponible : jamais de fausses données. */
export function UnavailableState(props: StateViewProps) {
  return <EmptyState {...props} />;
}

export function LoadingState({ label }: { label: string }) {
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator color={color.ink} size="large" />
      <Text variant="small" tone="muted">
        {label}
      </Text>
    </View>
  );
}

export function OfflineBanner({
  message,
  pendingCount,
  pendingLabel,
}: {
  message: string;
  pendingCount?: number;
  pendingLabel?: string;
}) {
  return (
    <Banner
      message={pendingCount && pendingLabel ? `${message} · ${pendingLabel}` : message}
      icon="wifiOff"
      tone="ink"
      live
      testID="offline-banner"
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
    alignSelf: 'stretch',
  },
  flex: { flex: 1, justifyContent: 'center' },
});
