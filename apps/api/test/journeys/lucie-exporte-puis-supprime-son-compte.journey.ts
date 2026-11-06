/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * Histoire 7 — Export et suppression. Lucie discute avec Marc, exporte ses données, puis supprime
 * son compte. Que voit Marc après ? Que reste-t-il ? Peut-elle revenir ?
 */
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { cast, type Person } from './support/actor.js';
import { look, synthImage, upload } from './support/media.js';
import { story } from './support/story.js';
import { DAY, startWorld, type World } from './support/world.js';

let w: World;
let lucie: Person;
let marc: Person;
let relId = '';
let convId = '';
let photo = '';
let lucieToken = '';
const S = story('suppression', 'Export et suppression de compte : ce que voit l’autre');

beforeAll(async () => {
  w = await startWorld('J_SUPPRESSION');
});
afterAll(async () => w?.close());

describe('Export et suppression', () => {
  S.step('Lucie et Marc se rencontrent, discutent ; Lucie dépose une photo', async () => {
    [lucie, marc] = await cast(w, [
      { key: 'lucie', displayName: 'Lucie', gender: 'WOMAN', seeking: ['MAN'] },
      { key: 'marc', displayName: 'Marc', gender: 'MAN', seeking: ['WOMAN'] },
    ]);
    const f = await lucie.client.matching.requestOnboardingBatch();
    const p = f.items.find((i) => i.otherPet.id === marc.petId)!;
    await lucie.client.matching.accept(p.id);
    relId = (await marc.client.matching.accept(p.id)).relationshipId!;
    convId = (await lucie.client.relationships.get(relId)).conversationId!;
    await lucie.device('lucie-phone');
    await marc.device('marc-phone');
    for (const x of [lucie, marc]) await x.phone.join(`relationship:${relId}`);
    await lucie.say(convId, 'Mon secret : j’adore les capybaras', 'lucie-0001');
    await w.drain();
    await marc.say(convId, 'Le mien : je chante faux', 'marc-0001');
    await w.drain();
    photo = (await upload(lucie, { purpose: 'PROFILE_PHOTO', bytes: await synthImage() })).id;
    lucieToken = lucie.token!;
  });

  S.step('Lucie demande son export : prêt, lien privé, son contenu à elle, rien de secret sur Marc', async () => {
    const r = await lucie.call('POST', '/v1/exports', {});
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    await w.drain();
    for (const j of w.worker.jobs.filter((x) => /export/.test(x.name))) await w.runJob(j.name);
    const list = await lucie.call('GET', '/v1/exports');
    const e = list.data.items[0];
    if (e.status !== 'READY') S.note(`Export : statut ${e.status} après drain de l’outbox et des jobs — aucun job d’export identifiable à déclencher.`);
    expect(e.status).toBe('READY');
    const dl = await lucie.raw('GET', new URL(e.downloadUrl).pathname);
    expect(dl.status).toBe(200);
    const txt = dl.buf.toString('utf8');
    expect(txt).toContain('capybaras');
    expect(txt).not.toContain(marc.userId);
    expect(txt).not.toMatch(/birthDate[^,]*199\d-\d\d-\d\d[^}]*marc/i);
    if (txt.includes('je chante faux')) S.note('Export de Lucie : contient le texte des messages de Marc. Le cahier des charges exige « pas de secrets d’autrui » — à arbitrer (contexte de conversation vs données de l’autre).');
    // Marc ne peut pas télécharger l'export de Lucie.
    expect((await marc.raw('GET', new URL(e.downloadUrl).pathname)).status).toBe(404);
  });

  S.step('Lucie supprime son compte (confirmation « SUPPRIMER ») : sessions, WS et accès coupés immédiatement', async () => {
    const bad = await lucie.call('POST', '/v1/deletion-requests', { confirm: 'oui' });
    expect(bad.status).toBe(400);
    const r = await lucie.call('POST', '/v1/deletion-requests', { confirm: 'SUPPRIMER' });
    expect(r.ok, JSON.stringify(r.data)).toBe(true);
    await w.drain();
    expect((await lucie.raw('GET', '/v1/me', undefined, {}, lucieToken)).status).toBe(401);
    await new Promise((x) => setTimeout(x, 150));
    expect(lucie.phone.disconnected).toBe(true);
  });

  S.step('Marc voit la relation terminée, sans message de départ imposé, sans pénalité ; il ne peut plus écrire', async () => {
    const all = await marc.client.relationships.list(true);
    const v = all.items.find((x) => x.id === relId);
    expect(v?.status).toBe('ENDED');
    expect(JSON.stringify(v)).not.toMatch(/ACCOUNT_DELETED|DELETION/);
    expect((await marc.client.me.get()).reliability).toBe(100);
    expect((await marc.say(convId, 'Lucie ?', 'marc-after')).ok).toBe(false);
    const e = await marc.phone.waitFor((x) => x.type === 'relationship.ended', 600);
    if (!e) S.note('Marc n’est pas prévenu en direct de la fin de la relation après la suppression du compte de Lucie.');
  });

  S.step('Plus rien de Lucie n’est accessible à Marc : pet, photo, conversation', async () => {
    expect((await marc.call('GET', `/v1/pets/${lucie.petId}`)).status).toBe(404);
    expect((await look(marc, photo, 'thumbnail', relId)).status).toBe(404);
    expect((await marc.call('GET', `/v1/conversations/${convId}/messages`)).status).toBe(404);
  });

  S.step('Purge : données personnelles et médias de Lucie effacés ; les écritures nécessaires restent anonymes', async () => {
    await w.advance(DAY);
    await w.runJob('privacy.purge');
    await w.runJob('media.purge');
    const u = await w.db.user.findUnique({ where: { id: lucie.userId }, include: { profile: true } });
    expect(u?.profile?.displayName ?? null).not.toBe('Lucie');
    const body = await w.db.messageContent.findMany({ where: { message: { authorUserId: lucie.userId } } });
    expect(body.map((b: any) => JSON.stringify(b)).join()).not.toContain('capybaras');
    const media = await w.db.mediaAsset.findUnique({ where: { id: photo } });
    expect(media === null || ['PURGED', 'DELETED'].includes((media as any).status)).toBe(true);
  });

  S.step('Lucie revient plus tard avec le même identifiant de connexion', async () => {
    const r = await lucie.client.auth.signIn({ provider: 'local', credential: 'lucie', device: { platform: 'ios' } } as any).catch((e) => e);
    const st = (r as any).status ?? 200;
    const sameUser = (r as any).userId === lucie.userId;
    S.note(`Après suppression, une reconnexion avec la même identité renvoie ${st}${sameUser ? ' sur LE MÊME compte supprimé' : (r as any).isNewUser ? ' (nouveau compte vierge)' : ''}.`);
    expect(sameUser).toBe(false);
  });
});
