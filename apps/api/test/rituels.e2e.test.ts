/**
 * Rituels (V7) de bout en bout, en mémoire : sortie du jour et sociabilité, défi du jour (chaque type), série et jokers,
 * habitudes et preuves (oui / non / pas sûr), photos privées et purge, bilan de la semaine, notifications planifiées,
 * et replis quand la passerelle IA refuse.
 */
import { randomUUID } from 'node:crypto';
import type { ApiClient } from '@blowy/api-client';
import { HABITS, reviewCoachSystem, reviewDetailedAxisLine, reviewNoticedLine, rituelsText } from '@blowy/content';

const { outing: outingText, proofVerdictLines, review: reviewFr } = rituelsText.in('fr');
const reviewText = {
  ...reviewFr,
  coachSystem: reviewCoachSystem,
  noticed: (axis: Parameters<typeof reviewNoticedLine>[1], dir: 'up' | 'down') => reviewNoticedLine('fr', axis, dir),
  detailedAxis: (axis: Parameters<typeof reviewDetailedAxisLine>[1], delta: number) => reviewDetailedAxisLine('fr', axis, delta),
};
import type { DailyChallenge } from '@blowy/contract';
import { LINK_NOTES, REVIEW_HIGHLIGHTS, REVIEW_TIPS, VISION_AXES, isKindText } from '@blowy/domain';
import { type MockInstance, afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { AI_GATEWAY, type AiGateway } from '../src/integrations/ai/ai-gateway';
import type { MemoryModel } from '../src/integrations/ai/memory-model';
import { AI_MODEL } from '../src/integrations/plateforme/plateforme.module';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import type { MemoryStorage } from '../src/integrations/storage/memory-storage';
import { RituelsJobs } from '../src/modules/rituels/application/rituels.jobs';
import { AiCoach, AiHabitVerifier, MemoryHabitVerifier, MemoryProofImages, parseProofAnswer } from '../src/modules/rituels/infrastructure/adapters';
import { HABIT_VERIFIER } from '../src/modules/rituels/tokens';
import { VISION_SIGNALS, type VisionSignals } from '../src/modules/vision/tokens';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB, STORAGE } from '../src/shared/tokens';
import { type TestWorld, apiError, doToday, errorCode, onboardBody, startWorld, upload } from './helpers';

type Person = { id: string; api: ApiClient };

async function newPerson(world: TestWorld, name = 'Camille', id: string = randomUUID()): Promise<Person> {
  const p = world.client(id);
  await p.api.me.onboard(onboardBody({ displayName: name }));
  return p;
}

/** Une personne dont le défi du jour (au jour courant de l'horloge) est du type voulu. */
async function personWithChallenge(world: TestWorld, kind: DailyChallenge['kind'], name = 'Camille'): Promise<Person> {
  for (let i = 0; i < 80; i++) {
    const p = await newPerson(world, name);
    if ((await p.api.rituals.today()).challenge.kind === kind) return p;
  }
  throw new Error(`aucune personne avec un défi « ${kind} »`);
}

/** Avance jusqu'à l'heure de Paris donnée (hiver, UTC+1), le jour même ou le lendemain. */
function advanceToParisHour(world: TestWorld, hour: number): void {
  const now = world.clock.now();
  const target = new Date(now);
  target.setUTCHours(hour - 1, 0, 0, 0);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
  world.clock.advanceMinutes((target.getTime() - now.getTime()) / 60_000);
}

