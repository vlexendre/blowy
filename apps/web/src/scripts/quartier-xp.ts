/**
 * « Ouvre ton quartier », l'expérience (organism QuartierExpedition) : intro de Nino (une fois par visite, passable,
 * jamais avec « réduire les animations »), carte des quartiers qui ont du monde (contours chargés à la demande depuis
 * /geo/quartiers.json, aucun service externe), vol vers le quartier choisi, jauge réelle, inscription en double opt-in,
 * pass de fondateur·rice à partager, classement réel (`GET /v1/quartiers`).
 * Rien n'est inventé : sans données, la ligne « en direct » et le classement restent cachés. Si une animation échoue,
 * le formulaire reste un formulaire (tout est dans la page, les animations ne font qu'accompagner).
 */
import type { QuartierBoard, ZoneStatus } from '@blowy/contract';
import { SPECIES, ZONES, ZONE_CITIES, type Species, type Zone, zoneById, zoneOfPostalCode } from '@blowy/domain';
import { zoneLabel } from '@blowy/content';
import { api, failureOf } from '../lib/api';
import { MAP_H, MAP_W, project, type QuartierMapData } from '../lib/quartier-map';
import { highlight, quartierXpCopy } from '../content/quartier';
import { SPECIES_NAMES } from '../content/quiz';
import { copyText, fill, flash, locale, shareOrCopy, t } from './quiz-shared';
import { quartierLink } from './quartier-form';

const q = t.quartier;
const x = quartierXpCopy[locale];
const INTRO_KEY = 'minimoa:quartier-intro';
const still = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Poses de chaque minimoa : sur la carte, et quand le pass est pris. */
const POSE: Record<Species, { map: string; happy: string }> = {
  nino: { map: '/img/m/nino_coucou.webp', happy: '/img/m/nino_danse.webp' },
  suzie: { map: '/img/m/suzie_coucou.webp', happy: '/img/m/suzie_danse.webp' },
  gaston: { map: '/img/m/gaston_joie.webp', happy: '/img/m/gaston_danse.webp' },
  pia: { map: '/img/m/pia_coucou.webp', happy: '/img/m/pia_danse.webp' },
};
const SPECIES_COLOR: Record<Species, string> = { nino: 'var(--color-lime)', suzie: 'var(--color-rose)', gaston: 'var(--color-orange)', pia: 'var(--color-violet)' };

export interface QuartierXpOptions {
  /** Quartier du lien `/quartier/<zone>`. */
  zone?: string | null;
  /** Code de la personne qui invite (`?ref=`). */
  ref?: string | null;
}

const labelOf = (id: string): string => {
  const z = zoneById(id);
  return z ? zoneLabel(z, locale) : id;
};

