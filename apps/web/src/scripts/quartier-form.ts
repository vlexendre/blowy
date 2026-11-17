/**
 * « Ouvre ton quartier » (organism QuartierForm) : quartier choisi dans la liste ou par code postal, compteur réel lu à
 * l'API, inscription en double opt-in. Aucun cookie, aucune position : seulement ce que la personne tape.
 */
import type { ZoneStatus } from '@blowy/contract';
import { zoneOfPostalCode } from '@blowy/domain';
import { api, failureOf } from '../lib/api';
import { SITE_URL } from '../config/site';
import { copyText, fill, flash, locale, shareOrCopy, t } from './quiz-i18n';

const q = t.quartier;

export interface QuartierFormOptions {
  /** Quartier déjà choisi (lien `/quartier/<zone>`). */
  zone?: string | null;
  /** Code de la personne qui invite (`?ref=`). */
  ref?: string | null;
}

/** Lien du quartier à partager (`?ref=` : ton code, une fois l'adresse confirmée). */
export const quartierLink = (zone: string, ref?: string | null): string => `${SITE_URL}/quartier/${zone}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;

/** Compteur : barre et « 38 / 50 pour ouvrir Paris 11e ». */
export function renderCounter(root: ParentNode, s: ZoneStatus): void {
  const box = root.querySelector<HTMLElement>('[data-qf-counter]');
  const bar = root.querySelector<HTMLElement>('[data-qf-bar]');
  const text = root.querySelector<HTMLElement>('[data-qf-count]');
  if (!box || !bar || !text) return;
  box.hidden = false;
  bar.style.width = `${s.open ? 100 : Math.min(100, Math.round((s.count / Math.max(1, s.threshold)) * 100))}%`;
  text.textContent = s.open ? fill(q.counterOpen, { zone: s.label }) : fill(q.counter, { count: s.count, threshold: s.threshold, zone: s.label });
}

/** Lien d'invitation, « Inviter » (feuille de partage) et « Copier le lien ». */
export function showInvite(root: ParentNode, s: ZoneStatus, ref: string | null): void {
  const box = root.querySelector<HTMLElement>('[data-qf-invite]');
  if (!box) return;
  const url = quartierLink(s.zone, ref);
  box.hidden = false;
  const out = box.querySelector<HTMLElement>('[data-qf-link]');
  if (out) out.textContent = url.replace(/^https?:\/\//, '');
  const share = box.querySelector<HTMLButtonElement>('[data-qf-share]');
  const copy = box.querySelector<HTMLButtonElement>('[data-qf-copy]');
  if (share)
    share.onclick = async () => {
      const r = await shareOrCopy({ text: fill(q.inviteMessage, { missing: s.missing, zone: s.label }), url });
      if (r === 'copied') flash(share, q.copied);
    };
  if (copy) copy.onclick = async () => void ((await copyText(url)) && flash(copy, q.copied));
}

export function mountQuartierForm(root: HTMLElement, opts: QuartierFormOptions = {}): void {
  const city = root.querySelector<HTMLSelectElement>('[data-qf-city]');
  const districtWrap = root.querySelector<HTMLElement>('[data-qf-district-wrap]');
  const district = root.querySelector<HTMLSelectElement>('[data-qf-district]');
  const postal = root.querySelector<HTMLInputElement>('[data-qf-postal]');
  const email = root.querySelector<HTMLInputElement>('[data-qf-email]');
  const consent = root.querySelector<HTMLInputElement>('[data-qf-consent]');
  const form = root.querySelector<HTMLFormElement>('[data-qf-form]');
  const error = root.querySelector<HTMLElement>('[data-qf-error]');
  const submit = root.querySelector<HTMLButtonElement>('[data-qf-submit]');
  const title = root.querySelector<HTMLElement>('[data-qf-title]');
  const data = JSON.parse(root.querySelector('[data-qf-districts]')?.textContent ?? '{}') as { districts: Record<string, { id: string; n: number }[]>; cities: Record<string, string> };
  const districts = data.districts ?? {};
  const cityZone = data.cities ?? {};
  if (!city || !district || !postal || !email || !consent || !form || !error || !submit) return;

  let zone: string | null = null;
  let seq = 0;

  const setError = (msg: string | null) => {
    error.hidden = !msg;
    error.textContent = msg ?? '';
  };

  async function refresh(): Promise<void> {
    const mine = ++seq;
    if (!zone) {
      const box = root.querySelector<HTMLElement>('[data-qf-counter]');
      if (box) box.hidden = true;
      return;
    }
    try {
      const s = await api.quartiers.status(zone);
      if (mine !== seq) return;
      renderCounter(root, s);
      if (title) title.textContent = fill(q.title, { n: s.threshold });
    } catch {
      // Le compteur est un plus : sans réseau, le formulaire reste utilisable.
    }
  }

  function fillDistricts(c: string, selected?: string): void {
    const list = districts[c] ?? [];
    districtWrap!.hidden = list.length === 0;
    district!.replaceChildren(
      ...list.map((d) => {
        const o = document.createElement('option');
        o.value = d.id;
        o.textContent = locale === 'fr' ? `${d.n}${d.n === 1 ? 'er' : 'e'}` : String(d.n);
        o.selected = d.id === selected;
        return o;
      }),
    );
  }

  function fromList(): void {
    postal!.value = '';
    const c = city!.value;
    if (!c) zone = null;
    else {
      const list = districts[c] ?? [];
      zone = list.length ? district!.value || list[0]!.id : (cityZone[c] ?? null);
    }
    void refresh();
  }

  city.addEventListener('change', () => {
    fillDistricts(city.value);
    fromList();
  });
  district.addEventListener('change', fromList);
  postal.addEventListener('input', () => {
    postal.value = postal.value.replace(/\D/g, '').slice(0, 5);
    if (postal.value.length === 5) {
      const z = zoneOfPostalCode(postal.value);
      zone = z?.id ?? null;
      city.value = '';
      districtWrap!.hidden = true;
      void refresh();
    }
  });

  // Quartier venu du lien : la liste se positionne dessus.
  if (opts.zone) {
    zone = opts.zone;
    const cp = /^cp-(\d{5})$/.exec(opts.zone);
    if (cp) postal.value = cp[1]!;
    else {
      for (const [c, list] of Object.entries(districts)) {
        if (list.some((d) => d.id === opts.zone)) {
          city.value = c;
          fillDistricts(c, opts.zone);
        }
      }
      if (!city.value) {
        const match = Object.entries(cityZone).find(([, id]) => id === opts.zone);
        if (match) city.value = match[0];
      }
    }
    void refresh();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!zone) return setError(q.errors.zone);
    if (!email.checkValidity() || !email.value.trim()) return setError(q.errors.email);
    if (!consent.checked) return setError(q.errors.consent);
    setError(null);
    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = q.sending;
    try {
      const r = await api.quartiers.join({ zone, email: email.value.trim(), consent: true, locale, ...(opts.ref ? { ref: opts.ref } : {}) });
      renderCounter(root, r.status);
      form.hidden = true;
      const sent = root.querySelector<HTMLElement>('[data-qf-sent]');
      if (sent) sent.hidden = false;
      // Avant confirmation, le lien du quartier sans code : il fait déjà avancer le quartier.
      showInvite(root, r.status, null);
    } catch (err) {
      const kind = failureOf(err);
      setError(kind === 'invalid' ? q.errors.email : kind === 'not_found' ? q.errors.zone : kind === 'rate_limited' ? q.errors.busy : q.errors.generic);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
}
