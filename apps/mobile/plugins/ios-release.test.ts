/// <reference types="node" />
/**
 * Garde-fous de la sortie iOS (audit App Store, docs/AUDIT-APPLE.md) : échoue si un manifeste de confidentialité
 * disparaît ou perd une raison, si une autorisation inutile revient, ou si un texte d'autorisation manque dans une langue.
 * La vérification complète se fait sur le projet généré (`npx expo prebuild --platform ios --clean`, docs/APP-STORE-CONNECT.md).
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { ExpoConfig } from 'expo/config';
import { describe, expect, it } from 'vitest';

import appConfig from '../app.config';

const require = createRequire(__filename);
const mobile = path.resolve(__dirname, '..');
const plist = require('@expo/plist') as { default: { parse: (xml: string) => Record<string, unknown> } };
const release = require('./with-ios-release.js') as { patchWidgetBuildSettings: (pbx: string, o: { family: string; version: string }) => string };

const config = appConfig({ config: {} } as Parameters<typeof appConfig>[0]) as ExpoConfig;
type ApiType = { NSPrivacyAccessedAPIType: string; NSPrivacyAccessedAPITypeReasons: string[] };
const reasonsOf = (types: readonly ApiType[] | undefined, category: string): string[] =>
  types?.find((t) => t.NSPrivacyAccessedAPIType === `NSPrivacyAccessedAPICategory${category}`)?.NSPrivacyAccessedAPITypeReasons ?? [];
const readManifest = (file: string) => plist.default.parse(fs.readFileSync(path.join(mobile, file), 'utf8'));

/** Les seules autorisations que l'app demande (Info.plist). */
const PURPOSES = ['NSCameraUsageDescription', 'NSLocationWhenInUseUsageDescription', 'NSPhotoLibraryUsageDescription'];

describe('manifestes de confidentialité (B4)', () => {
  it("app : pas de pistage, UserDefaults de l'app et du groupe d'apps, raisons des bibliothèques liées, données déclarées", () => {
    const m = config.ios?.privacyManifests;
    expect(m).toBeDefined();
    expect(m?.NSPrivacyTracking).toBe(false);
    expect(m?.NSPrivacyTrackingDomains ?? []).toEqual([]);
    const types = m?.NSPrivacyAccessedAPITypes as ApiType[] | undefined;
    expect(reasonsOf(types, 'UserDefaults')).toEqual(expect.arrayContaining(['CA92.1', '1C8F.1']));
    expect(reasonsOf(types, 'FileTimestamp')).toContain('C617.1');
    expect(reasonsOf(types, 'SystemBootTime')).toContain('35F9.1');
    expect(reasonsOf(types, 'DiskSpace').length).toBeGreaterThan(0);
    const collected = (m?.NSPrivacyCollectedDataTypes ?? []) as { NSPrivacyCollectedDataType: string; NSPrivacyCollectedDataTypeTracking: boolean; NSPrivacyCollectedDataTypeLinked: boolean }[];
    expect(collected.length).toBeGreaterThan(5);
    for (const c of collected) {
      expect(c.NSPrivacyCollectedDataTypeTracking).toBe(false);
      expect(c.NSPrivacyCollectedDataTypeLinked).toBe(true);
    }
    for (const t of ['EmailAddress', 'PhotosorVideos', 'EmailsOrTextMessages', 'SensitiveInfo', 'PurchaseHistory', 'CoarseLocation']) {
      expect(collected.map((c) => c.NSPrivacyCollectedDataType)).toContain(`NSPrivacyCollectedDataType${t}`);
    }
    // Position : jamais gardée exacte (maille de ~300 m côté API, audit M6) : approximative, pas précise.
    expect(collected.map((c) => c.NSPrivacyCollectedDataType)).not.toContain('NSPrivacyCollectedDataTypePreciseLocation');
  });

  it("extension des widgets : son propre manifeste, UserDefaults du groupe d'apps (1C8F.1), rien de collecté", () => {
    const m = readManifest('targets/widget/PrivacyInfo.xcprivacy');
    expect(m.NSPrivacyTracking).toBe(false);
    expect(m.NSPrivacyCollectedDataTypes).toEqual([]);
    expect(reasonsOf(m.NSPrivacyAccessedAPITypes as ApiType[], 'UserDefaults')).toEqual(['1C8F.1']);
    // Le code partagé de l'extension n'utilise pas d'autre API à raison déclarée.
    const shared = fs.readFileSync(path.join(mobile, 'modules/blowy-widgets/ios/BlowyShared.swift'), 'utf8');
    expect(shared).toContain('UserDefaults(suiteName:');
    for (const api of ['systemUptime', 'mach_absolute_time', 'creationDate', 'modificationDate', 'volumeAvailableCapacity', 'activeInputModes']) {
      expect(shared).not.toContain(api);
    }
  });

  it('module natif local : manifeste livré dans son pod (UserDefaults de l’app et du groupe)', () => {
    const m = readManifest('modules/blowy-widgets/ios/PrivacyInfo.xcprivacy');
    expect(m.NSPrivacyTracking).toBe(false);
    expect(reasonsOf(m.NSPrivacyAccessedAPITypes as ApiType[], 'UserDefaults')).toEqual(['CA92.1', '1C8F.1']);
    const podspec = fs.readFileSync(path.join(mobile, 'modules/blowy-widgets/ios/BlowyWidgets.podspec'), 'utf8');
    expect(podspec).toMatch(/resource_bundles = \{ 'BlowyWidgets_privacy' => \['PrivacyInfo\.xcprivacy'\] \}/);
  });
});

