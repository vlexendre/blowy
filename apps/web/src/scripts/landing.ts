/**
 * Animations et interactions de la landing (port fidèle de la maquette validée).
 * GSAP 3.12.5 + ScrollTrigger sont chargés depuis cdnjs (balises is:inline dans src/pages/index.astro) et lus sur
 * `window`. Sans GSAP, ou avec « réduire les animations », tout reste utilisable et statique.
 */
import { character, lives, nav, photo, threeWords, type MoodKey } from '../content/landing';

// ── Typage minimal de la partie de GSAP utilisée ────────────────────────────
type Target = Element | Element[] | string | object | null;
type Vars = Record<string, unknown>;
type Position = number | string;
interface Timeline {
  to(t: Target, v: Vars, pos?: Position): Timeline;
  from(t: Target, v: Vars, pos?: Position): Timeline;
  fromTo(t: Target, a: Vars, b: Vars, pos?: Position): Timeline;
  set(t: Target, v: Vars, pos?: Position): Timeline;
  add(fn: () => void, pos?: Position): Timeline;
  play(from?: number): Timeline;
  pause(): Timeline;
  progress(p: number): Timeline;
}
interface Gsap {
  to(t: Target, v: Vars): unknown;
  fromTo(t: Target, a: Vars, b: Vars): unknown;
  set(t: Target, v: Vars): unknown;
  timeline(v?: Vars): Timeline;
  registerPlugin(...p: unknown[]): void;
}
interface ScrollTriggerSelf {
  isActive: boolean;
}
interface ScrollTriggerStatic {
  create(v: Vars & { onToggle?: (self: ScrollTriggerSelf) => void }): unknown;
  refresh(): void;
}
declare global {
  interface Window {
    gsap?: Gsap;
    ScrollTrigger?: ScrollTriggerStatic;
  }
}

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

