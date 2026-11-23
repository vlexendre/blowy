import { describe, expect, it } from 'vitest';
import { type Day, addDays, dayOf } from './days';
import {
  LEVEL_XP,
  LINK_XP,
  MAX_LIVES,
  MESSAGE_XP_PER_DAY,
  RECENT_DAYS_KEPT,
  type LinkMessageEffect,
  type LinkSide,
  type LinkState,
  applyLinkMessage,
  faceBeforeLink,
  linkFace,
  pastPhotosShown,
  isWriteReminderHour,
  lateSide,
  levelForXp,
  linkToday,
  linkWarmth,
  wakeLink,
  linkWeek,
  newLink,
  nextLevel,
  tickLink,
} from './link';

const d0 = '2026-11-02'; // un lundi

/** Écrit `n` messages de ce côté ce jour-là, avec le plafond des messages tenu comme l'API le tient. */
function write(s: LinkState, side: LinkSide, day: Day, n = 1, xpToday = { day: '', xp: 0 }): LinkMessageEffect {
  let state = s;
  let effect: LinkMessageEffect | null = null;
  for (let i = 0; i < n; i++) {
    const already = xpToday.day === day ? xpToday.xp : 0;
    effect = applyLinkMessage(state, side, day, already);
    xpToday.day = day;
    xpToday.xp = already + effect.messageXp;
    state = effect.state;
  }
  if (!effect) throw new Error('n >= 1');
  return effect;
}

/** Les deux s'écrivent ce jour-là (a d'abord). */
const both = (s: LinkState, day: Day): LinkState => write(write(s, 'a', day).state, 'b', day).state;

describe('lien : rien ne se perd (ADA-2027 item 27)', () => {
  it('le silence ne coûte rien : `lives` reste à 7, le lien reste actif', () => {
    expect(tickLink(newLink(d0), addDays(d0, 2)).lives).toBe(MAX_LIVES);
    const later = tickLink(newLink(d0), addDays(d0, 60));
    expect(later.lives).toBe(MAX_LIVES);
    expect(later.status).toBe('active');
  });
  it('rattrapage idempotent le même jour', () => {
    const s = tickLink(newLink(d0), addDays(d0, 3));
    expect(tickLink(s, addDays(d0, 3))).toBe(s);
  });
  it('un ancien lien endormi (du temps des vies) se réveille au rattrapage, record gardé', () => {
    let s = newLink(d0);
    for (let i = 0; i < 4; i++) s = both(s, addDays(d0, i));
    const old: LinkState = { ...s, status: 'ghost', lives: 0, lastTickOn: addDays(d0, 12) };
    const woken = tickLink(old, addDays(d0, 12));
    expect(woken).toMatchObject({ status: 'active', lives: MAX_LIVES, bestStreak: 4 });
    expect(linkToday(woken, 'a', addDays(d0, 12)).streak).toBe(0);
    const again = both(woken, addDays(d0, 12));
    expect(again.streak).toBe(1);
  });
  it('un ancien lien à 3 vies remonte à 7 sans rien dire', () => {
    const s = { ...newLink(d0), lives: 3 };
    expect(tickLink(s, d0).lives).toBe(MAX_LIVES);
  });
  it('un lien rangé ne bouge plus', () => {
    const s: LinkState = { ...newLink(d0), status: 'archived' };
    expect(tickLink(s, addDays(d0, 30))).toBe(s);
    expect(applyLinkMessage(s, 'a', addDays(d0, 30)).state).toBe(s);
  });
});

describe('lien : son état, dit avec douceur', () => {
  it('tout neuf : calme, puis « un moment », puis endormi, sans jamais rien bloquer', () => {
    expect(linkWarmth(newLink(d0), d0)).toBe('calme');
    expect(linkWarmth(newLink(d0), addDays(d0, 6))).toBe('calme');
    expect(linkWarmth(newLink(d0), addDays(d0, 7))).toBe('moment');
    expect(linkWarmth(newLink(d0), addDays(d0, 13))).toBe('moment');
    expect(linkWarmth(newLink(d0), addDays(d0, 14))).toBe('endormi');
  });
  it('vivant tant que quelqu’un a écrit ces deux derniers jours', () => {
    const s = write(newLink(d0), 'a', d0).state;
    expect(linkWarmth(s, d0)).toBe('vivant');
    expect(linkWarmth(s, addDays(d0, 2))).toBe('vivant');
    expect(linkWarmth(s, addDays(d0, 3))).toBe('calme');
    expect(linkWarmth(s, addDays(d0, 7))).toBe('moment');
    expect(linkWarmth(s, addDays(d0, 90))).toBe('endormi');
  });
  it('un mot le réveille ; « Le réveiller » le rend calme, sans série ni expérience', () => {
    const s = both(newLink(d0), d0);
    const later = addDays(d0, 40);
    expect(linkWarmth(write(tickLink(s, later), 'b', later).state, later)).toBe('vivant');
    const woken = wakeLink(s, later);
    expect(woken).not.toBeNull();
    expect(linkWarmth(woken!, later)).toBe('calme');
    expect(woken).toMatchObject({ xp: s.xp, bestStreak: 1, streak: 0, status: 'active' });
    expect(wakeLink({ ...s, status: 'archived' }, later)).toBeNull();
  });
});