/** Petite animation (WAAPI) qui n'empêche jamais la suite si le navigateur ne sait pas la jouer. */
function play(el: Element, frames: Keyframe[], o: KeyframeAnimationOptions): Promise<void> {
  if (still() || typeof el.animate !== 'function') return Promise.resolve();
  try {
    return el.animate(frames, o).finished.then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

// ── Intro ────────────────────────────────────────────────────────────────
function sparkle(host: HTMLElement): void {
  if (still()) return;
  const r = host.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    const bubble = i % 3 === 0;
    const el = document.createElement('i');
    el.className = bubble ? 'qx-bubble' : 'qx-spark';
    const size = bubble ? 10 + Math.random() * 18 : 12 + Math.random() * 16;
    el.style.width = el.style.height = `${size}px`;
    const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
    const cx = r.width / 2 + Math.cos(a) * r.width * 0.42;
    const cy = r.height / 2 + Math.sin(a) * r.height * 0.7;
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    if (!bubble && i % 2) el.style.background = i % 4 === 1 ? 'var(--rose)' : '#fff';
    host.appendChild(el);
    void play(
      el,
      [
        { transform: 'translate(-50%,-50%) scale(0) rotate(0)', opacity: 0 },
        { transform: `translate(-50%,-50%) translate(${Math.cos(a) * 18}px,${Math.sin(a) * 18}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(-50%,-50%) translate(${Math.cos(a) * 34}px,${Math.sin(a) * 34 - 10}px) scale(.4) rotate(180deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 500, delay: i * 30, easing: 'cubic-bezier(.2,.8,.2,1)' },
    ).then(() => el.remove());
  }
}

/** Nino parle, une ligne à la fois. Rend la main à la fin, au premier clic, à « Passer » ou à Échap. */
function playIntro(root: HTMLElement, lines: readonly string[]): Promise<void> {
  const box = root.querySelector<HTMLElement>('[data-qx-intro]');
  const host = root.querySelector<HTMLElement>('[data-qx-lines]');
  const skip = root.querySelector<HTMLButtonElement>('[data-qx-skip]');
  let seen = false;
  try {
    seen = sessionStorage.getItem(INTRO_KEY) === '1';
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    // Navigation privée stricte : l'intro joue, c'est tout.
  }
  if (!box || !host || !skip || seen || still() || lines.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    const timers: number[] = [];
    let over = false;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = 'hidden';
    // Au-dessus de la barre du haut (le contenu de la page vit dans son propre plan, sous la barre).
    document.body.appendChild(box);
    box.hidden = false;
    skip.focus({ preventScroll: true });
    const pet = box.querySelector('.qx-intro-pet');
    if (pet) void play(pet, [{ transform: 'translateY(60px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.3,1.5,.5,1)' });

    const finish = () => {
      if (over) return;
      over = true;
      timers.forEach((id) => window.clearTimeout(id));
      document.removeEventListener('keydown', onKey);
      void play(box, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' }).then(() => {
        box.hidden = true;
        html.style.overflow = before;
        root.querySelector<HTMLElement>('.qx-title')?.focus({ preventScroll: true });
        resolve();
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    document.addEventListener('keydown', onKey);
    box.addEventListener('click', finish, { once: true });

    let at = 0;
    lines.forEach((line, i) => {
      const last = i === lines.length - 1;
      timers.push(
        window.setTimeout(() => {
          const prev = host.lastElementChild;
          if (prev) void play(prev, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-18px)', filter: 'blur(6px)' }], { duration: 320, fill: 'forwards' }).then(() => prev.remove());
          const p = document.createElement('p');
          p.innerHTML = highlight(line);
          host.appendChild(p);
          void play(p, [{ opacity: 0, transform: 'translateY(22px)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, delay: 120, fill: 'backwards', easing: 'cubic-bezier(.2,.8,.2,1)' });
          if (p.querySelector('em')) window.setTimeout(() => sparkle(host), 350);
        }, at),
      );
      at += last ? 0 : 1250 + Math.min(900, line.length * 14);
    });
    timers.push(window.setTimeout(finish, at + 1900));
  });
}

// ── Carte ────────────────────────────────────────────────────────────────
interface View {
  x: number;
  y: number;
  w: number;
}
interface Pin {
  el: HTMLElement;
  x: number;
  y: number;
}
const FULL: View = { x: 0, y: 0, w: MAP_W };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

class QuartierMap {
  private view: View = { ...FULL };
  private readonly pins: Pin[] = [];
  private here: Pin | null = null;
  private flight = 0;
  private loaded: Promise<void> | null = null;

  constructor(
    private readonly stage: HTMLElement,
    private readonly svg: SVGSVGElement,
    private readonly layer: HTMLElement,
    private readonly marker: HTMLElement,
  ) {
    new ResizeObserver(() => this.layout()).observe(stage);
    this.here = { el: marker, x: 0, y: 0 };
  }

  load(): Promise<void> {
    this.loaded ??= fetch('/geo/quartiers.json')
      .then((r) => (r.ok ? (r.json() as Promise<QuartierMapData>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        const ns = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(ns, 'defs');
        defs.innerHTML = '<linearGradient id="qx-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2F78"/><stop offset="1" stop-color="#221E3C"/></linearGradient>';
        const ctx = document.createElementNS(ns, 'path');
        ctx.setAttribute('class', 'ctx');
        ctx.setAttribute('d', data.context);
        const g = document.createElementNS(ns, 'g');
        for (const c of data.countries) {
          const p = document.createElementNS(ns, 'path');
          p.setAttribute('class', 'land');
          p.setAttribute('d', c.d);
          g.appendChild(p);
        }
        this.svg.replaceChildren(defs, ctx, g);
        this.svg.classList.add('is-in');
      })
      .catch(() => {
        // Sans contours, les lumières restent sur le fond étoilé : la carte reste lisible, le formulaire aussi.
      });
    return this.loaded;
  }

  addPin(lat: number, lng: number, cls: string, size?: number): HTMLElement {
    const [px, py] = project(lat, lng);
    const el = document.createElement('i');
    el.className = `qx-dot ${cls}`;
    if (size) el.style.setProperty('--d', `${size.toFixed(1)}px`);
    el.style.setProperty('--dl', `${(Math.random() * 2.4).toFixed(2)}s`);
    this.layer.appendChild(el);
    this.pins.push({ el, x: px, y: py });
    this.place(this.pins[this.pins.length - 1]!);
    return el;
  }

  clearPins(cls: string): void {
    for (let i = this.pins.length - 1; i >= 0; i--) {
      const p = this.pins[i]!;
      if (p.el.classList.contains(cls)) {
        p.el.remove();
        this.pins.splice(i, 1);
      }
    }
  }

  private place(p: Pin): void {
    const k = this.stage.clientWidth / this.view.w;
    p.el.style.transform = `translate(${((p.x - this.view.x) * k).toFixed(1)}px,${((p.y - this.view.y) * k).toFixed(1)}px)`;
  }

  layout(): void {
    const h = (this.view.w * MAP_H) / MAP_W;
    this.svg.setAttribute('viewBox', `${this.view.x.toFixed(2)} ${this.view.y.toFixed(2)} ${this.view.w.toFixed(2)} ${h.toFixed(2)}`);
    for (const p of this.pins) this.place(p);
    if (this.here) this.place(this.here);
    this.stage.classList.toggle('is-zoomed', this.view.w < MAP_W / 2.5);
  }

  /** Le minimoa se pose à cet endroit (ou disparaît : zone par code postal, sans centre). */
  setHere(center: Zone['center']): void {
    if (!this.here) return;
    if (!center) {
      this.marker.hidden = true;
      return;
    }
    const [px, py] = project(center.lat, center.lng);
    this.here.x = px;
    this.here.y = py;
    this.marker.hidden = false;
    this.place(this.here);
  }

  /** Vol vers une vue : on prend de la hauteur si le trajet est long, puis on descend. */
  fly(to: View, ms = 1500): Promise<void> {
    const from = { ...this.view };
    const id = ++this.flight;
    if (still() || ms <= 0) {
      this.view = { ...to };
      this.layout();
      return Promise.resolve();
    }
    const c0 = { x: from.x + from.w / 2, y: from.y + (from.w * MAP_H) / MAP_W / 2 };
    const c1 = { x: to.x + to.w / 2, y: to.y + (to.w * MAP_H) / MAP_W / 2 };
    const dist = Math.hypot(c1.x - c0.x, c1.y - c0.y);
    const l0 = Math.log(from.w);
    const l1 = Math.log(to.w);
    const top = Math.log(Math.min(MAP_W, Math.max(from.w, to.w, dist * 1.4)));
    const bump = Math.max(0, top - (l0 + l1) / 2);
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        if (id !== this.flight) return resolve();
        const t = Math.min(1, (now - start) / ms);
        const e = ease(t);
        const w = Math.exp(Math.min(Math.max(top, l0, l1), l0 + (l1 - l0) * e + bump * Math.sin(Math.PI * e)));
        const cx = c0.x + (c1.x - c0.x) * e;
        const cy = c0.y + (c1.y - c0.y) * e;
        this.view = { x: cx - w / 2, y: cy - (w * MAP_H) / MAP_W / 2, w };
        this.layout();
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  /** Vue centrée sur un quartier : de près pour un arrondissement, moins pour une ville entière. */
  static viewOf(z: Zone | null): View {
    if (!z?.center) return { ...FULL };
    const [cx, cy] = project(z.center.lat, z.center.lng);
    const w = MAP_W / (z.district ? 4 : 3.4);
    return { x: cx - w / 2, y: cy - (w * MAP_H) / MAP_W / 2 - w * 0.06, w };
  }
}

// ── Confettis ────────────────────────────────────────────────────────────
function confetti(from: HTMLElement): void {
  if (still()) return;
  const r = from.getBoundingClientRect();
  const box = document.createElement('div');
  box.className = 'qx-confetti';
  box.setAttribute('aria-hidden', 'true');
  document.body.appendChild(box);
  const colors = ['var(--lime)', 'var(--color-accent-soft)', 'var(--coral)', 'var(--rose)', 'var(--violet)', '#fff', 'var(--color-lime)'];
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height * 0.35;
  const jobs: Promise<void>[] = [];
  for (let i = 0; i < 46; i++) {
    const el = document.createElement('i');
    const w = 7 + Math.random() * 8;
    const round = i % 3 === 0;
    el.style.cssText = `width:${w}px;height:${round ? w : w * 0.45}px;border-radius:${round ? '50%' : '2px'};background:${colors[i % colors.length]}`;
    box.appendChild(el);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const v = 160 + Math.random() * 260;
    const dx = Math.cos(a) * v;
    const dy = Math.sin(a) * v;
    jobs.push(
      play(
        el,
        [
          { transform: `translate(${cx}px,${cy}px) rotate(0)`, opacity: 1 },
          { transform: `translate(${cx + dx}px,${cy + dy}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${cx + dx * 1.2}px,${cy + dy + 380}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
        ],
        { duration: 1500 + Math.random() * 900, easing: 'cubic-bezier(.15,.7,.4,1)' },
      ),
    );
  }
  for (const [i, src] of ['/img/ic_confettis.webp', '/img/ic_etoiles.webp', '/img/ic_confettis.webp'].entries()) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    box.appendChild(img);
    const dx = (i - 1) * 130;
    jobs.push(
      play(
        img,
        [
          { transform: `translate(${cx - 22}px,${cy}px) scale(.2) rotate(-20deg)`, opacity: 0 },
          { transform: `translate(${cx - 22 + dx}px,${cy - 150 - (i % 2) * 40}px) scale(1.1) rotate(${(i - 1) * 18}deg)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${cx - 22 + dx * 1.1}px,${cy - 120}px) scale(1) rotate(${(i - 1) * 24}deg)`, opacity: 0 },
        ],
        { duration: 1700, delay: 80 * i, easing: 'cubic-bezier(.3,1.4,.5,1)' },
      ),
    );
  }
  void Promise.all(jobs).then(() => box.remove());
}

/** Compte de 0 jusqu'au vrai chiffre. */
function countUp(el: HTMLElement, to: number): void {
  if (still() || to <= 0) {
    el.textContent = String(to);
    return;
  }
  const start = performance.now();
  const ms = Math.min(1200, 300 + to * 30);
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    el.textContent = String(Math.round(to * ease(t)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Page ─────────────────────────────────────────────────────────────────
export function mountQuartierXp(root: HTMLElement, opts: QuartierXpOptions = {}): void {
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s);
  const form = $<HTMLFormElement>('[data-qx-form]');
  const city = $<HTMLSelectElement>('[data-qx-city]');
  const districtWrap = $('[data-qx-district-wrap]');
  const district = $<HTMLSelectElement>('[data-qx-district]');
  const postal = $<HTMLInputElement>('[data-qx-postal]');
  const email = $<HTMLInputElement>('[data-qx-email]');
  const consent = $<HTMLInputElement>('[data-qx-consent]');
  const error = $('[data-qx-error]');
  const submit = $<HTMLButtonElement>('[data-qx-submit]');
  const stage = $('.qx-stage');
  const svg = $<SVGSVGElement>('[data-qx-svg]');
  const layer = $('[data-qx-pins]');
  const marker = $('[data-qx-here]');
  if (!form || !city || !districtWrap || !district || !postal || !email || !consent || !error || !submit) return;

  const steps = [...root.querySelectorAll<HTMLElement>('[data-qx-step]')];
  const map = stage && svg && layer && marker ? new QuartierMap(stage, svg, layer, marker) : null;
  const hereImg = $<HTMLImageElement>('[data-qx-here-img]');
  const hereTag = $('[data-qx-here-tag]');

  let zone: string | null = null;
  let species: Species = 'nino';
  let status: ZoneStatus | null = null;
  let seq = 0;
  let timer = 0;

  const linked = opts.zone ? zoneById(opts.zone) : null;
  // Avec le script, les étapes 2 et 3 s'ouvrent une fois le quartier choisi.
  // `n` : étapes faites ou en cours (pastille allumée) ; dès le quartier choisi, toutes les étapes sont là.
  const reveal = (n: number) => {
    steps.forEach((s, i) => {
      if (i > 0) s.hidden = n < 2;
      s.classList.toggle('is-on', i < n);
    });
  };
  if (!linked) reveal(1);

  void map?.load();

  // Lumières des villes de la liste (disponibles) et des arrondissements (visibles de près).
  if (map) {
    for (const c of ZONE_CITIES) {
      const zs = ZONES.filter((z) => z.city === c && z.center);
      if (!zs.length) continue;
      const lat = zs.reduce((n, z) => n + z.center!.lat, 0) / zs.length;
      const lng = zs.reduce((n, z) => n + z.center!.lng, 0) / zs.length;
      map.addPin(lat, lng, zs.length > 1 ? 'is-city is-agg' : 'is-city', 6);
      if (zs.length > 1) for (const z of zs) map.addPin(z.center!.lat, z.center!.lng, 'is-zone', 4);
    }
  }

  const setError = (msg: string | null) => {
    error.hidden = !msg;
    error.textContent = msg ?? '';
  };

  // ── Jauge ──
  function renderGauge(s: ZoneStatus): void {
    const gauge = $('[data-qx-gauge]');
    const count = $('[data-qx-count]');
    const seats = $('[data-qx-seats]');
    if (!gauge || !count || !seats) return;
    const label = labelOf(s.zone);
    gauge.hidden = false;
    countUp(count, s.count);
    const of = $('[data-qx-of]');
    if (of) of.textContent = fill(x.gaugeOf, { threshold: s.threshold });
    const forEl = $('[data-qx-for]');
    if (forEl) forEl.textContent = s.open ? fill(q.counterOpen, { zone: label }) : fill(x.gaugeFor, { zone: label });
    const note = $('[data-qx-note]');
    if (note) note.textContent = s.open ? '' : s.count === 0 ? x.gaugeFirst : x.gaugeYou;
    const open = $<HTMLAnchorElement>('[data-qx-open-link]');
    if (open) {
      open.hidden = !s.open;
      open.href = `/quartier/${s.zone}`;
    }
    seats.style.setProperty('--pc', SPECIES_COLOR[species]);
    if (s.threshold <= 60) {
      seats.className = 'qx-seats';
      const list = Array.from({ length: s.threshold }, (_, i) => {
        const el = document.createElement('i');
        el.className = 'qx-seat';
        if (!s.open && i === s.count) el.classList.add('you');
        return el;
      });
      seats.replaceChildren(...list);
      const lit = s.open ? s.threshold : Math.min(s.count, s.threshold);
      list.slice(0, lit).forEach((el, i) => (still() ? el.classList.add('on') : window.setTimeout(() => el.classList.add('on'), 80 + i * 28)));
    } else {
      seats.className = 'qx-seats is-bar';
      const bar = document.createElement('i');
      seats.replaceChildren(bar);
      requestAnimationFrame(() => bar.style.setProperty('--p', `${s.open ? 100 : Math.min(100, (s.count / Math.max(1, s.threshold)) * 100)}%`));
    }
    const sr = $('[data-qx-gauge-sr]');
    if (sr) sr.textContent = s.open ? fill(q.counterOpen, { zone: label }) : fill(q.counter, { count: s.count, threshold: s.threshold, zone: label });
    const lead = $('[data-qx-lead]');
    if (lead) lead.textContent = fill(x.lead, { n: s.threshold });
  }

  async function refresh(): Promise<void> {
    const mine = ++seq;
    if (!zone) {
      const gauge = $('[data-qx-gauge]');
      if (gauge) gauge.hidden = true;
      return;
    }
    try {
      const s = await api.quartiers.status(zone);
      if (mine !== seq) return;
      status = s;
      renderGauge(s);
    } catch {
      // Le compteur est un plus : sans réseau, le formulaire reste utilisable.
    }
  }

  // ── Le voyage vers un quartier ──
  async function travel(z: Zone | null, scroll: boolean): Promise<void> {
    if (!map) return;
    if (scroll && stage && window.innerWidth < 1000) {
      const top = stage.getBoundingClientRect().top;
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navh')) + 28 || 80;
      if (top < nav || top > window.innerHeight * 0.4) window.scrollTo({ top: window.scrollY + top - nav, behavior: still() ? 'auto' : 'smooth' });
    }
    if (marker) marker.hidden = true;
    await map.load();
    await map.fly(QuartierMap.viewOf(z), 1600);
    if (!z || z.id !== zone) return;
    map.setHere(z.center);
    if (hereTag) hereTag.textContent = labelOf(z.id);
    if (hereImg) {
      hereImg.src = POSE[species].map;
      void play(hereImg, [{ transform: 'translateY(-70px) scale(.5)', opacity: 0 }, { transform: 'translateY(6px) scale(1.06,.94)', opacity: 1, offset: 0.7 }, { transform: 'none' }], {
        duration: 650,
        easing: 'cubic-bezier(.3,1.2,.5,1)',
      });
    }
  }

  function choose(id: string | null, scroll = true): void {
    const same = id !== null && id === zone;
    zone = id;
    setError(null);
    if (id) reveal(email!.value ? 3 : 2);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void refresh(), 180);
    // Même quartier (la ville puis son premier arrondissement) : le vol en cours continue.
    if (!same) void travel(id ? zoneById(id) : null, scroll);
  }

  function fillDistricts(c: string, selected?: string): void {
    const list = ZONES.filter((z) => z.city === c && z.district);
    districtWrap!.hidden = list.length === 0;
    district!.replaceChildren(
      ...list.map((d) => {
        const o = document.createElement('option');
        o.value = d.id;
        o.textContent = locale === 'fr' ? `${d.district}${d.district === 1 ? 'er' : 'e'}` : String(d.district);
        o.selected = d.id === selected;
        return o;
      }),
    );
  }

  function fromList(): void {
    postal!.value = '';
    const c = city!.value;
    if (!c) return choose(null);
    const list = ZONES.filter((z) => z.city === c && z.district);
    const whole = ZONES.find((z) => z.city === c && !z.district);
    choose(list.length ? district!.value || list[0]!.id : (whole?.id ?? null));
  }

  /** Met les contrôles sur un quartier (lien partagé, classement). */
  function select(id: string): void {
    const cp = /^cp-(\d{5})$/.exec(id);
    if (cp) {
      postal!.value = cp[1]!;
      city!.value = '';
      districtWrap!.hidden = true;
      return;
    }
    const z = zoneById(id);
    if (!z) return;
    city!.value = z.city;
    fillDistricts(z.city, id);
  }

  city.addEventListener('change', () => {
    fillDistricts(city.value);
    fromList();
  });
  district.addEventListener('change', fromList);
  postal.addEventListener('input', () => {
    postal.value = postal.value.replace(/\D/g, '').slice(0, 5);
    if (postal.value.length === 5) {
      city.value = '';
      districtWrap.hidden = true;
      choose(zoneOfPostalCode(postal.value)?.id ?? null);
    }
  });
  email.addEventListener('input', () => zone && reveal(3));

  // ── Minimoa ──
  root.querySelectorAll<HTMLInputElement>('[data-qx-species]').forEach((r) =>
    r.addEventListener('change', () => {
      if (!r.checked || !(SPECIES as readonly string[]).includes(r.value)) return;
      species = r.value as Species;
      $('[data-qx-seats]')?.style.setProperty('--pc', SPECIES_COLOR[species]);
      if (hereImg && marker && !marker.hidden) {
        hereImg.src = POSE[species].map;
        void play(hereImg, [{ transform: 'scale(.6) rotate(-8deg)' }, { transform: 'scale(1.12) rotate(4deg)', offset: 0.6 }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      }
    }),
  );

  // ── Bouton principal : vers le choix du quartier ──
  $('[data-qx-cta]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const target = window.innerWidth < 1000 ? form : city;
    target.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
    city.focus({ preventScroll: true });
  });

  // ── Inscription ──
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
      status = r.status;
      done(r.status);
    } catch (err) {
      const kind = failureOf(err);
      setError(kind === 'invalid' ? q.errors.email : kind === 'not_found' ? q.errors.zone : kind === 'rate_limited' ? q.errors.busy : q.errors.generic);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });

  function done(s: ZoneStatus): void {
    const box = $('[data-qx-done]');
    const pass = $('[data-qx-pass]');
    if (!box || !pass) return;
    const label = labelOf(s.zone);
    const url = quartierLink(s.zone, null);
    pass.dataset.sp = species;
    const img = $<HTMLImageElement>('[data-qx-pass-img]');
    if (img) img.src = POSE[species].happy;
    const set = (sel: string, text: string) => {
      const el = $(sel);
      if (el) el.textContent = text;
    };
    set('[data-qx-pass-zone]', label);
    set('[data-qx-pass-scout]', fill(x.passScout, { name: SPECIES_NAMES[species] }));
    set('[data-qx-pass-goal]', fill(x.passGoal, { count: s.count, threshold: s.threshold }));
    set('[data-qx-link]', url.replace(/^https?:\/\//, ''));
    form!.hidden = true;
    box.hidden = false;
    renderGauge(s);
    set('[data-qx-done-sr]', fill(x.celebrate, { zone: label }));
    const title = $('[data-qx-done-title]');
    box.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' });
    title?.focus({ preventScroll: true });
    void play(pass, [{ transform: 'translateY(40px) rotate(-6deg) scale(.85)', opacity: 0 }, { transform: 'rotate(2deg) scale(1.03)', opacity: 1, offset: 0.65 }, { transform: 'rotate(-1.5deg)' }], {
      duration: 900,
      easing: 'cubic-bezier(.3,1.3,.5,1)',
      fill: 'forwards',
    });
    window.setTimeout(() => confetti(pass), 250);
    // Sur la carte, le minimoa danse.
    if (hereImg && marker && !marker.hidden) {
      hereImg.src = POSE[species].happy;
      void play(hereImg, [{ transform: 'none' }, { transform: 'translateY(-18px) rotate(-6deg)' }, { transform: 'none' }, { transform: 'translateY(-12px) rotate(6deg)' }, { transform: 'none' }], { duration: 1400, iterations: 2 });
    }
    const share = $<HTMLButtonElement>('[data-qx-share]');
    const copy = $<HTMLButtonElement>('[data-qx-copy]');
    if (share)
      share.onclick = async () => {
        const r = await shareOrCopy({ text: fill(q.inviteMessage, { missing: s.missing, zone: label }), url });
        if (r === 'copied') flash(share, q.copied);
      };
    if (copy) copy.onclick = async () => void ((await copyText(url)) && flash(copy, q.copied));
  }

  // ── Classement et lumières réelles ──
  function renderBoard(b: QuartierBoard): void {
    const live = $('[data-qx-live]');
    if (live && b.total > 0) {
      const s = $('[data-qx-live-signups]');
      const z = $('[data-qx-live-zones]');
      if (s) s.textContent = b.total === 1 ? x.signupsOne : fill(x.signupsMany, { n: b.total });
      if (z) z.textContent = b.zones === 1 ? x.zonesOne : fill(x.zonesMany, { n: b.zones });
      live.removeAttribute('aria-hidden');
    }
    if (!status) {
      const lead = $('[data-qx-lead]');
      if (lead) lead.textContent = fill(x.lead, { n: b.threshold });
    }
    if (map) {
      map.clearPins('is-live');
      map.clearPins('is-open');
      for (const it of b.items) {
        const z = zoneById(it.zone);
        if (!z?.center) continue;
        const ratio = it.open ? 1 : Math.min(1, it.count / Math.max(1, it.threshold));
        map.addPin(z.center.lat, z.center.lng, it.open ? 'is-open' : 'is-live', 10 + 26 * Math.sqrt(ratio));
      }
    }
    const rows = b.items.slice(0, 8);
    const board = $('[data-qx-board]');
    const list = $('[data-qx-rank]');
    if (!board || !list || rows.length === 0) return;
    list.replaceChildren(
      ...rows.map((it, i) => {
        const label = labelOf(it.zone);
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', it.open ? `${label} : ${x.boardOpen}` : fill(x.boardPick, { zone: label, count: it.count, threshold: it.threshold }));
        const n = document.createElement('span');
        n.className = 'qx-rank-n';
        n.textContent = String(i + 1);
        const name = document.createElement('span');
        name.className = 'qx-rank-name';
        name.textContent = label;
        const count = document.createElement('span');
        count.className = it.open ? 'qx-rank-count qx-rank-open' : 'qx-rank-count';
        count.textContent = it.open ? x.boardOpen : `${it.count} / ${it.threshold}`;
        const bar = document.createElement('span');
        bar.className = 'qx-rank-bar';
        const fillEl = document.createElement('i');
        fillEl.style.width = `${it.open ? 100 : Math.max(3, Math.min(100, (it.count / Math.max(1, it.threshold)) * 100))}%`;
        bar.appendChild(fillEl);
        btn.append(n, name, count, bar);
        btn.addEventListener('click', () => {
          if (it.open) {
            window.location.href = `/quartier/${it.zone}`;
            return;
          }
          if (!form!.hidden) {
            select(it.zone);
            choose(it.zone);
            city!.focus({ preventScroll: true });
          }
        });
        li.appendChild(btn);
        return li;
      }),
    );
    board.hidden = false;
  }

  void api.quartiers
    .board()
    .then(renderBoard)
    .catch(() => {
      // Pas de classement sans données réelles : la section reste cachée.
    });

  // ── Départ : l'intro, puis le quartier du lien s'il y en a un ──
  const lines = linked ? x.intro.deep.map((l) => fill(l, { zone: labelOf(linked.id) })) : x.intro.lines;
  if (linked) select(linked.id);
  void playIntro(root, lines).then(async () => {
    if (!linked) return;
    await wait(still() ? 0 : 150);
    choose(linked.id);
  });
}
