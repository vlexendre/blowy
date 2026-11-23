/** Web : pas de notifications push (même interface que `push.ts`, sans effet). */
export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

export function setForegroundHandler(_isOpen?: (data: unknown) => boolean): void {}
export const MUTE_CATEGORY = 'minimoa_mute';
export const MUTE_ACTION = 'mute';
export async function registerMuteCategory(_buttonTitle: string): Promise<void> {}
export const REPLY_ACTION = 'reply';
export async function registerReplyCategory(_t: {
  action: string;
  send: string;
  placeholder: string;
  mute: string;
}): Promise<void> {}
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
export async function takeLaunchTap(): Promise<{
  data: unknown;
  id: string;
  action?: string;
  text?: string;
} | null> {
  return null;
}
export function onTap(
  _listener: (tap: { data: unknown; id: string; action?: string; text?: string }) => void,
): () => void {
  return () => undefined;
}
