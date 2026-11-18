/**
 * Adaptateur réel : service push d'Expo (https://docs.expo.dev/push-notifications/sending-notifications/).
 * - envoi par lots de 100 messages (limite du service), reçus par lots de 1 000 ;
 * - un ticket ou un reçu `DeviceNotRegistered` marque le jeton invalide (l'appelant désactive l'appareil) ;
 * - nouvelle tentative unique avec attente sur 429 / 5xx ; jeton d'accès facultatif (« enhanced push security »).
 * Débit maximal du service : 600 notifications par seconde et par projet.
 */
import type { PushMessage, PushReceipt, PushTicket, Pusher } from './pusher';

export const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
export const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const SEND_BATCH = 100;
const RECEIPTS_BATCH = 1000;
const TIMEOUT_MS = 10_000;

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

const chunks = <T>(items: readonly T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

export class ExpoPusher implements Pusher {
  constructor(
    private readonly accessToken: string | null,
    private readonly doFetch: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  async send(messages: readonly PushMessage[]): Promise<PushTicket[]> {
    const out: PushTicket[] = [];
    for (const batch of chunks(messages, SEND_BATCH)) {
      const body = batch.map((m) => ({ to: m.to, title: m.title, body: m.body, data: m.data, sound: m.sound ?? 'default', ...(m.channelId ? { channelId: m.channelId } : {}), ...(m.categoryId ? { categoryId: m.categoryId } : {}) }));
      const json = await this.post<{ data?: ExpoTicket[] }>(EXPO_SEND_URL, body);
      const tickets = json.data ?? [];
      batch.forEach((_, i) => {
        const t = tickets[i];
        if (t?.status === 'ok' && t.id) out.push({ status: 'ok', id: t.id });
        else out.push({ status: 'error', invalidToken: t?.details?.error === 'DeviceNotRegistered', message: t?.details?.error ?? t?.message ?? 'ticket absent' });
      });
    }
    return out;
  }

  async receipts(ticketIds: readonly string[]): Promise<Map<string, PushReceipt>> {
    const out = new Map<string, PushReceipt>();
    for (const batch of chunks(ticketIds, RECEIPTS_BATCH)) {
      const json = await this.post<{ data?: Record<string, ExpoTicket> }>(EXPO_RECEIPTS_URL, { ids: batch });
      for (const [id, r] of Object.entries(json.data ?? {})) out.set(id, { ok: r.status === 'ok', invalidToken: r.details?.error === 'DeviceNotRegistered' });
    }
    return out;
  }

  private async post<T>(url: string, body: unknown, attempt = 0): Promise<T> {
    const res = await this.doFetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate',
        'content-type': 'application/json',
        ...(this.accessToken ? { authorization: `Bearer ${this.accessToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if ((res.status === 429 || res.status >= 500) && attempt === 0) {
      await this.sleep(1000);
      return this.post<T>(url, body, 1);
    }
    const json = (await res.json().catch(() => null)) as (T & { errors?: { code?: string }[] }) | null;
    if (!res.ok || !json) throw new Error(`Expo push ${res.status} : ${json?.errors?.[0]?.code ?? 'réponse illisible'}`);
    return json;
  }
}
