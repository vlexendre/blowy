export type LocationPermission = 'granted' | 'denied' | 'undetermined';

/** Position volontairement approximative : arrondie côté client (≈ 500 m) avant tout envoi. */
export interface ApproxLocation {
  lat: number;
  lng: number;
  accuracyMeters: number;
}

export interface LocationPort {
  getForegroundPermission(): Promise<LocationPermission>;
  requestForegroundPermission(): Promise<LocationPermission>;
  /** Arrière-plan : uniquement pour le partage ange gardien, opt-in explicite. */
  requestBackgroundPermission(): Promise<LocationPermission>;
  getApproximate(): Promise<ApproxLocation | null>;
}

/** Arrondi à une grille d'environ `meters` (≈ 0,0045° ~ 500 m). Pur, testé. */
export function blurLocation(lat: number, lng: number, meters = 500): ApproxLocation {
  const step = meters / 111_000;
  const lngStep = step / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  return {
    lat: Math.round(lat / step) * step,
    lng: Math.round(lng / lngStep) * lngStep,
    accuracyMeters: meters,
  };
}
