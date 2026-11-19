/**
 * Qui est l'app (docs/VERSIONING.md) : version, numéro de build natif et plateforme, envoyés à l'API sur chaque requête
 * (`x-app-version`, `x-app-build`, `x-app-platform`). Le numéro de build est celui du binaire installé (CFBundleVersion
 * sur iPhone, posé par EAS) : une mise à jour par OTA ne le change pas. Expo Go et le web n'en ont pas : jamais bloqués.
 */
import type { ClientInfo } from '@blowy/api-client';
import { type AppPlatform, isAppPlatform, parseBuildNumber } from '@blowy/domain';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function nativeBuild(): string | null {
  if (Platform.OS === 'ios') return Constants.platform?.ios?.buildNumber ?? null;
  if (Platform.OS === 'android') {
    const code = Constants.platform?.android?.versionCode;
    return code === null || code === undefined ? null : String(code);
  }
  return null;
}

const identity = {
  platform: Platform.OS,
  version: Constants.expoConfig?.version ?? null,
  build: nativeBuild(),
};

export const clientInfo = (): ClientInfo => identity;

/** Plateforme de l'app qui a un build (null : web). */
export const appPlatform: AppPlatform | null = isAppPlatform(identity.platform) ? identity.platform : null;

/** Numéro de build de ce binaire (null : inconnu, Expo Go, web). */
export const appBuild: number | null = parseBuildNumber(identity.build);
