/** Web : pas de notifications push (même interface que `push.ts`, sans effet). */
export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

export function setForegroundHandler(): void {}
export async function getPermission(): Promise<PushPermission> {
  return 'unsupported';
}
export async function requestPermission(): Promise<PushPermission> {
  return 'unsupported';
}
export async function getPushToken(): Promise<string | null> {
  return null;
}
export async function storedPushToken(): Promise<string | null> {
  return null;
}
export async function forgetPushToken(): Promise<void> {}
export const pushPlatform = (): 'ios' | 'android' | null => null;
export async function takeLaunchTap(): Promise<{ data: unknown; id: string } | null> {
  return null;
}
export function onTap(_listener: (tap: { data: unknown; id: string }) => void): () => void {
  return () => undefined;
}