describe('rituels', () => {
  let world: TestWorld;
  let notify: MockInstance<Notifier['notify']>;
  let record: MockInstance<VisionSignals['record']>;

  beforeAll(async () => {
    world = await startWorld();
    notify = vi.spyOn(world.app.get<Notifier>(NOTIFIER), 'notify');
    record = vi.spyOn(world.app.get<VisionSignals>(VISION_SIGNALS), 'record');
  });
  afterAll(() => world.close());
  afterEach(() => {
    notify.mockClear();
    record.mockClear();
  });

  describe('accueil et défi du jour', () => {
    it('la carte monte à la première ouverture, puis plus après « vu » ; le défi ne change pas de la journée', async () => {
      const p = await newPerson(world);
      const first = await p.api.rituals.today();
      expect(first.challenge).toMatchObject({ status: 'offered', present: true, day: '2026-11-11' });
      expect(first.streak).toMatchObject({ current: 0, best: 0, doneToday: false, atRisk: false, jokersLeft: 1, jokersPerWeek: 1, nextMilestone: { days: 3, itemId: 'fleurs' } });
      expect(first.streak.week.map((d) => d.status)).toEqual(['not_yet', 'not_yet', 'today', 'future', 'future', 'future', 'future']); // lundi et mardi précèdent le compte (créé mercredi)
      expect(first.outing).toMatchObject({ question: outingText.question, canAnswer: true, answer: null, confirmed: false });
      expect(first.sociability).toBe(80);
      expect(first.needsOut).toBe(false);
      expect(first.unreadReviewId).toBeNull();

      const again = await p.api.rituals.today();
      expect(again.challenge.id).toBe(first.challenge.id);
      expect(again.challenge.present).toBe(true);

      const seen = await p.api.rituals.seenChallenge();
      expect(seen.challenge).toMatchObject({ status: 'seen', present: false });
      expect((await p.api.rituals.today()).challenge.present).toBe(false);
      const accepted = await p.api.rituals.acceptChallenge();
      expect(accepted.challenge.status).toBe('accepted');
      // « vu » après « accepté » ne recule pas.
      expect((await p.api.rituals.seenChallenge()).challenge.status).toBe('accepted');
    });

    it('question : la réponse devient une observation de vision (source « daily ») sur l’axe visé, une fois', async () => {
      const p = await personWithChallenge(world, 'question');
      const before = await p.api.rituals.today();
      expect(before.challenge.choices).toHaveLength(2);
      record.mockClear();
      const done = await p.api.rituals.answerChallenge(0);
      expect(done.challenge).toMatchObject({ status: 'done', answer: 0, present: false });
      expect(done.streak).toMatchObject({ current: 1, best: 1, doneToday: true });
      expect(done.line).not.toBeNull();
      expect(record).toHaveBeenCalledWith(p.id, [expect.objectContaining({ source: 'daily', axis: expect.any(String) })]);
      expect(await apiError(p.api.rituals.answerChallenge(1))).toMatchObject({ code: 'already_done' });
      expect(await errorCode(p.api.rituals.completeChallenge())).toBe('already_done');
      // Compté aussi comme défi relevé (garde-robe) : le pansement se débloque.
      expect((await p.api.pet.get()).newItems).toContain('pansement');
    });

    it('photo : envoyée avec un ticket, privée ; refusée si elle ne correspond pas', async () => {
      const p = await personWithChallenge(world, 'photo');
      expect(await errorCode(p.api.rituals.answerChallenge(0))).toBe('invalid');
      const ticket = await p.api.rituals.challengePhotoTicket('image/jpeg');
      expect(ticket.path).toMatch(new RegExp(`^rituals/${p.id}/2026-11-11/daily-`));
      expect(await errorCode(p.api.rituals.challengePhoto(ticket.path))).toBe('invalid'); // pas encore envoyée
      expect(await errorCode(p.api.rituals.challengePhoto(`rituals/${randomUUID()}/2026-11-11/daily-${randomUUID()}.jpg`))).toBe('invalid');
      await upload(ticket.uploadUrl);
      const done = await p.api.rituals.challengePhoto(ticket.path);
      expect(done.challenge.status).toBe('done');
      expect(done.streak.current).toBe(1);
    });

    it('sortir : validé par « Tu es sorti aujourd’hui ? »', async () => {
      const p = await personWithChallenge(world, 'go_out');
      expect(await apiError(p.api.rituals.completeChallenge())).toMatchObject({ code: 'invalid' });
      const notYet = await p.api.rituals.outing('not_yet');
      expect(notYet.outing).toMatchObject({ canAnswer: true, answer: 'not_yet' });
      expect(notYet.challenge.status).not.toBe('done');
      const out = await p.api.rituals.outing('saw_people');
      expect(out.challenge.status).toBe('done');
      expect(out.streak.current).toBe(1);
      expect(out.outing).toMatchObject({ canAnswer: false, answer: 'saw_people' });
    });

    it('écrire à un lien : validé dès qu’un message part (à l’ouverture ou sur demande)', async () => {
      // Il faut un lien actif pour que ce type sorte.
      let writer: Person | null = null;
      for (let i = 0; i < 80 && !writer; i++) {
        const a = await newPerson(world, 'Ana');
        const b = await newPerson(world, 'Ben');
        await b.api.encounters.wave(a.id);
        const [incoming] = (await a.api.encounters.list()).incoming;
        await a.api.encounters.accept(incoming?.id ?? '');
        if ((await a.api.rituals.today()).challenge.kind === 'write') writer = a;
      }
      if (!writer) throw new Error('aucun défi « écrire »');
      expect(await errorCode(writer.api.rituals.completeChallenge())).toBe('invalid');
      const [link] = await writer.api.links.list();
      await writer.api.links.send(link?.id ?? '', { body: 'coucou' });
      const today = await writer.api.rituals.today();
      expect(today.challenge.status).toBe('done');
      expect(today.streak.current).toBe(1);
    });
  });

  describe('sortie du jour et sociabilité', () => {
    it('déclarative, une fois par jour ; « pas encore » laisse la question ouverte ; la sociabilité monte', async () => {
      const p = await newPerson(world);
      const later = await p.api.rituals.outing('not_yet');
      expect(later).toMatchObject({ line: outingText.reply.not_yet, sociability: 80 });
      const walk = await p.api.rituals.outing('walk');
      expect(walk.sociability).toBe(100);
      expect(walk.outing).toMatchObject({ canAnswer: false, answer: 'walk', confirmed: false });
      expect(await apiError(p.api.rituals.outing('saw_people'))).toMatchObject({ code: 'already_done' });
      expect((await p.api.pet.get()).events.map((e) => e.kind)).toContain('went_out');
      // Le quotidien voulu (axe Rythme), source « care ».
      expect(record).toHaveBeenCalledWith(p.id, [expect.objectContaining({ axis: 'rythme', source: 'care' })]);
    });

    it('confirmée par une position hors de la zone du domicile (app, ou dernier relevé de la vision)', async () => {
      const byApp = await newPerson(world);
      expect((await byApp.api.rituals.outing('saw_people', true)).outing.confirmed).toBe(true);

      const byVision = await newPerson(world);
      await byVision.api.vision.locate({ latitude: 48.9, longitude: 2.55 }); // ~14 km de la République
      const out = await byVision.api.rituals.outing('walk');
      expect(out.outing.confirmed).toBe(true);
      expect(out.line).toContain(outingText.confirmed);
    });

    it('saluer, écrire, s’écrire à deux font monter la sociabilité ; sans sortir, elle baisse et le minimoa a besoin de sortir', async () => {
      const p = await newPerson(world);
      world.clock.advanceHours(20);
      const low = await p.api.rituals.today();
      expect(low.sociability).toBe(50);
      world.clock.advanceHours(10);
      const lower = await p.api.rituals.today();
      expect(lower).toMatchObject({ sociability: 35, needsOut: false });
      world.clock.advanceHours(2);
      expect(await p.api.rituals.today()).toMatchObject({ sociability: 32, needsOut: true });
      const other = await newPerson(world, 'Zoé');
      // Saluer : +4 pour qui salue.
      await other.api.encounters.wave(p.id);
      expect((await other.api.rituals.today()).sociability).toBe(84);
      const out = await p.api.rituals.outing('saw_people');
      expect(out.sociability).toBe(72);
    });
  });

  describe('série', () => {
    it('trois jours d’affilée → palier 3 et son objet ; un jour manqué prend le joker ; deux jours de suite dans la semaine la remettent à zéro', async () => {
      const w = await startWorld();
      try {
        const p = await newPerson(w);
        expect((await doToday(p)).newItems).toEqual([]); // mercredi 11
        w.clock.advanceDays(1);
        await doToday(p); // jeudi 12
        w.clock.advanceDays(1);
        expect((await doToday(p)).newItems).toEqual(['fleurs']); // vendredi 13 : palier 3
        expect((await p.api.pet.wardrobe()).items.find((i) => i.id === 'fleurs')).toMatchObject({ state: 'owned', goal: { stat: 'ritualStreak', have: 3, need: 3 } });

        w.clock.advanceDays(2); // samedi 14 manqué → joker
        const sunday = await p.api.rituals.streak();
        expect(sunday).toMatchObject({ current: 3, jokersLeft: 0, atRisk: true });
        await doToday(p); // dimanche 15
        const full = await p.api.rituals.streak();
        expect(full).toMatchObject({ current: 4, best: 4, doneToday: true, atRisk: false });
        expect(full.week.map((d) => d.status)).toEqual(['not_yet', 'not_yet', 'done', 'done', 'done', 'joker', 'done']);

        // Nouvelle semaine : un joker de nouveau. Lundi 16 et mardi 17 manqués.
        w.clock.advanceDays(2);
        expect(await p.api.rituals.streak()).toMatchObject({ current: 4, jokersLeft: 0 });
        w.clock.advanceDays(1);
        const reset = await p.api.rituals.streak();
        expect(reset).toMatchObject({ current: 0, best: 4, atRisk: false });
        expect(reset.week.map((d) => d.status)).toEqual(['joker', 'missed', 'today', 'future', 'future', 'future', 'future']);
        // Le record et l'objet restent.
        expect((await p.api.pet.wardrobe()).items.find((i) => i.id === 'fleurs')?.state).toBe('owned');
      } finally {
        await w.close();
      }
    });

    it('Blowy+ : trois jokers par semaine', async () => {
      const p = await newPerson(world);
      const db = world.app.get<MemoryDb>(MEMORY_DB);
      const profile = db.profiles.get(p.id);
      if (profile) profile.plusUntil = '2030-01-01T00:00:00.000Z';
      expect(await p.api.rituals.streak()).toMatchObject({ jokersPerWeek: 3, jokersLeft: 3 });
    });
  });

  describe('habitudes', () => {
    let p: Person;
    let verifier: MemoryHabitVerifier;
    beforeAll(async () => {
      p = await newPerson(world, 'Hugo');
      // Accord explicite pour la vérification des preuves par l'IA (audit B5) : sans lui, rien ne part au vérificateur.
      await p.api.me.setAiProofs(true);
      verifier = world.app.get<MemoryHabitVerifier>(HABIT_VERIFIER);
    });

    it('catalogue relié aux axes ; 2 habitudes sans Blowy+, 6 avec', async () => {
      const cat = await p.api.rituals.habitCatalogue();
      expect(cat.habits.map((h) => h.id)).toEqual(HABITS.map((h) => h.id));
      expect(cat.habits.find((h) => h.id === 'marcher')).toMatchObject({ ask: 'Montre-moi tes baskets.', axis: 'rythme' });
      expect(cat).toMatchObject({ limit: 2, used: 0 });

      const one = await p.api.rituals.addHabit({ habitId: 'marcher' });
      expect(one.habits[0]).toMatchObject({ habitId: 'marcher', rhythm: 'daily', proofHour: 18, streak: 0, today: { due: true, doneToday: false } });
      // Choisir une habitude renseigne déjà la vision (source « habit »).
      expect(record).toHaveBeenCalledWith(p.id, [expect.objectContaining({ axis: 'rythme', source: 'habit' })]);
      await p.api.rituals.addHabit({ habitId: 'voir_un_ami', rhythm: 'three_per_week', proofHour: 9 });
      expect(await apiError(p.api.rituals.addHabit({ habitId: 'lire' }))).toMatchObject({ code: 'forbidden' });
      expect(await errorCode(p.api.rituals.addHabit({ habitId: 'marcher' }))).toBe('conflict');
      expect(await errorCode(p.api.rituals.addHabit({ habitId: 'inconnue' }))).toBe('invalid');

      const db = world.app.get<MemoryDb>(MEMORY_DB);
      const profile = db.profiles.get(p.id);
      if (profile) profile.plusUntil = '2030-01-01T00:00:00.000Z';
      const three = await p.api.rituals.addHabit({ habitId: 'lire' });
      expect(three).toMatchObject({ limit: 6, canAdd: true });
      const two = await p.api.rituals.removeHabit(three.habits.find((h) => h.habitId === 'lire')?.ref ?? '');
      expect(two.habits.map((h) => h.habitId)).toEqual(['marcher', 'voir_un_ami']);
      if (profile) profile.plusUntil = null;
    });

    it('preuve : « non » se retente, « pas sûr » compte ; une phrase gentille ; la sociabilité monte et un objet se débloque', async () => {
      const { habits } = await p.api.rituals.habits();
      const friend = habits.find((h) => h.habitId === 'voir_un_ami');
      if (!friend) throw new Error('habitude');
      expect(friend.today.askNow).toBe(true); // 9 h passée
      const socBefore = (await p.api.pet.get()).pet.needs.sociability;

      verifier.queue(p.id, 'no', 'unsure');
      const t1 = await p.api.rituals.proofTicket(friend.ref, 'image/jpeg');
      await upload(t1.uploadUrl);
      const no = await p.api.rituals.proof(friend.ref, t1.path);
      expect(no).toMatchObject({ verdict: 'no', counted: false, newItems: [], kept: false });
      expect(proofVerdictLines.no).toContain(no.line);
      expect(no.habit.today).toMatchObject({ doneToday: false, verdict: 'no' });

      const t2 = await p.api.rituals.proofTicket(friend.ref, 'image/jpeg');
      await upload(t2.uploadUrl);
      const unsure = await p.api.rituals.proof(friend.ref, t2.path, true);
      expect(unsure).toMatchObject({ verdict: 'unsure', counted: true, kept: true, newItems: ['tasse'] });
      expect(proofVerdictLines.unsure).toContain(unsure.line);
      expect(unsure.habit).toMatchObject({ streak: 0, today: { doneToday: true, doneThisWeek: 1, target: 3, due: false, verdict: 'unsure' } });
      expect(verifier.calls.at(-1)).toMatchObject({ userId: p.id, habitId: 'voir_un_ami', path: t2.path });
      // Habitude tournée vers les autres : +15 de sociabilité.
      expect((await p.api.pet.get()).pet.needs.sociability).toBe(Math.min(100, socBefore + 15));
      expect(record).toHaveBeenCalledWith(p.id, [expect.objectContaining({ axis: 'rythme', value: 45, source: 'habit' })]);
      expect(notify).toHaveBeenCalledWith(p.id, 'item_unlocked', expect.objectContaining({ item: 'tasse' }));

      expect(await errorCode(p.api.rituals.proofTicket(friend.ref, 'image/jpeg'))).toBe('already_done');
      expect(await errorCode(p.api.rituals.proof(friend.ref, t2.path))).toBe('already_done');
      expect(await errorCode(p.api.rituals.proof(randomUUID(), t2.path))).toBe('not_found');

      // Souvenirs privés : seulement la photo gardée.
      const memories = await p.api.rituals.memories();
      expect(memories.items).toHaveLength(1);
      expect(memories.items[0]).toMatchObject({ id: unsure.photoId, source: 'habit', caption: 'Voir un ami' });
    });

    it('photos privées : supprimées sous 24 h sauf celles gardées', async () => {
      const storage = world.app.get<MemoryStorage>(STORAGE);
      const { habits } = await p.api.rituals.habits();
      const walk = habits.find((h) => h.habitId === 'marcher');
      if (!walk) throw new Error('habitude');
      const t = await p.api.rituals.proofTicket(walk.ref, 'image/jpeg');
      await upload(t.uploadUrl);
      const proof = await p.api.rituals.proof(walk.ref, t.path);
      expect(proof.counted).toBe(true);
      expect(storage.peek(t.path)).not.toBeNull();

      const jobs = world.app.get(RituelsJobs);
      world.clock.advanceHours(23);
      await jobs.purgePhotos(world.clock.now(), () => false);
      expect(storage.peek(t.path)).not.toBeNull();
      world.clock.advanceHours(2);
      expect(await jobs.purgePhotos(world.clock.now(), () => false)).toBeGreaterThanOrEqual(2); // dont le « non » d'hier
      expect(storage.peek(t.path)).toBeNull();
      expect((await p.api.rituals.memories()).items).toHaveLength(1); // la photo gardée reste
      expect(await errorCode(p.api.rituals.keepPhoto(proof.photoId, true))).toBe('not_found');
      // Ne plus garder une photo la rend à la purge.
      const kept = (await p.api.rituals.memories()).items[0];
      await p.api.rituals.keepPhoto(kept?.id ?? '', false);
      expect((await p.api.rituals.memories()).items).toHaveLength(0);
    });

    it('suppression du compte : les photos privées gardées disparaissent du stockage', async () => {
      const storage = world.app.get<MemoryStorage>(STORAGE);
      const q = await newPerson(world, 'Nina');
      const ref = (await q.api.rituals.addHabit({ habitId: 'lire' })).habits[0]?.ref ?? '';
      const t = await q.api.rituals.proofTicket(ref, 'image/jpeg');
      await upload(t.uploadUrl);
      await q.api.rituals.proof(ref, t.path, true);
      expect(storage.peek(t.path)).not.toBeNull();
      await q.api.me.remove();
      expect(storage.peek(t.path)).toBeNull();
    });
  });

  describe('replis quand l’IA refuse', () => {
    it('vérification réelle : coupée, en panne, image illisible → « pas sûr » (on fait confiance) ; réponse du modèle lue', async () => {
      const w = await startWorld({ AI_KILL_SWITCH: '1' });
      try {
        const gateway = w.app.get<AiGateway>(AI_GATEWAY);
        const images = new MemoryProofImages(w.app.get<MemoryStorage>(STORAGE));
        const p = await newPerson(w);
        const ref = (await p.api.rituals.addHabit({ habitId: 'marcher' })).habits[0]?.ref ?? '';
        const t = await p.api.rituals.proofTicket(ref, 'image/jpeg');
        await upload(t.uploadUrl);
        const verifier = new AiHabitVerifier(gateway, images);
        expect(await verifier.verify({ userId: p.id, locale: 'fr', habitId: 'marcher', path: t.path })).toEqual({ verdict: 'unsure', byModel: false });
        expect(await verifier.verify({ userId: p.id, locale: 'fr', habitId: 'marcher', path: 'rituals/nulle-part.jpg' })).toEqual({ verdict: 'unsure', byModel: false });
        expect(await verifier.verify({ userId: p.id, locale: 'fr', habitId: 'inconnue', path: t.path })).toEqual({ verdict: 'unsure', byModel: false });
      } finally {
        await w.close();
      }

      const on = await startWorld();
      try {
        const model = on.app.get<MemoryModel>(AI_MODEL);
        const verifier = new AiHabitVerifier(on.app.get<AiGateway>(AI_GATEWAY), new MemoryProofImages(on.app.get<MemoryStorage>(STORAGE)));
        const p = await newPerson(on);
        const ref = (await p.api.rituals.addHabit({ habitId: 'marcher' })).habits[0]?.ref ?? '';
        const t = await p.api.rituals.proofTicket(ref, 'image/jpeg');
        await upload(t.uploadUrl);
        model.respondWith(() => 'NO');
        expect(await verifier.verify({ userId: p.id, locale: 'fr', habitId: 'marcher', path: t.path })).toEqual({ verdict: 'no', byModel: true });
        const call = model.calls.at(-1);
        expect(call?.image?.mediaType).toBe('image/jpeg');
        expect(call?.prompt).toContain('Marcher');
        model.respondWith(() => 'Yes.');
        expect((await verifier.verify({ userId: p.id, locale: 'fr', habitId: 'marcher', path: t.path })).verdict).toBe('yes');
        model.failWith(true);
        expect(await verifier.verify({ userId: p.id, locale: 'fr', habitId: 'marcher', path: t.path })).toEqual({ verdict: 'unsure', byModel: false });
        model.failWith(false);
        model.respondWith(null);
      } finally {
        await on.close();
      }
      expect(parseProofAnswer('UNSURE')).toBe('unsure');
      expect(parseProofAnswer('maybe')).toBe('unsure');
    });

    it('bilan reformulé : garde le modèle quand la passerelle refuse ou quand le texte n’est pas bienveillant', async () => {
      const off = await startWorld({ AI_KILL_SWITCH: '1' });
      try {
        expect(await new AiCoach(off.app.get<AiGateway>(AI_GATEWAY)).rephrase({ userId: randomUUID(), locale: 'fr', template: 'Belle semaine.' })).toBeNull();
      } finally {
        await off.close();
      }
      const on = await startWorld();
      try {
        const [p, q] = [await newPerson(on), await newPerson(on)];
        const model = on.app.get<MemoryModel>(AI_MODEL);
        const coach = new AiCoach(on.app.get<AiGateway>(AI_GATEWAY));
        model.respondWith(() => 'Tu n’as pas assez bougé cette semaine.');
        expect(await coach.rephrase({ userId: p.id, locale: 'fr', template: 'Belle semaine.' })).toBeNull();
        // Budget de la passerelle : un bilan par personne et par jour ; au-delà, refus → modèle de phrases.
        model.respondWith(() => 'Parfait.');
        expect(await coach.rephrase({ userId: p.id, locale: 'fr', template: 'Belle semaine.' })).toBeNull();
        model.respondWith(() => '  Trois sorties, deux habitudes : Nino a adoré.  ');
        expect(await coach.rephrase({ userId: q.id, locale: 'fr', template: 'Belle semaine.' })).toBe('Trois sorties, deux habitudes : Nino a adoré.');
        expect(model.calls.at(-1)).toMatchObject({ system: reviewText.coachSystem });
        model.respondWith(null);
      } finally {
        await on.close();
      }
    });
  });
});