describe('lien : série de la conversation (spéc §24)', () => {
  it('un jour compte quand chacun a écrit : la série avance au premier message du deuxième', () => {
    const a = write(newLink(d0), 'a', d0, 3);
    expect(a.state.streak).toBe(0);
    expect(a.duoDay).toBe(false);
    const b = write(a.state, 'b', d0);
    expect(b.duoDay).toBe(true);
    expect(b.state.streak).toBe(1);
    expect(b.state.lastDuoDayOn).toBe(d0);
    // Les messages suivants du même jour ne la font plus avancer.
    const more = write(write(b.state, 'a', d0).state, 'b', d0, 4);
    expect(more.duoDay).toBe(false);
    expect(more.state.streak).toBe(1);
    expect(more.state.duoDays).toBe(1);
  });
  it('lien créé aujourd’hui : part de 0, vaut 1 si les deux écrivent dès le premier jour', () => {
    expect(linkToday(newLink(d0), 'a', d0)).toEqual({ mine: false, theirs: false, streak: 0, atStake: false });
    expect(both(newLink(d0), d0).streak).toBe(1);
    // Un seul le premier jour : rien, et le lendemain toujours 0 (pas de vie perdue).
    const solo = tickLink(write(newLink(d0), 'a', d0).state, addDays(d0, 1));
    expect(solo.streak).toBe(0);
    expect(solo.lives).toBe(MAX_LIVES);
  });
  it('jours d’affilée à deux : +1 par jour', () => {
    let s = newLink(d0);
    for (let i = 0; i < 5; i++) s = both(s, addDays(d0, i));
    expect(s.streak).toBe(5);
    expect(s.bestStreak).toBe(5);
    expect(s.duoDays).toBe(5);
  });
  it('un jour où un seul écrit : la série reste affichée (« en jeu ») jusqu’à minuit, puis retombe à 0', () => {
    let s = both(both(newLink(d0), d0), addDays(d0, 1)); // série 2
    const d2 = addDays(d0, 2);
    s = write(s, 'a', d2).state;
    expect(s.streak).toBe(2);
    expect(linkToday(s, 'a', d2)).toEqual({ mine: true, theirs: false, streak: 2, atStake: true });
    expect(linkToday(s, 'b', d2)).toEqual({ mine: false, theirs: true, streak: 2, atStake: true });
    const next = tickLink(s, addDays(d0, 3));
    expect(next.streak).toBe(0);
    expect(next.bestStreak).toBe(2); // le record reste
    expect(next.lives).toBe(MAX_LIVES);
    expect(linkToday(next, 'a', addDays(d0, 3))).toEqual({ mine: false, theirs: false, streak: 0, atStake: false });
  });
  it('la série tombée repart à 1 au prochain jour à deux', () => {
    let s = both(both(newLink(d0), d0), addDays(d0, 1));
    s = write(s, 'a', addDays(d0, 2)).state; // un seul
    s = both(s, addDays(d0, 3));
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(2);
  });
  it('la série est en jeu le matin : elle s’affiche, sans être encore gagnée aujourd’hui', () => {
    const s = both(both(newLink(d0), d0), addDays(d0, 1));
    const d2 = addDays(d0, 2);
    expect(linkToday(tickLink(s, d2), 'b', d2)).toEqual({ mine: false, theirs: false, streak: 2, atStake: true });
    // Gagnée : plus en jeu.
    expect(linkToday(both(s, d2), 'b', d2)).toEqual({ mine: true, theirs: true, streak: 3, atStake: false });
  });
  it('lue sans rattrapage, une série passée ne s’affiche pas (le jour d’après le jour manqué)', () => {
    const s = both(newLink(d0), d0);
    expect(linkToday(s, 'a', addDays(d0, 2)).streak).toBe(0);
  });
  it('un jour entier de silence fait aussi tomber la série (sans rien coûter d’autre)', () => {
    const s = both(both(newLink(d0), d0), addDays(d0, 1));
    const later = tickLink(s, addDays(d0, 3));
    expect(later.streak).toBe(0);
    expect(later.lives).toBe(MAX_LIVES);
  });
});

