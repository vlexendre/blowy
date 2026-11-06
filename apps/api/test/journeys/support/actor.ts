/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON dynamiques des routes absentes du client typé */
/**
 * Fabrique de « personnes » : chaque personne a un compte local, un ou plusieurs appareils
 * (session + socket WS), un profil, un pet, une vision, une intention et une zone.
 * Toutes les écritures passent par l'API publique : `@blowy/api-client` (BlowyClient, réponses
 * validées par les contrats Zod) et, pour les routes que le client typé n'expose pas encore
 * (médias, confiance, social, économie), le même `HttpTransport` du paquet api-client.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { io, type Socket } from 'socket.io-client';
import { BlowyApiError, BlowyClient, HttpTransport, RealtimeSync, WS_PATH, type WsEnvelope } from '@blowy/api-client';
import type { World } from './world.js';

export type Gender = 'WOMAN' | 'MAN' | 'NON_BINARY';
export type Intention = 'FRIENDS_ONE' | 'FRIENDS_GROUP' | 'OPEN_TO_MORE' | 'LET_IT_HAPPEN';
export type Species = 'NINO' | 'GASTON' | 'PIA' | 'SUZIE';

export interface Vision {
  axes: { kindMischief: number; sportyContemplative: number; scienceArt: number; homeAdventure: number };
  school: string;
  sunday: string;
  passions: string[];
  limit: string;
}

export interface PersonSpec {
  key: string;
  displayName: string;
  gender: Gender;
  seeking: Gender[];
  birthDate?: string;
  intention?: Intention;
  species?: Species;
  petName?: string;
  vision?: Vision;
  ageMin?: number;
  ageMax?: number;
  /** V5.4 (A.5) : choix « Discret » / « Normal » à l’onboarding (défaut des parcours : Normal). */
  discreetMode?: boolean;
}

export const DEFAULT_VISION: Vision = {
  axes: { kindMischief: 0.2, sportyContemplative: -0.1, scienceArt: 0.3, homeAdventure: 0.4 },
  school: 'AUTODIDACTE',
  sunday: 'BRUNCH',
  passions: ['MUSIQUE', 'CUISINE'],
  limit: 'MENTIR',
};

/** Résultat d'une tentative : jamais d'exception, pour vérifier aussi les refus. */
export interface Attempt<T = any> {
  ok: boolean;
  status: number;
  code: string | null;
  data: T;
  error: unknown;
}

export async function attempt<T>(fn: () => Promise<T>): Promise<Attempt<T>> {
  try {
    const data = await fn();
    return { ok: true, status: 200, code: null, data, error: null };
  } catch (e) {
    if (e instanceof BlowyApiError) return { ok: false, status: e.status, code: e.code, data: e.error as any, error: e };
    // Erreur de contrat (réponse non conforme au schéma Zod) ou réseau : statut 0.
    return { ok: false, status: 0, code: (e as Error).name === 'ZodError' ? 'CONTRACT_MISMATCH' : 'CLIENT_ERROR', data: null as any, error: e };
  }
}

/** Un appareil : session propre + socket Socket.IO + RealtimeSync (curseurs par room). */
export class Device {
  readonly events: WsEnvelope[] = [];
  readonly revoked: string[] = [];
  readonly rawSync: unknown[] = [];
  disconnected = false;
  socket: Socket | null = null;
  sync: RealtimeSync | null = null;

  constructor(
    private readonly world: World,
    readonly label: string,
    public token: string,
    readonly sessionId: string,
  ) {}

  async connect(): Promise<this> {
    const s = io(this.world.baseUrl, { path: WS_PATH, auth: { token: this.token }, transports: ['websocket'], reconnection: false, forceNew: true });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`WS ${this.label}: pas d'authenticated`)), 4000);
      s.once('authenticated', () => {
        clearTimeout(t);
        resolve();
      });
      s.once('connect_error', (e) => {
        clearTimeout(t);
        reject(e);
      });
    });
    s.on('access.revoked', (p: any) => this.revoked.push(p?.room ?? '?'));
    s.on('disconnect', () => {
      this.disconnected = true;
    });
    s.on('sync', (p: unknown) => this.rawSync.push(p));
    this.socket = s;
    this.sync = new RealtimeSync(s as any, (e) => this.events.push(e));
    this.disconnected = false;
    return this;
  }

  /** Rejoint une room ; false si refusé par le serveur (appartenance). */
  async join(room: string, sinceCursor: string | null = null): Promise<boolean> {
    if (!this.sync) throw new Error('socket non connecté');
    return this.sync.join(room, sinceCursor);
  }

  /** Rejoint sans RealtimeSync (pour observer la réponse brute du serveur). */
  emit<T = any>(event: string, payload: unknown, timeoutMs = 2000): Promise<T | 'TIMEOUT'> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve('TIMEOUT');
      const t = setTimeout(() => resolve('TIMEOUT'), timeoutMs);
      this.socket.emit(event, payload, (r: T) => {
        clearTimeout(t);
        resolve(r);
      });
    });
  }

  types(): string[] {
    return this.events.map((e) => e.type);
  }

  /** Attend un événement satisfaisant le prédicat (relance un resync à chaque tour). */
  async waitFor(pred: (e: WsEnvelope) => boolean, timeoutMs = 1500): Promise<WsEnvelope | null> {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const hit = this.events.find(pred);
      if (hit) return hit;
      await new Promise((r) => setTimeout(r, 40));
    }
    return this.events.find(pred) ?? null;
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.disconnected = true;
  }
}

