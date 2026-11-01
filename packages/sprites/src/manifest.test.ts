import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PET_POSES, SPECIES, STAGES } from '@blowy/domain';
import { describe, expect, it } from 'vitest';
import { ACCESSORIES, ACCESSORY_PLACEMENTS, FRAME_SEQUENCES, POSE_FALLBACKS } from './catalog.js';
import { ASSET_META } from './data/asset-meta.js';
import { allDeclaredPaths, layoutAccessory, layoutSprite, resolveBabySprite, resolveSprite, spriteInventory } from './resolve.js';
import { ACCESSORY_IDS } from './types.js';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

describe('manifest sprites', () => {
  it('chaque chemin déclaré pointe vers un fichier existant et mesuré', () => {
    for (const path of allDeclaredPaths()) {
      expect(existsSync(join(ASSETS, path)), path).toBe(true);
      expect(ASSET_META[path], `meta manquante pour ${path}`).toBeDefined();
    }
  });

  it('chaque fichier des métadonnées existe (meta régénérée)', () => {
    for (const path of Object.keys(ASSET_META)) expect(existsSync(join(ASSETS, path)), path).toBe(true);
  });

  it('les sprites de personnages et accessoires sont transparents', () => {
    for (const path of allDeclaredPaths()) expect(ASSET_META[path]?.transparent, path).toBe(true);
  });

  it('couvre 4 espèces × 3 stades × 12 poses : fichier présent OU repli déclaré', () => {
    const rows = spriteInventory();
    expect(rows).toHaveLength(SPECIES.length * STAGES.length * PET_POSES.length);
    for (const r of rows) expect(['PRESENT', 'FALLBACK', 'PLACEHOLDER']).toContain(r.status);
    // Aucune combinaison n'aboutit au placeholder : toutes les espèces ont au moins la présentation jeune.
    expect(rows.filter((r) => r.status === 'PLACEHOLDER')).toHaveLength(0);
  });

  it('les chaînes de repli se terminent par PRESENTATION', () => {
    for (const pose of PET_POSES) {
      const chain = POSE_FALLBACKS[pose];
      if (pose !== 'PRESENTATION') expect(chain.at(-1)).toBe('PRESENTATION');
    }
  });

  it('repli de pose : maladie remplacée garde un overlay d’état', () => {
    const r = resolveSprite('GASTON', 'YOUNG', 'SICK');
    expect(r.degraded).toBe(true);
    expect(r.overlay).toBe('sick');
    expect(r.path).toBe('gaston/young/presentation.webp');
  });

  it('pose exacte disponible : non dégradée, sans overlay', () => {
    const r = resolveSprite('NINO', 'YOUNG', 'ASLEEP');
    expect(r.degraded).toBe(false);
    expect(r.overlay).toBeNull();
    expect(r.path).toBe('nino/young/asleep.webp');
  });

  it('repli de stade : adulte dessiné à partir du jeune, agrandi', () => {
    const r = resolveSprite('SUZIE', 'ADULT', 'JOYFUL');
    expect(r.resolvedStage).toBe('YOUNG');
    expect(r.stageScale).toBeGreaterThan(1);
    const baby = resolveSprite('NINO', 'BABY', 'PRESENTATION');
    expect(baby.path).toBe('nino/baby/presentation.webp');
    expect(baby.degraded).toBe(false);
  });

  it('ligne de sol stable : le bas de la boîte opaque est à y=0 pour toutes les poses', () => {
    for (const pose of PET_POSES) {
      const r = resolveSprite('NINO', 'YOUNG', pose);
      if (!r.meta) continue;
      const l = layoutSprite(r.meta, 120, r.stageScale, r.heightRatio);
      expect(l.body.top + l.body.height).toBeCloseTo(0, 6);
      expect(l.body.left + l.body.width / 2).toBeCloseTo(0, 6);
    }
  });

  it('12 accessoires, chacun placé pour chaque espèce et stade', () => {
    expect(ACCESSORY_IDS).toHaveLength(12);
    const base = resolveSprite('PIA', 'YOUNG', 'PRESENTATION');
    const layout = layoutSprite(base.meta!, 120);
    for (const id of ACCESSORY_IDS) {
      expect(ACCESSORIES[id].id).toBe(id);
      for (const s of SPECIES) expect(ACCESSORY_PLACEMENTS[s][ACCESSORIES[id].slot]).toBeDefined();
      for (const st of STAGES) expect(layoutAccessory(id, 'PIA', st, 'PRESENTATION', layout)).not.toBeNull();
    }
  });

  it('objets tenus masqués quand le pet dort', () => {
    const r = resolveSprite('NINO', 'YOUNG', 'ASLEEP');
    const l = layoutSprite(r.meta!, 120);
    expect(layoutAccessory('MUG', 'NINO', 'YOUNG', 'ASLEEP', l)).toBeNull();
    expect(layoutAccessory('BEANIE', 'NINO', 'YOUNG', 'ASLEEP', l)).not.toBeNull();
  });

  it('séquences de marche et saut : 4 frames ou repli procédural déclaré', () => {
    for (const s of SPECIES)
      for (const k of ['walk', 'jump'] as const) {
        const seq = FRAME_SEQUENCES[s][k];
        if (seq.source === 'procedural') expect(seq.frames).toHaveLength(0);
        else expect(seq.frames).toHaveLength(4);
      }
    expect(FRAME_SEQUENCES.NINO.walk.source).toBe('dedicated');
  });

  it('bébé : hybride préfabriqué sinon variante du parent', () => {
    expect(resolveBabySprite('SUZIE', 'NINO').hybrid).toBe(true);
    const v = resolveBabySprite('GASTON', 'PIA');
    expect(v.hybrid).toBe(false);
    expect(v.variantOf).toBe('GASTON');
    expect(v.path).toBe('gaston/young/presentation.webp');
  });

  it("l'inventaire documenté est à jour (docs/mobile/assets-inventory.md)", () => {
    const doc = join(ASSETS, '..', '..', '..', 'docs', 'mobile', 'assets-inventory.md');
    const text = readFileSync(doc, 'utf8');
    for (const r of spriteInventory().filter((x) => x.status !== 'PRESENT')) {
      expect(text, `${r.species}/${r.stage}/${r.pose}`).toContain(`| ${r.species} | ${r.stage} | ${r.pose} |`);
    }
  });
});