function main(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G: Gsap | null = window.gsap && !reduce ? window.gsap : null;
  const secs = $$('.sec');
  const dotEls = $$('.dots a');
  const navLinks = $$('[data-nav]');

  function setActive(i: number): void {
    dotEls.forEach((d, k) => {
      d.classList.toggle('on', k === i);
      if (k === i) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    const n = nav.activeMap[secs[i]?.id ?? ''];
    navLinks.forEach((a) => a.classList.toggle('on', a.dataset.nav === n));
  }
  setActive(0);

  /* échange d'image : écrasé, échange, rebond */
  function swapImg(list: HTMLImageElement[], attr: string, val: string): void {
    const cur = list.find((i) => i.classList.contains('on'));
    const nxt = list.find((i) => i.getAttribute(attr) === val);
    if (!nxt || nxt === cur) return;
    nxt.loading = 'eager';
    if (!G) {
      cur?.classList.remove('on');
      nxt.classList.add('on');
      return;
    }
    const box = nxt.parentElement?.parentElement ?? null;
    G.timeline()
      .to(box, { scaleY: 0.82, scaleX: 1.12, duration: 0.14, ease: 'power2.in', transformOrigin: '50% 100%' })
      .add(() => {
        cur?.classList.remove('on');
        nxt.classList.add('on');
      })
      .to(box, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1,.45)' });
  }

  /* 2. couleur du pet */
  const cimgs = $$<HTMLImageElement>('.cimg');
  const swatches = $$<HTMLButtonElement>('.sw button');
  const cname = $('#cname');
  swatches.forEach((b) => {
    b.addEventListener('click', () => {
      swatches.forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      if (cname) cname.textContent = `· ${b.getAttribute('aria-label') ?? ''}`;
      swapImg(cimgs, 'data-c', b.dataset.c ?? '');
    });
  });

  /* 3. caractère : les boutons changent nino et les jauges */
  const gEls = $$('.g');
  let gVals: number[] = [...character.presets[character.initial]];
  function drawG(i: number, v: number): void {
    const g = gEls[i];
    if (!g) return;
    const f = $('.fill', g);
    const k = $('.knob', g);
    const tr = $('.tr', g);
    const sp = $$('.gl span', g);
    if (f) {
      f.style.left = `${50 + Math.min(0, v) / 2}%`;
      f.style.width = `${Math.abs(v) / 2}%`;
    }
    if (k) k.style.left = `${50 + v / 2}%`;
    tr?.setAttribute('aria-valuenow', String(Math.round(v)));
    sp[0]?.classList.toggle('hi', v < -15);
    sp[1]?.classList.toggle('hi', v > 15);
  }
  gVals.forEach((v, i) => drawG(i, v));
  const carImgs = $$<HTMLImageElement>('.cars img');
  const moodBtns = $$<HTMLButtonElement>('.moods button');
  moodBtns.forEach((b) => {
    b.addEventListener('click', () => {
      moodBtns.forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      const m = b.dataset.m as MoodKey;
      swapImg(carImgs, 'data-m', m);
      const target = character.presets[m];
      if (!target) return;
      if (!G) {
        gVals = [...target];
        gVals.forEach((v, i) => drawG(i, v));
        return;
      }
      const o = { a: gVals[0] ?? 0, b: gVals[1] ?? 0, c: gVals[2] ?? 0, d: gVals[3] ?? 0 };
      G.to(o, {
        a: target[0],
        b: target[1],
        c: target[2],
        d: target[3],
        duration: 1.1,
        ease: 'expo.out',
        overwrite: true,
        onUpdate: () => {
          gVals = [o.a, o.b, o.c, o.d];
          gVals.forEach((v, i) => drawG(i, v));
        },
      });
    });
  });

  /* 8. mots : 3 au maximum, et ce que nino devient */
  const words = $$<HTMLButtonElement>('.words button');
  const evoEl = $('#evo');
  const pressed = () => words.filter((w) => w.getAttribute('aria-pressed') === 'true');
  function evo(): void {
    if (!evoEl) return;
    const out = [...new Set(pressed().map((w) => `+ ${w.dataset.g ?? ''}`))];
    if (!out.length) {
      evoEl.textContent = threeWords.evoEmpty;
      return;
    }
    const b = document.createElement('b');
    b.textContent = out.join(' · ');
    evoEl.replaceChildren(`${threeWords.evoPrefix} `, b);
  }
  words.forEach((w) => {
    w.addEventListener('click', () => {
      const on = w.getAttribute('aria-pressed') === 'true';
      if (!on && pressed().length >= threeWords.max) pressed()[0]?.setAttribute('aria-pressed', 'false');
      w.setAttribute('aria-pressed', on ? 'false' : 'true');
      if (G) G.fromTo(w, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      evo();
    });
  });

  /* 10. faq : une seule ouverte, hauteur animée */
  const det = $$<HTMLDetailsElement>('.faq details');
  function openD(x: HTMLDetailsElement): void {
    x.open = true;
    if (G) G.fromTo($('.ans', x), { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power3.out', clearProps: 'height' });
  }
  function closeD(x: HTMLDetailsElement): void {
    if (!G) {
      x.open = false;
      return;
    }
    const ans = $('.ans', x);
    G.to(ans, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        x.open = false;
        G.set(ans, { clearProps: 'all' });
      },
    });
  }
  det.forEach((d) => {
    $('summary', d)?.addEventListener('click', (e) => {
      e.preventDefault();
      const opening = !d.open;
      det.forEach((o) => {
        if (o !== d && o.open) closeD(o);
      });
      if (opening) openD(d);
      else closeD(d);
    });
  });

  /* suivi de section sans gsap */
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (!gsap || !ST) {
    if ('IntersectionObserver' in window)
      secs.forEach((s, i) => {
        new IntersectionObserver(
          (e) => {
            if (e[0]?.isIntersecting) setActive(i);
          },
          { threshold: 0.55 },
        ).observe(s);
      });
    return;
  }
  gsap.registerPlugin(ST);

  /* la couleur du fond suit la section active */
  const root = $('.bgx');
  function setGlow(s: HTMLElement, i: number): void {
    if (!gsap) return;
    const c = (s.dataset.glow ?? '').split(',');
    gsap.to(root, { '--c1': c[0], '--c2': c[1], '--c3': c[2], duration: reduce ? 0 : 1.4, ease: 'power2.inOut', overwrite: 'auto' });
    if (!reduce) {
      gsap.to('.glow.a', { x: `${((i % 3) - 1) * 12}vw`, y: `${(i % 2) * 10}vh`, duration: 2, ease: 'power2.inOut', overwrite: 'auto' });
      gsap.to('.glow.b', { x: `${-(((i + 1) % 3) - 1) * 10}vw`, y: `${((i + 1) % 2) * 14}vh`, duration: 2.2, ease: 'power2.inOut', overwrite: 'auto' });
    }
  }
  secs.forEach((s, i) => {
    ST.create({
      trigger: s,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) {
          setActive(i);
          setGlow(s, i);
        }
      },
    });
  });
  if (secs[0]) setGlow(secs[0], 0);

  if (reduce) return;

  /* découpe des titres en mots (les états cachés ne sont posés que par JS) */
  document.documentElement.classList.add('js-split');
  $$('.hd .ln').forEach((ln) => {
    const parts = (ln.textContent ?? '').split(/\s+/).filter(Boolean);
    ln.textContent = '';
    parts.forEach((p, k) => {
      const o = document.createElement('span');
      o.className = 'w';
      const inner = document.createElement('span');
      inner.textContent = p;
      o.appendChild(inner);
      ln.appendChild(o);
      if (k < parts.length - 1) ln.appendChild(document.createTextNode(' '));
    });
  });

  /* mouvement d'ambiance du fond */
  gsap.to('.stars', { yPercent: -20, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 1.2 } });
  $$('.drift').forEach((d, i) => {
    gsap.to(d, { y: (i % 2 ? -1 : 1) * (120 + i * 40), rotation: i % 2 ? 40 : -50, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 1.5 } });
    gsap.to(d, { x: i % 2 ? 14 : -14, duration: 4 + i * 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  });
  gsap.to('.glow.c', { xPercent: 10, yPercent: -8, duration: 10, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  /* panneaux : grandissent en arrivant, s'enfoncent en partant */
  secs.forEach((s) => {
    const p = $('.panel', s);
    gsap
      .timeline({ scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } })
      .fromTo(p, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, ease: 'none', duration: 1 })
      .to(p, { scale: 0.93, opacity: 0.55, ease: 'none', duration: 1 });
  });

  /* mouvement au repos : les pets respirent, les autocollants oscillent */
  $$('.bob').forEach((b, i) => {
    gsap.to(b, { y: -8, scaleY: 1.025, scaleX: 0.985, transformOrigin: '50% 100%', duration: 1.6 + (i % 3) * 0.25, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.2 });
  });
  $$('.stk[data-r="stk"], .app .ico, .plan .gel, .flame img').forEach((s, i) => {
    gsap.to(s, { rotation: i % 2 ? 8 : -8, y: -5, duration: 2.2 + (i % 4) * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.15 });
  });

  /* entrées : une timeline par section, jouée quand la section s'aimante */
  secs.forEach((s, si) => {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
    const ws = $$('.hd .w>span', s);
    const dims = $$('.hd .ln.dim .w', s);
    tl.from(ws, { yPercent: 115, rotation: 4, duration: 0.9, stagger: 0.05 }, 0);
    if (dims.length) tl.fromTo(dims, { opacity: 0.38 }, { opacity: 1, duration: 0.35, stagger: 0.07, ease: 'power1.out', yoyo: true, repeat: 1, repeatDelay: 0.15 }, 0.5);
    let t = 0.25;
    $$('[data-r]', s).forEach((el) => {
      const r = el.dataset.r;
      if (r === 'up') tl.from(el, { y: 30, opacity: 0, duration: 0.8 }, (t += 0.06));
      else if (r === 'pop') tl.from(el, { y: 60, scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(1.6)', transformOrigin: '50% 100%' }, 0.3);
      else if (r === 'bub') {
        const right = el.classList.contains('me') || el.classList.contains('b3') || el.classList.contains('m2');
        tl.from(el, { y: 18, scale: 0.6, opacity: 0, duration: 0.6, ease: 'back.out(2)', transformOrigin: right ? '100% 100%' : '0% 100%' }, (t += 0.14));
      } else if (r === 'stk') tl.from(el, { scale: 0, rotation: -40, opacity: 0, duration: 0.8, ease: 'back.out(2.4)' }, (t += 0.05));
      else if (r === 'card') tl.from(el, { y: 50, rotation: '-=8', opacity: 0, duration: 0.9, ease: 'back.out(1.4)' }, (t += 0.1));
      else if (r === 'row') tl.from(el, { x: 30, opacity: 0, duration: 0.6 }, (t += 0.06));
      else if (r === 'msg') tl.from(el, { y: 20, scale: 0.8, opacity: 0, duration: 0.55, ease: 'back.out(2)', transformOrigin: '0% 100%' }, (t += 0.2));
    });
    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      tl.play(0);
    };
    ST.create({ trigger: s, start: 'top 65%', end: 'bottom 35%', onEnter: play, onEnterBack: play });
    if (si === 0) play();
    else if (s.getBoundingClientRect().bottom < 0) {
      played = true;
      tl.progress(1);
    }
  });

  /* 5. les cœurs se vident de 5 à 0, le lien devient fantôme, puis il est ranimé */
  (() => {
    const hs = $$<SVGSVGElement>('.hearts svg');
    const num = $('#lnum');
    const txt = $('#ltxt');
    const say = $('#gsay');
    const sad = $('.ghost .gs');
    const gh = $('.ghost .gt');
    if (!num || !txt || !say) return;
    const setN = (n: number) => {
      hs.forEach((h, k) => h.classList.toggle('off', k >= n));
      num.textContent = `${n}/${lives.total}`;
      txt.textContent = lives.lines[lives.start - n] ?? '';
      say.textContent = lives.says[lives.start - n] ?? '';
    };
    const tl = gsap.timeline({ repeat: -1, paused: true, repeatDelay: 0.6 });
    tl.add(() => setN(lives.start)).set(gh, { opacity: 0 }).set(sad, { opacity: 1 }).to({}, { duration: 1.2 });
    for (let n = lives.start - 1; n >= 0; n--) {
      tl.add(() => setN(n));
      tl.fromTo(hs[n] ?? null, { scale: 1.4, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      tl.to({}, { duration: 0.75 });
    }
    tl.to(sad, { opacity: 0, duration: 0.6 }, '-=.4').to(gh, { opacity: 1, duration: 0.8 }, '<');
    tl.to({}, { duration: 2.4 });
    tl.to(hs.slice(0, lives.start), {
      scale: 1.3,
      duration: 0.25,
      stagger: 0.06,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        setN(lives.start);
        txt.textContent = lives.revived;
        say.textContent = lives.revivedSay;
      },
    });
    tl.to(gh, { opacity: 0, duration: 0.5 }).to(sad, { opacity: 1, duration: 0.5 }, '<').to({}, { duration: 1.6 });
    ST.create({ trigger: '#vies', start: 'top 60%', end: 'bottom 40%', onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) });
  })();

  /* 6. léa poste, la série passe de 11 à 12, +1 vie */
  (() => {
    const st = $('#least');
    const num = $('#streak');
    const p1 = $('#plus1');
    if (!st || !num) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5, paused: true });
    tl.add(() => {
      st.textContent = photo.theirs.waiting;
      st.classList.remove('ok');
      num.textContent = photo.streakBefore;
    })
      .set(p1, { scale: 0, opacity: 0 })
      .to({}, { duration: 1.4 })
      .add(() => {
        st.textContent = photo.theirs.posted;
        st.classList.add('ok');
      })
      .fromTo('.tile.b', { scale: 0.94 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' })
      .add(() => {
        num.textContent = photo.streakAfter;
      }, '+=.3')
      .fromTo('.flame', { scale: 1.35 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.4)' }, '<')
      .to(p1, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2.5)' }, '-=.3');
    ST.create({ trigger: '#photo', start: 'top 60%', end: 'bottom 40%', onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) });
  })();

  window.addEventListener('load', () => ST.refresh());
}

main();