describe('lien : bascule de minuit, heure de Paris', () => {
  const at = (iso: string): Day => dayOf(new Date(iso));
  it('23 h 59 et 0 h 00 tombent sur deux jours (heure d’hiver, UTC+1)', () => {
    expect(at('2026-11-16T22:59:59Z')).toBe('2026-11-16');
    expect(at('2026-11-16T23:00:00Z')).toBe('2026-11-17');
  });
  it('le deuxième qui écrit à 23 h 59 garde la série ; à 0 h 00, c’est trop tard', () => {
    const start = both(newLink('2026-11-15'), '2026-11-15'); // série 1
    const withA = write(start, 'a', at('2026-11-16T08:00:00Z')).state;
    const justInTime = write(withA, 'b', at('2026-11-16T22:59:59Z'));
    expect(justInTime.duoDay).toBe(true);
    expect(justInTime.state.streak).toBe(2);
    const tooLate = write(withA, 'b', at('2026-11-16T23:00:00Z'));
    expect(tooLate.duoDay).toBe(false); // le 17 : a n'a pas encore écrit ce jour-là
    expect(tooLate.state.streak).toBe(0); // le 16 n'a été écrit que par a
  });
  it('changement d’heure (heure d’été, 28 mars 2027 : UTC+1 → UTC+2)', () => {
    expect(at('2027-03-27T22:59:59Z')).toBe('2027-03-27');
    expect(at('2027-03-28T21:59:59Z')).toBe('2027-03-28');
    expect(at('2027-03-28T22:00:00Z')).toBe('2027-03-29');
    let s = both(newLink('2027-03-27'), at('2027-03-27T22:30:00Z'));
    s = both(s, at('2027-03-28T21:30:00Z'));
    expect(s.streak).toBe(2);
    s = write(s, 'a', at('2027-03-28T22:30:00Z')).state; // déjà le 29 à Paris
    expect(linkToday(s, 'a', '2027-03-29')).toEqual({ mine: true, theirs: false, streak: 2, atStake: true });
  });
  it('retour à l’heure d’hiver (25 octobre 2026 : jour de 25 h)', () => {
    expect(at('2026-10-24T21:59:59Z')).toBe('2026-10-24');
    expect(at('2026-10-24T22:00:00Z')).toBe('2026-10-25');
    expect(at('2026-10-25T22:59:59Z')).toBe('2026-10-25');
    let s = both(newLink('2026-10-24'), '2026-10-24');
    s = both(s, at('2026-10-25T22:30:00Z'));
    expect(s.streak).toBe(2);
  });
});

describe('lien : expérience (rééquilibrage de la photo du jour)', () => {
  it('reprend à l’identique les points de la photo : 8 par personne, 12 pour le jour à deux', () => {
    const a = write(newLink(d0), 'a', d0);
    expect(a.state.xp).toBe(LINK_XP.message + LINK_XP.firstOfDay); // 9 = 1 message + ce que rapportait sa photo
    const b = write(a.state, 'b', d0);
    expect(b.state.xp - a.state.xp).toBe(LINK_XP.message + LINK_XP.firstOfDay + LINK_XP.duoDay); // 21
    expect(LINK_XP.firstOfDay * 2 + LINK_XP.duoDay).toBe(28); // photo + photo + photo à deux, avant
  });
  it('le plafond quotidien ne porte que sur les messages', () => {
    const xp = { day: '', xp: 0 };
    const r = write(write(newLink(d0), 'a', d0, 30, xp).state, 'b', d0, 30, xp);
    expect(r.state.xp).toBe(MESSAGE_XP_PER_DAY + 28);
    // Le lendemain, le plafond repart.
    expect(write(r.state, 'a', addDays(d0, 1), 1, xp).state.xp).toBe(MESSAGE_XP_PER_DAY + 28 + 1 + 8);
  });
  it('un duo qui s’écrit chaque jour atteint le niveau 7 au même rythme qu’avec la photo du jour', () => {
    // Avant : 3 messages chacun (6 xp) + deux photos (16) + la photo à deux (12) = 34 xp par jour.
    const before = 6 + 8 + 8 + 12;
    let s = newLink(d0);
    let day = 0;
    while (s.level < 7) {
      const d = addDays(d0, day++);
      const xp = { day: '', xp: 0 };
      s = write(write(s, 'a', d, 3, xp).state, 'b', d, 3, xp).state;
    }
    expect(day).toBe(Math.ceil(LEVEL_XP[6] / before)); // 36 jours, comme avant
    expect(s.streak).toBe(day);
  });
  it('le niveau suivant et ce qu’il manque', () => {
    expect(nextLevel(0)).toEqual({ level: 2, key: 'jouent', xpLeft: 40 });
    expect(nextLevel(100)).toEqual({ level: 3, key: 'emmenagent', xpLeft: 20 });
    expect(nextLevel(5000)).toBeNull();
  });
  it('niveaux et visages', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(40)).toBe(2);
    expect(levelForXp(5000)).toBe(7);
    // Lien noué : visage net dès le niveau 1 (règle du 21 nov. 2026).
    expect(linkFace(true)).toBe('clear');
    expect(linkFace(false)).toBe('hidden');
    expect(pastPhotosShown(4, true)).toBe(false);
    expect(pastPhotosShown(5, true)).toBe(true);
    expect(pastPhotosShown(7, false)).toBe(false);
    // Avant le lien : jamais net ; flou seulement quand la vignette du serveur existe.
    expect(faceBeforeLink(true)).toBe('blurred');
    expect(faceBeforeLink(false)).toBe('hidden');
  });
});

