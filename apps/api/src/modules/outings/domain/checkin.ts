/**
 * Check-in (spec-v5 §2.8, D-023) : position ponctuelle comparée au lieu, JAMAIS stockée ni renvoyée
 * (seuls le résultat et une tranche de précision sont gardés) ; repli par code à 4 chiffres dérivé
 * du secret du lieu et de l'heure de la sortie (HOTP simplifié, HMAC-SHA256).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CheckInResult } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';

const R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distance (m) entre deux points ; usage interne seulement (jamais exposée). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function geoCheckIn(p: { lat: number; lng: number; accuracyM: number }, venue: { lat: number; lng: number }, t: Tuning): CheckInResult {
  if (p.accuracyM > t.safety.checkinMaxAccuracyMeters) return 'LOW_ACCURACY';
  return distanceMeters(p, venue) <= t.safety.checkinRadiusMeters ? 'ACCEPTED' : 'TOO_FAR';
}

/** Code du chevalet : 4 chiffres, propres au lieu et au créneau. */
export function venueCode(secret: string, startsAt: Date): string {
  const mac = createHmac('sha256', secret).update(`checkin:${startsAt.getTime()}`).digest();
  const off = mac[mac.length - 1]! & 0x0f;
  const n = ((mac[off]! & 0x7f) << 24) | (mac[off + 1]! << 16) | (mac[off + 2]! << 8) | mac[off + 3]!;
  return String(n % 10_000).padStart(4, '0');
}

export function codeMatches(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