describe('tâches planifiées des rituels', () => {
  let world: TestWorld;
  let notify: MockInstance<Notifier['notify']>;
  let jobs: RituelsJobs;

  beforeAll(async () => {
    world = await startWorld();
    notify = vi.spyOn(world.app.get<Notifier>(NOTIFIER), 'notify');
    jobs = world.app.get(RituelsJobs);
  });
  afterAll(() => world.close());

  const kinds = (userId: string) => notify.mock.calls.filter((c) => c[0] === userId).map((c) => c[1]);

  it('minimoa qui a besoin de sortir, preuve demandée, série en danger le soir — une fois chacun ; pas de défi du jour (envoyé par la plateforme)', async () => {
    const active = await newPerson(world, 'Iris');
    const done = await newPerson(world, 'Jade');
    await active.api.rituals.today();
    await done.api.rituals.today();
    await doToday(done);
    await active.api.rituals.addHabit({ habitId: 'marcher', proofHour: 12 });
    // Jeudi : Iris garde une série d'un jour, Jade la sienne.
    await doToday(active);
    advanceToParisHour(world, 9);
    notify.mockClear();
    await active.api.rituals.today(); // ouvre l'app (active)
    await jobs.runDue(world.clock.now());
    await jobs.runDue(world.clock.now());
    // Le défi du matin n'est plus envoyé ici : la plateforme l'envoie à l'heure choisie (RitualsDailyPush).
    expect(kinds(active.id)).not.toContain('daily_challenge');
    expect(kinds(done.id)).not.toContain('daily_challenge');

    notify.mockClear();
    advanceToParisHour(world, 12);
    await jobs.runDue(world.clock.now());
    expect(notify).toHaveBeenCalledWith(active.id, 'habit_proof', { habit: 'Marcher', ask: 'Montre-moi tes baskets.' });
    // Sociabilité : 80 + 20 (sortie) le premier jour, puis 1,5/h ; besoin de sortir sous 35.
    expect(kinds(active.id)).not.toContain('needs_out');

    notify.mockClear();
    await doToday(done);
    advanceToParisHour(world, 20);
    await jobs.runDue(world.clock.now());
    expect(notify).toHaveBeenCalledWith(active.id, 'streak_in_danger', { streak: '1' });
    expect(kinds(done.id)).not.toContain('streak_in_danger');
    await jobs.runDue(world.clock.now());
    expect(kinds(active.id).filter((k) => k === 'streak_in_danger')).toHaveLength(1);

    // Deux jours sans sortir : besoin de sortir (dans sa fenêtre), une fois.
    notify.mockClear();
    world.clock.advanceDays(1);
    advanceToParisHour(world, 15);
    await jobs.runDue(world.clock.now());
    await jobs.runDue(world.clock.now());
    expect(kinds(active.id).filter((k) => k === 'needs_out')).toHaveLength(1);
  });

  it('bilan du dimanche soir : construit une fois, positif, notifié ; détaillé avec Blowy+ ; lu', async () => {
    const w = await startWorld();
    try {
      const spy = vi.spyOn(w.app.get<Notifier>(NOTIFIER), 'notify');
      const jobsW = w.app.get(RituelsJobs);
      const a = await newPerson(w, 'Lou');
      const b = await newPerson(w, 'Max');
      await b.api.encounters.wave(a.id);
      await a.api.encounters.accept((await a.api.encounters.list()).incoming[0]?.id ?? '');
      const db = w.app.get<MemoryDb>(MEMORY_DB);
      const profileB = db.profiles.get(b.id);
      if (profileB) profileB.plusUntil = '2030-01-01T00:00:00.000Z';
      for (const p of [a, b]) {
        await p.api.rituals.today();
        await p.api.rituals.outing('saw_people');
        await doToday(p);
      }
      // Dimanche 15 novembre, 19 h.
      w.clock.advanceDays(4);
      advanceToParisHour(w, 19);
      expect(await a.api.rituals.reviews()).toEqual({ reviews: [], nextBefore: null });
      await jobsW.runDue(w.clock.now());
      await jobsW.runDue(w.clock.now());
      const { reviews } = await a.api.rituals.reviews();
      expect(reviews).toHaveLength(1);
      const review = reviews[0];
      if (!review) throw new Error('bilan');
      expect(review).toMatchObject({ weekStart: '2026-11-09', title: reviewText.title, detailed: null, read: false });
      expect(review.facts).toMatchObject({ outings: 1, challengesDone: 1, habitsKept: 0 });
      expect(review.did[0]).toMatch(/^1\ssortie/);
      expect(review.links).toEqual([reviewText.link.steady('Max', 0)]);
      for (const line of [...review.did, review.noticed, review.tip, ...review.links, review.text]) expect(isKindText(line, 'fr') || line === review.text).toBe(true);
      expect(review.text).toContain(review.tip);
      expect(spy.mock.calls.filter((c) => c[0] === a.id && c[1] === 'weekly_review')).toHaveLength(1);

      const detailed = (await b.api.rituals.reviews()).reviews[0];
      expect(detailed?.detailed?.axes).toHaveLength(VISION_AXES.length);
      expect(detailed?.detailed?.links).toEqual([reviewText.detailedLink('Lou', 1, 7)]);

      expect((await a.api.rituals.today()).unreadReviewId).toBe(review.id);
      expect((await a.api.rituals.readReview(review.id)).read).toBe(true);
      expect((await a.api.rituals.today()).unreadReviewId).toBeNull();
      expect(await errorCode(b.api.rituals.review(review.id))).toBe('not_found');

      // Lundi : rattrapage sans doublon.
      w.clock.advanceHours(12);
      await jobsW.runDue(w.clock.now());
      expect((await a.api.rituals.reviews()).reviews).toHaveLength(1);
    } finally {
      await w.close();
    }
  });
});

