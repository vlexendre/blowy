/**
 * Audit App Store (docs/AUDIT-APPLE.md), en mémoire de bout en bout :
 * - B5 : aucune image de preuve n'arrive à la passerelle d'IA sans l'accord explicite de la personne ; l'accord se
 *   donne, se lit et se retire (`/v1/me/ai`) ; sans IA, l'habitude se valide quand même ; le bilan de la semaine
 *   n'envoie à l'IA ni le prénom des liens ni le nom du minimoa ; la phrase d'accord du chat nomme le prestataire ;
 * - B3 : les objets premium sont à la personne tant que Minimoa+ dure (garde-robe, tenue), et rangés quand il prend fin.
 */
import { randomUUID } from 'node:crypto';
import type { ApiClient } from '@blowy/api-client';
import { chatConfidentialityText, rituelsText } from '@blowy/content';
import { PREMIUM_ITEM_IDS } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AiGateway, AiRequest, AiResult } from '../src/integrations/ai/ai-gateway';
import type { MemoryStorage } from '../src/integrations/storage/memory-storage';
import { WardrobeJobs } from '../src/modules/pets/application/wardrobe.jobs';
import { RituelsJobs } from '../src/modules/rituels/application/rituels.jobs';
import { REVIEW_AI_STAND_IN } from '../src/modules/rituels/application/reviews.service';
import { AiHabitVerifier, type MemoryHabitVerifier, MemoryProofImages, type TemplateCoach } from '../src/modules/rituels/infrastructure/adapters';
import type { Coach } from '../src/modules/rituels/ports';
import { COACH, HABIT_VERIFIER } from '../src/modules/rituels/tokens';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB, STORAGE } from '../src/shared/tokens';
import { type TestWorld, doToday, errorCode, onboardBody, startWorld, upload } from './helpers';

type Person = { id: string; api: ApiClient };

async function newPerson(world: TestWorld, name = 'Camille'): Promise<Person> {
  const p = world.client(randomUUID());
  await p.api.me.onboard(onboardBody({ displayName: name }));
  return p;
}

/** Passerelle d'IA espionne : compte chaque appel et ce qu'il porte (image comprise). */
function spyGateway(): AiGateway & { calls: AiRequest[] } {
  const calls: AiRequest[] = [];
  return {
    calls,
    async complete(req: AiRequest): Promise<AiResult> {
      calls.push(req);
      return { ok: true, text: 'YES' };
    },
  };
}