/** Une personne simulée. */
export class Person {
  readonly client: BlowyClient;
  readonly http: HttpTransport;
  token: string | null = null;
  userId = '';
  petId = '';
  devices: Device[] = [];

  constructor(
    readonly world: World,
    readonly spec: PersonSpec,
  ) {
    const opts = { baseUrl: world.baseUrl, getToken: () => this.token, timeoutMs: 20_000 };
    this.client = new BlowyClient(opts);
    this.http = new HttpTransport(opts);
  }

  get name() {
    return this.spec.displayName;
  }

  /** Appel brut via le transport du client (routes non exposées par BlowyClient). */
  call<T = any>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown, commandId?: string): Promise<Attempt<T>> {
    return attempt(() => this.http.request(method, path, null, body, commandId ? { commandId } : undefined) as Promise<T>);
  }

  /** Requête binaire / publique (upload, contenu média). */
  async raw(method: string, path: string, body?: Buffer, headers: Record<string, string> = {}, token: string | null = this.token): Promise<{ status: number; headers: { get(name: string): string | null }; buf: Buffer; json: () => any }> {
    const res = await fetch(`${this.world.baseUrl}${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, ...(body ? { body: new Uint8Array(body) } : {}) });
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: res.headers, buf, json: () => (buf.length ? JSON.parse(buf.toString('utf8')) : null) };
  }

  /** Ouvre une session (un « téléphone ») ; la première devient la session courante. */
  async signIn(label = 'iphone'): Promise<{ token: string; sessionId: string }> {
    const s = await this.client.auth.signIn({ provider: 'local', credential: this.spec.key, device: { platform: 'ios', label } } as any);
    const token = (s as any).accessToken as string;
    const sessionId = ((s as any).sessionId ?? token.split('.')[0]) as string;
    if (!this.token) this.token = token;
    this.userId = (s as any).userId;
    return { token, sessionId };
  }

  /** Ajoute un appareil connecté en WS (session distincte). */
  async device(label: string): Promise<Device> {
    const { token, sessionId } = await this.signIn(label);
    const d = await new Device(this.world, label, token, sessionId).connect();
    await d.join(`user:${this.userId}`);
    this.devices.push(d);
    return d;
  }

  get phone(): Device {
    const d = this.devices[0];
    if (!d) throw new Error(`${this.name} n'a pas d'appareil connecté`);
    return d;
  }

  /** Onboarding complet, écran par écran, comme l'app mobile. */
  async onboard(): Promise<void> {
    const s = this.spec;
    if (!this.token) await this.signIn();
    await this.client.me.update({ displayName: s.displayName, gender: s.gender, birthDate: s.birthDate ?? '1997-03-14', zoneCode: this.world.zone, timezone: 'Europe/Paris' } as any);
    await this.client.me.setMatchPreferences({ ageMin: s.ageMin ?? 18, ageMax: s.ageMax ?? 45, maxDistanceKm: 10, seekingGenders: s.seeking, intention: s.intention ?? 'LET_IT_HAPPEN', widenConsented: false } as any);
    await this.client.me.recordConsents({ items: ['TERMS', 'PRIVACY', 'AI_MODERATION'].map((purpose) => ({ purpose, version: '2026-11', granted: true })) } as any);
    const pet = await this.client.pets.create({ name: s.petName ?? `${s.displayName}-pet`, species: s.species ?? 'NINO', vision: (s.vision ?? DEFAULT_VISION) as any });
    this.petId = pet.id;
    await this.client.me.startVerification('SELFIE_QUALITY');
    // V5.4 (A.5) : choix explicite « Discret » / « Normal » (aucun défaut).
    await this.client.me.setPrivacy({ discreetMode: s.discreetMode ?? false });
    await this.client.me.completeOnboarding();
  }

  /** Raccourcis lisibles dans les histoires. */
  feed() {
    return this.client.matching.feed();
  }
  async relationship(id: string) {
    return attempt(() => this.client.relationships.get(id));
  }
  async messages(convId: string) {
    return attempt(() => this.client.conversations.messages(convId, { limit: 100 }));
  }
  say(convId: string, body: string, clientMessageId = `m-${randomUUID()}`) {
    return attempt(() => this.client.conversations.send(convId, { clientMessageId, body }));
  }
}

export const visitorToken = () => randomBytes(24).toString('base64url');

/** Requête publique (web, sans compte). */
export async function publicCall(world: World, method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${world.baseUrl}${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await res.text();
  let parsed: any;
  try {
    parsed = t ? JSON.parse(t) : null;
  } catch {
    parsed = t;
  }
  return { status: res.status, body: parsed };
}

/** Crée et onboarde plusieurs personnes. */
export async function cast<const T extends readonly PersonSpec[]>(world: World, specs: T): Promise<{ [K in keyof T]: Person }> {
  const out: Person[] = [];
  for (const s of specs) {
    const p = new Person(world, s);
    await p.onboard();
    out.push(p);
  }
  return out as { [K in keyof T]: Person };
}