describe('minuteur', () => {
  it('le minuteur appelle les tâches des rituels', async () => {
    const w = await startWorld({ INTERNAL_TICK_SECRET: 'secret-de-test-du-minuteur-rituels' });
    try {
      const res = await fetch(`${w.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': 'secret-de-test-du-minuteur-rituels' } });
      const body = (await res.json()) as { jobs: { name: string; error: string | null; skipped: boolean }[] };
      expect(body.jobs.find((j) => j.name === 'rituels')).toMatchObject({ error: null, skipped: false });
    } finally {
      await w.close();
    }
  });
});

describe('monde de démo', () => {
  it('séries et habitudes des personnes de démo ; la nouvelle personne a déjà un bilan', async () => {
    const w = await startWorld({ BLOWY_DEMO: '1' });
    try {
      const me = await newPerson(w);
      const today = await me.api.rituals.today();
      expect(today.challenge.present).toBe(true);
      const { reviews } = await me.api.rituals.reviews();
      expect(reviews).toHaveLength(1);
      expect(reviews[0]).toMatchObject({ weekStart: '2026-11-02', did: [reviewText.highlight.calm({ petName: 'Nino', outings: 0, habitsKept: 0, challengesDone: 0, streak: 0 })] });
      expect(today.unreadReviewId).toBe(reviews[0]?.id);
      const lea = w.client('00000000-0000-4000-8000-00000000000a');
      expect(await lea.api.rituals.streak()).toMatchObject({ current: 12, best: 21 });
      expect((await lea.api.rituals.habits()).habits.map((h) => h.habitId)).toEqual(['marcher', 'voir_un_ami']);
    } finally {
      await w.close();
    }
  });
});

describe('modèles de phrases', () => {
  it('tous passent le garde-fou de positivité', () => {
    const vars = { petName: 'Nino', outings: 3, habitsKept: 2, challengesDone: 5, streak: 7 };
    const lines: string[] = [
      ...REVIEW_HIGHLIGHTS.map((h) => reviewText.highlight[h](vars)),
      ...REVIEW_HIGHLIGHTS.map((h) => reviewText.highlight[h]({ ...vars, outings: 1, habitsKept: 1, challengesDone: 1 })),
      ...VISION_AXES.flatMap((a) => [reviewText.noticed(a, 'up'), reviewText.noticed(a, 'down'), reviewText.detailedAxis(a, 12), reviewText.detailedAxis(a, -12), reviewText.detailedAxis(a, 0)]),
      reviewText.noticedSteady,
      ...REVIEW_TIPS.map((t) => reviewText.tip[t]),
      ...LINK_NOTES.map((n) => reviewText.link[n]('Léa', 4)),
      reviewText.detailedLink('Léa', 3, 1),
      reviewText.intro('Nino'),
      ...proofVerdictLines.yes,
      ...proofVerdictLines.unsure,
      ...Object.values(outingText.reply),
    ];
    for (const line of lines) expect(isKindText(line, 'fr'), line).toBe(true);
  });
});