describe('lien : étapes (souvenirs)', () => {
  it('note chaque niveau passé et chaque palier de série, une seule fois, avec son jour', () => {
    let s = newLink(d0);
    for (let i = 0; i < 3; i++) s = both(s, addDays(d0, i));
    expect(s.milestones).toContainEqual({ kind: 'level', value: 2, on: addDays(d0, 1) });
    expect(s.milestones).toContainEqual({ kind: 'streak', value: 3, on: addDays(d0, 2) });
    // Série tombée puis revenue à 3 : pas de deuxième palier.
    s = tickLink(s, addDays(d0, 4));
    for (let i = 4; i < 7; i++) s = both(s, addDays(d0, i));
    expect(s.streak).toBe(3);
    expect(s.milestones.filter((m) => m.kind === 'streak')).toHaveLength(1);
  });
  it('un gros gain d’un coup note tous les niveaux franchis', () => {
    const s = { ...newLink(d0), xp: LEVEL_XP[3] - 1 };
    const r = applyLinkMessage({ ...s, level: 1 }, 'a', d0);
    expect(r.state.level).toBe(4);
    expect(r.state.milestones.map((m) => m.value)).toEqual([2, 3, 4]);
  });
});

describe('lien : la journée et la semaine', () => {
  it('ne garde que les deux dernières semaines de jours écrits', () => {
    let s = newLink(d0);
    for (let i = 0; i < 30; i++) s = write(s, i % 2 ? 'a' : 'b', addDays(d0, i)).state;
    expect(s.recentDays).toHaveLength(RECENT_DAYS_KEPT);
    expect(s.recentDays[0]?.day).toBe(addDays(d0, 30 - RECENT_DAYS_KEPT));
    expect(s.recentDays.at(-1)?.day).toBe(addDays(d0, 29));
  });
  it('la semaine en cours, du lundi au dimanche : passé, aujourd’hui, à venir, avant le lien', () => {
    const created = addDays(d0, 1); // mardi
    let s = newLink(created);
    s = both(s, created);
    s = write(s, 'b', addDays(d0, 2)).state;
    const week = linkWeek(s.recentDays, addDays(d0, 3), created);
    expect(week.map((d) => d.day)).toEqual([0, 1, 2, 3, 4, 5, 6].map((n) => addDays(d0, n)));
    expect(week.map((d) => d.when)).toEqual(['past', 'past', 'past', 'today', 'future', 'future', 'future']);
    expect(week.map((d) => d.beforeLink)).toEqual([true, false, false, false, false, false, false]);
    expect(week[1]).toMatchObject({ a: true, b: true });
    expect(week[2]).toMatchObject({ a: false, b: true });
    expect(week[3]).toMatchObject({ a: false, b: false });
  });
  it('qui doit encore écrire (« à toi d’écrire »)', () => {
    const s = newLink(d0);
    expect(lateSide(s, d0)).toBeNull();
    expect(lateSide(write(s, 'a', d0).state, d0)).toBe('b');
    expect(lateSide(write(s, 'b', d0).state, d0)).toBe('a');
    expect(lateSide(both(s, d0), d0)).toBeNull();
    // Hier ne compte pas.
    expect(lateSide(write(s, 'a', d0).state, addDays(d0, 1))).toBeNull();
    expect(lateSide(tickLink(newLink(d0), addDays(d0, 30)), addDays(d0, 30))).toBeNull();
  });
  it('rappel du soir : de 19 h à 22 h', () => {
    expect([18, 19, 21, 22].map(isWriteReminderHour)).toEqual([false, true, true, false]);
  });
});
