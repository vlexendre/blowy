/**
 * Observateur WS multi-acteurs : « qui a vu quoi ». Réutilisable pour les tranches V5
 * (chat de groupe d'une sortie, votes secrets après sortie, bande) : on enregistre un
 * point de repère, on agit, puis on demande ce que chaque appareil a reçu depuis.
 */
import type { WsEnvelope } from '@blowy/api-client';
import type { Device, Person } from './actor.js';

export class Observers {
  private marks = new Map<Device, number>();
  constructor(private readonly people: Person[]) {}

  private devices(): [Person, Device][] {
    return this.people.flatMap((p) => p.devices.map((d) => [p, d] as [Person, Device]));
  }

  /** Point de repère : les événements reçus avant ne comptent plus. */
  mark(): this {
    for (const [, d] of this.devices()) this.marks.set(d, d.events.length);
    return this;
  }

  /** Événements reçus depuis le repère, par appareil. */
  since(d: Device): WsEnvelope[] {
    return d.events.slice(this.marks.get(d) ?? 0);
  }

  /** { "Léa/iphone": ["message.published", …], … } */
  snapshot(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const [p, d] of this.devices()) out[`${p.name}/${d.label}`] = this.since(d).map((e) => e.type);
    return out;
  }

  /** Personnes dont au moins un appareil a reçu un événement contenant `needle`. */
  whoSaw(needle: string): string[] {
    return [...new Set(this.devices().filter(([, d]) => this.since(d).some((e) => JSON.stringify(e).includes(needle))).map(([p]) => p.name))];
  }

  /** Attend que chaque personne listée ait reçu un événement du type donné. */
  async waitAll(type: string, who: Person[], timeoutMs = 1500): Promise<string[]> {
    const end = Date.now() + timeoutMs;
    const missing = () => who.filter((p) => !p.devices.some((d) => this.since(d).some((e) => e.type === type))).map((p) => p.name);
    while (Date.now() < end && missing().length) await new Promise((r) => setTimeout(r, 40));
    return missing();
  }
}