describe('audit App Store', () => {
  let world: TestWorld;
  let gateway: ReturnType<typeof spyGateway>;

  beforeAll(async () => {
    world = await startWorld();
    // La vérification réelle (passerelle d'IA, image réduite) branchée sur une passerelle espionne : on observe
    // exactement ce qui partirait chez le prestataire.
    gateway = spyGateway();
    const real = new AiHabitVerifier(gateway, new MemoryProofImages(world.app.get<MemoryStorage>(STORAGE)));
    const verifier = world.app.get<MemoryHabitVerifier>(HABIT_VERIFIER);
    vi.spyOn(verifier, 'verify').mockImplementation((input) => real.verify(input));
  });
  afterAll(() => world.close());

  async function proofWithPhoto(p: Person, ref: string) {
    const ticket = await p.api.rituals.proofTicket(ref, 'image/jpeg');
    await upload(ticket.uploadUrl);
    return p.api.rituals.proof(ref, ticket.path);
  }

  describe('IA tierce : preuves d’habitude (B5)', () => {
    it('accord jamais demandé par défaut ; le prestataire est celui de la configuration, pays dans la langue de la requête', async () => {
      const p = await newPerson(world);
      expect(await p.api.me.ai()).toEqual({ provider: { name: 'Anthropic', country: 'États-Unis' }, proofs: { consent: null, at: null } });
    });

    it('sans accord : aucune image n’arrive à la passerelle ; la preuve compte (on fait confiance)', async () => {
      const p = await newPerson(world, 'Nour');
      const { habits } = await p.api.rituals.addHabit({ habitId: 'marcher' });
      const ref = habits[0]?.ref ?? '';
      const before = gateway.calls.length;
      const r = await proofWithPhoto(p, ref);
      expect(gateway.calls.length).toBe(before);
      expect(r).toMatchObject({ verdict: 'unsure', counted: true });
      expect(rituelsText.in('fr').proofUncheckedLines).toContain(r.line);
    });

    it('refusé : toujours rien vers l’IA ; accepté : l’image part (réduite) ; retiré : plus rien ne part', async () => {
      const p = await newPerson(world, 'Inès');
      const { habits } = await p.api.rituals.addHabit({ habitId: 'marcher' });
      const walk = habits[0]?.ref ?? '';
      const read = (await p.api.rituals.addHabit({ habitId: 'lire' })).habits.find((h) => h.habitId === 'lire')?.ref ?? '';

      const refused = await p.api.me.setAiProofs(false);
      expect(refused.proofs).toMatchObject({ consent: false });
      expect(refused.proofs.at).not.toBeNull();
      const n0 = gateway.calls.length;
      await proofWithPhoto(p, walk);
      expect(gateway.calls.length).toBe(n0);

      expect((await p.api.me.setAiProofs(true)).proofs.consent).toBe(true);
      const checked = await proofWithPhoto(p, read);
      expect(gateway.calls.length).toBe(n0 + 1);
      expect(gateway.calls.at(-1)).toMatchObject({ feature: 'habit_proof', userId: p.id, image: { mediaType: 'image/jpeg' } });
      expect(checked).toMatchObject({ verdict: 'yes', counted: true });

      // Lendemain : accord retiré dans Moi, la preuve ne part plus.
      world.clock.advanceDays(1);
      expect((await p.api.me.setAiProofs(false)).proofs.consent).toBe(false);
      await proofWithPhoto(p, walk);
      expect(gateway.calls.length).toBe(n0 + 1);
    });

    it('« Sans vérification par IA » : l’habitude se valide sans photo, rien ne part, les effets sont là', async () => {
      const p = await newPerson(world, 'Lina');
      const { habits } = await p.api.rituals.addHabit({ habitId: 'voir_un_ami' });
      const ref = habits[0]?.ref ?? '';
      const before = gateway.calls.length;
      const socBefore = (await p.api.pet.get()).pet.needs.sociability;
      const done = await p.api.rituals.habitDone(ref);
      expect(gateway.calls.length).toBe(before);
      expect(done).toMatchObject({ verdict: 'unsure', counted: true, newItems: ['tasse'], habit: { today: { doneToday: true } } });
      expect(rituelsText.in('fr').selfCheckLines).toContain(done.line);
      expect((await p.api.pet.get()).pet.needs.sociability).toBeGreaterThan(socBefore);
      // Aucune photo enregistrée, une seule validation par jour.
      expect((await p.api.rituals.memories()).items).toHaveLength(0);
      expect(await errorCode(p.api.rituals.habitDone(ref))).toBe('already_done');
      expect(await errorCode(p.api.rituals.habitDone(randomUUID()))).toBe('not_found');
    });

    it('l’accord suit le compte : effacé avec lui', async () => {
      const p = await newPerson(world, 'Rémi');
      await p.api.me.setAiProofs(true);
      const db = world.app.get<MemoryDb>(MEMORY_DB);
      expect(db.aiProofsConsents.has(p.id)).toBe(true);
      await p.api.me.remove();
      expect(db.aiProofsConsents.has(p.id)).toBe(false);
    });
  });

  describe('IA tierce : chat et bilan (B5)', () => {
    it('la phrase d’accord de lecture nomme le prestataire et son pays', () => {
      const text = chatConfidentialityText('fr', { name: 'Anthropic', country: 'US' });
      expect(text).toContain('Anthropic (États-Unis)');
      expect(text).toContain('notre prestataire');
      expect(text).not.toContain('Rien n’est conservé');
      expect(chatConfidentialityText('fr', { name: 'Mistral AI', country: 'FR' })).toContain('Mistral AI (France)');
    });

    it('bilan de la semaine : ni le prénom d’un lien ni le nom du minimoa ne partent à l’IA ; ils reviennent dans le texte', async () => {
      const w = await startWorld();
      try {
        const coach = w.app.get<TemplateCoach>(COACH);
        const sent: string[] = [];
        vi.spyOn(coach as Coach, 'rephrase').mockImplementation(async (input) => {
          sent.push(input.template);
          return `Belle semaine pour ${REVIEW_AI_STAND_IN}. Une sortie, un défi.`;
        });
        const a = await newPerson(w, 'Lou');
        const b = await newPerson(w, 'Maxence');
        await b.api.encounters.wave(a.id);
        await a.api.encounters.accept((await a.api.encounters.list()).incoming[0]?.id ?? '');
        const petName = (await a.api.pet.get()).pet.name;
        for (const p of [a, b]) {
          await p.api.rituals.today();
          await p.api.rituals.outing('saw_people');
          await doToday(p);
        }
        w.clock.advanceDays(4);
        w.clock.advanceHours(8); // dimanche soir
        await w.app.get(RituelsJobs).runDue(w.clock.now());
        expect(sent.length).toBeGreaterThan(0);
        for (const t of sent) {
          expect(t).not.toContain('Maxence');
          expect(t).not.toContain('Lou');
          expect(t).not.toContain(petName);
        }
        const review = (await a.api.rituals.reviews()).reviews[0];
        expect(review?.text).toContain(`Belle semaine pour ${petName}.`);
        expect(review?.text).toContain('Maxence'); // la ligne du lien, ajoutée après, sans IA
      } finally {
        await w.close();
      }
    });
  });

  describe('objets premium (B3)', () => {
    const premium = PREMIUM_ITEM_IDS[0] ?? 'aureole';
    const setPlus = (p: Person, until: string | null) => {
      const profile = world.app.get<MemoryDb>(MEMORY_DB).profiles.get(p.id);
      if (profile) profile.plusUntil = until;
    };

    it('sans Minimoa+ : visibles, marqués Minimoa+, pas portables', async () => {
      const p = await newPerson(world, 'Yan');
      const w = await p.api.pet.wardrobe();
      const items = w.items.filter((i) => i.plus);
      expect(items.map((i) => i.id).sort()).toEqual([...PREMIUM_ITEM_IDS].sort());
      expect(items.every((i) => i.state === 'premium')).toBe(true);
      expect(await errorCode(p.api.pet.setOutfit({ head: premium }))).toBe('forbidden');
    });

    it('avec Minimoa+ : tous possédés et portables ; vus sur le minimoa', async () => {
      const p = await newPerson(world, 'Zoé');
      setPlus(p, new Date(world.clock.now().getTime() + 30 * 86_400_000).toISOString());
      const w = await p.api.pet.wardrobe();
      expect(w.items.filter((i) => i.plus).every((i) => i.state === 'owned')).toBe(true);
      const view = await p.api.pet.setOutfit({ head: premium, face: 'lunettes_rondes' });
      expect(view.pet.outfit).toEqual({ head: premium, face: 'lunettes_rondes' });
    });

    it('fin de Minimoa+ : rangés à la prochaine ouverture, et par le minuteur pour les autres ; reviennent avec Minimoa+', async () => {
      const p = await newPerson(world, 'Ali');
      const q = await newPerson(world, 'Bea');
      const soon = new Date(world.clock.now().getTime() + 3_600_000).toISOString();
      for (const x of [p, q]) {
        setPlus(x, soon);
        await x.api.pet.setOutfit({ head: premium, face: 'lunettes_rondes' });
      }
      world.clock.advanceHours(2);
      // p ouvre l'app : son minimoa a rangé l'objet premium, le reste ne bouge pas.
      const w = await p.api.pet.wardrobe();
      expect(w.outfit).toEqual({ face: 'lunettes_rondes' });
      expect(w.items.find((i) => i.id === premium)?.state).toBe('premium');
      expect(await errorCode(p.api.pet.setOutfit({ head: premium }))).toBe('forbidden');

      // q n'ouvre pas l'app : le minuteur range pour lui (ce que voient ses liens et les rencontres).
      const db = world.app.get<MemoryDb>(MEMORY_DB);
      const petOf = (id: string) => [...db.pets.values()].find((x) => x.ownerId === id);
      expect(petOf(q.id)?.outfit.head).toBe(premium);
      const jobs = world.app.get(WardrobeJobs);
      expect(await jobs.runDue(world.clock.now())).toBeGreaterThanOrEqual(1);
      expect(petOf(q.id)?.outfit).toEqual({ face: 'lunettes_rondes' });
      // Un abonné actif garde les siens.
      const r = await newPerson(world, 'Cyd');
      setPlus(r, '2099-01-01T00:00:00.000Z');
      await r.api.pet.setOutfit({ toy: 'skate' });
      await jobs.runDue(world.clock.now());
      await jobs.runDue(world.clock.now());
      expect(petOf(r.id)?.outfit).toEqual({ toy: 'skate' });

      // Réabonné : les objets reviennent dans la garde-robe.
      setPlus(p, '2099-01-01T00:00:00.000Z');
      expect((await p.api.pet.wardrobe()).items.find((i) => i.id === premium)?.state).toBe('owned');
    });
  });
});
