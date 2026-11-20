import { describe, expect, it } from 'vitest';

import { MASCOT_MOMENTS, type MascotSource, mascotEvent, mascotMode, mascotMomentFor } from './mascot';
import { NAMED_MOTIONS } from './named';

const nino: MascotSource = {
  provider: 'masko',
  url: 'https://api.masko.ai/v1/canvases/b273f425-5fd3-49cf-9ac0-36c4944af31a/delivery',
  appKey: 'masko_app_x',
  events: { happy: 'action::happy', think: 'action::think', cheer: 'action::cheer' },
};

describe('minimoa animé', () => {
  it('réaction du serveur → moment : réfléchir, applaudir, sinon rire', () => {
    expect(mascotMomentFor('think')).toBe('think');
    expect(mascotMomentFor('confetti')).toBe('cheer');
    expect(mascotMomentFor('clap')).toBe('cheer');
    expect(mascotMomentFor('hop')).toBe('happy');
    expect(mascotMomentFor('laugh')).toBe('happy');
  });

  it('nom absent ou inconnu : repli sur rire', () => {
    expect(mascotMomentFor(null)).toBe('happy');
    expect(mascotMomentFor(undefined)).toBe('happy');
    expect(mascotMomentFor('')).toBe('happy');
    expect(mascotMomentFor('moonwalk')).toBe('happy');
    expect(mascotMomentFor('__proto__')).toBe('happy');
  });

  it('chaque animation nommée connue de l’app donne un moment', () => {
    for (const name of NAMED_MOTIONS) expect(MASCOT_MOMENTS).toContain(mascotMomentFor(name));
  });

  it('événement du lecteur : celui envoyé par le serveur', () => {
    expect(mascotEvent(nino, 'happy')).toBe('action::happy');
    expect(mascotEvent(nino, 'think')).toBe('action::think');
    expect(mascotEvent(nino, 'cheer')).toBe('action::cheer');
    expect(mascotEvent(null, 'cheer')).toBeNull();
    expect(mascotEvent({ ...nino, events: { ...nino.events, cheer: '' } }, 'cheer')).toBeNull();
  });

  it('repli sur l’affichage habituel : pas de réglage, lecteur absent, animations réduites, erreur', () => {
    const ok = { source: nino, available: true, reduced: false, failed: false };
    expect(mascotMode(ok)).toBe('masko');
    expect(mascotMode({ ...ok, source: null })).toBe('fallback');
    expect(mascotMode({ ...ok, source: undefined })).toBe('fallback');
    expect(mascotMode({ ...ok, available: false })).toBe('fallback');
    expect(mascotMode({ ...ok, reduced: true })).toBe('fallback');
    expect(mascotMode({ ...ok, failed: true })).toBe('fallback');
    expect(mascotMode({ ...ok, source: { ...nino, url: '' } })).toBe('fallback');
    expect(mascotMode({ ...ok, source: { ...nino, provider: 'rive' as 'masko' } })).toBe('fallback');
  });
});
