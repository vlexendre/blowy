export interface CameraPermissionPort {
  request(): Promise<'granted' | 'denied'>;
  openSettings(): Promise<void>;
}