describe('autorisations iOS', () => {
  it('seulement caméra, position pendant l’utilisation et photothèque ; aucun texte générique de module', () => {
    const info = config.ios?.infoPlist ?? {};
    const usage = Object.keys(info).filter((k) => /UsageDescription/.test(k));
    expect(usage.sort()).toEqual([...PURPOSES].sort());
    const plugins = (config.plugins ?? []) as (string | [string, Record<string, unknown>])[];
    const options = (name: string) => (plugins.find((p) => Array.isArray(p) && p[0] === name) as [string, Record<string, unknown>] | undefined)?.[1] ?? {};
    expect(options('expo-location')).toMatchObject({
      locationAlwaysAndWhenInUsePermission: false,
      locationAlwaysPermission: false,
      motionUsagePermission: false,
      locationFullAccuracyPermission: false,
      isIosBackgroundLocationEnabled: false,
    });
    expect(options('expo-secure-store')).toMatchObject({ faceIDPermission: false });
    expect(options('expo-camera')).toMatchObject({ microphonePermission: false });
    expect(options('expo-image-picker')).toMatchObject({ microphonePermission: false });
    expect(info.ITSAppUsesNonExemptEncryption).toBe(false);
    expect(config.ios?.supportsTablet).toBe(false);
  });

  it('chaque langue déclarée a les trois textes ; le français est celui de l’Info.plist et dit vrai', () => {
    const info = config.ios?.infoPlist ?? {};
    for (const [lang, file] of Object.entries(config.locales ?? {})) {
      const strings = (JSON.parse(fs.readFileSync(path.join(mobile, String(file)), 'utf8')) as { ios: Record<string, string> }).ios;
      expect(Object.keys(strings).sort(), lang).toEqual([...PURPOSES].sort());
      for (const k of PURPOSES) expect(strings[k]?.length ?? 0, `${lang} ${k}`).toBeGreaterThan(20);
    }
    for (const k of PURPOSES) expect(info[k]).toBe((JSON.parse(fs.readFileSync(path.join(mobile, 'locales/fr.json'), 'utf8')) as { ios: Record<string, string> }).ios[k]);
    const camera = String(info.NSCameraUsageDescription);
    expect(camera).toMatch(/IA/);
    expect(camera).not.toMatch(/vue par personne|n’est vue par personne|photo du jour/);
    expect(String(info.NSPhotoLibraryUsageDescription)).not.toMatch(/photo du jour/);
    // La position n'est jamais gardée exacte : le texte le dit, et ne promet rien d'autre.
    expect(String(info.NSLocationWhenInUseUsageDescription)).toMatch(/300 m/);
    expect(String(info.NSLocationWhenInUseUsageDescription)).not.toMatch(/arrière-plan|en continu/);
  });

  it('jetons APNs : production pour les builds EAS hors développement', () => {
    const at = (env: Record<string, string | undefined>) => {
      const saved = { ...process.env };
      for (const [k, v] of Object.entries(env)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      try {
        return (appConfig({ config: {} } as Parameters<typeof appConfig>[0]) as ExpoConfig).ios?.entitlements?.['aps-environment'];
      } finally {
        process.env = saved;
      }
    };
    expect(at({ EAS_BUILD_PROFILE: 'production', BLOWY_APS_ENVIRONMENT: undefined })).toBe('production');
    expect(at({ EAS_BUILD_PROFILE: 'preview', BLOWY_APS_ENVIRONMENT: undefined })).toBe('production');
    expect(at({ EAS_BUILD_PROFILE: 'development', BLOWY_APS_ENVIRONMENT: undefined })).toBe('development');
    const eas = JSON.parse(fs.readFileSync(path.join(mobile, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    expect(eas.build.production?.env?.BLOWY_APS_ENVIRONMENT).toBe('production');
    expect(eas.build.preview?.env?.BLOWY_APS_ENVIRONMENT).toBe('production');
  });
});

describe('extension des widgets dans le projet Xcode', () => {
  const pbx = (family: string, version: string) =>
    [
      '\t\tA = {',
      '\t\t\tbuildSettings = {',
      '\t\t\t\tINFOPLIST_FILE = Blowy/Info.plist;',
      '\t\t\t\tMARKETING_VERSION = 1.0.0;',
      '\t\t\t\tTARGETED_DEVICE_FAMILY = 1;',
      '\t\t\t};',
      '\t\tB = {',
      '\t\t\tbuildSettings = {',
      '\t\t\t\tINFOPLIST_FILE = ../targets/widget/Info.plist;',
      `\t\t\t\tMARKETING_VERSION = ${version};`,
      `\t\t\t\tTARGETED_DEVICE_FAMILY = ${family};`,
      '\t\t\t};',
    ].join('\n');

  it('iPhone seulement comme l’app, et même version ; refuse une version différente', () => {
    const out = release.patchWidgetBuildSettings(pbx('"1,2"', '1.0.0'), { family: '1', version: '1.0.0' });
    expect(out.match(/TARGETED_DEVICE_FAMILY = 1;/g)).toHaveLength(2);
    expect(out).not.toContain('"1,2"');
    expect(() => release.patchWidgetBuildSettings(pbx('"1,2"', '0.9.0'), { family: '1', version: '1.0.0' })).toThrow(/version/);
    expect(fs.existsSync(path.join(mobile, 'targets/widget/PrivacyInfo.xcprivacy'))).toBe(true);
  });
});
