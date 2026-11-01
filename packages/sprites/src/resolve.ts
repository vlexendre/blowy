import { PET_POSES, SPECIES, STAGES } from '@blowy/domain';
import type { PetPose, Species, Stage } from '@blowy/domain';
import {
  ACCESSORIES,
  ACCESSORY_PLACEMENTS,
  FRAME_SEQUENCES,
  HAND_HIDDEN_POSES,
  HYBRID_BABIES,
  POSE_FALLBACKS,
  POSE_SPRITES,
  STAGE_BODY_SCALE,
  STAGE_FALLBACKS,
  STAGE_PLACEMENT_SCALE,
  STATE_OVERLAY_FOR_POSE,
} from './catalog.js';
import { ASSET_META } from './data/asset-meta.js';
import type { AccessoryId, AssetMeta, AssetPath, FrameSequence, PoseSpriteEntry, ResolvedSprite, SpriteLayout } from './types.js';

export const metaFor = (path: AssetPath): AssetMeta | null => ASSET_META[path] ?? null;

const findInStage = (species: Species, stage: Stage, pose: PetPose): { pose: PetPose; entry: PoseSpriteEntry } | null => {
  const table = POSE_SPRITES[species][stage];
  const direct = table[pose];
  if (direct) return { pose, entry: direct };
  for (const alt of POSE_FALLBACKS[pose]) {
    const e = table[alt];
    if (e) return { pose: alt, entry: e };
  }
  return null;
};

/**
 * Résout un sprite par (espèce, stade, pose) avec repli déterministe :
 *  1. pose demandée au stade demandé ; 2. chaîne POSE_FALLBACKS au même stade ;
 *  3. mêmes étapes au stade de repli (jeune) avec mise à l'échelle ; 4. placeholder (path null).
 * Jamais d'exception à l'exécution : un manque est documenté dans l'inventaire.
 */
export function resolveSprite(species: Species, stage: Stage, pose: PetPose): ResolvedSprite {
  const requested = { species, stage, pose };
  const candidates: { stage: Stage; scale: number }[] = [{ stage, scale: STAGE_BODY_SCALE[stage] }, ...STAGE_FALLBACKS[stage]];
  for (const c of candidates) {
    const hit = findInStage(species, c.stage, pose);
    if (hit) {
      const degraded = hit.pose !== pose || c.stage !== stage;
      return {
        path: hit.entry.path,
        meta: metaFor(hit.entry.path),
        requested,
        resolvedPose: hit.pose,
        resolvedStage: c.stage,
        stageScale: c.scale,
        heightRatio: hit.entry.heightRatio ?? 1,
        degraded,
        overlay: hit.pose !== pose ? (STATE_OVERLAY_FOR_POSE[pose] ?? null) : null,
      };
    }
  }
  return {
    path: null,
    meta: null,
    requested,
    resolvedPose: 'PRESENTATION',
    resolvedStage: stage,
    stageScale: STAGE_BODY_SCALE[stage],
    heightRatio: 1,
    degraded: true,
    overlay: STATE_OVERLAY_FOR_POSE[pose] ?? null,
  };
}

/** Largeur/hauteur nominales d'un placeholder (proportions d'un pet jeune debout). */
export const PLACEHOLDER_META: AssetMeta = { width: 240, height: 320, transparent: true, opaqueBox: [20, 20, 220, 316] };

/**
 * Calcule la mise en page d'un sprite autour d'un point d'origine (centre horizontal du corps,
 * ligne de sol). Le bas de la boîte opaque est toujours posé à y = 0 : changer de pose ne fait
 * pas « sauter » le pet. `bodyHeight` = hauteur visée du corps d'un pet jeune en pose neutre.
 */
export function layoutSprite(meta: AssetMeta, bodyHeight: number, stageScale = 1, heightRatio = 1): SpriteLayout {
  const [l, t, r, b] = meta.opaqueBox;
  const opaqueH = Math.max(1, b - t);
  const scale = (bodyHeight * stageScale * heightRatio) / opaqueH;
  const centerX = (l + r) / 2;
  return {
    width: meta.width * scale,
    height: meta.height * scale,
    left: -centerX * scale,
    top: -b * scale,
    body: { left: (l - centerX) * scale, top: (t - b) * scale, width: (r - l) * scale, height: opaqueH * scale },
  };
}

export interface AccessoryLayout {
  id: AccessoryId;
  path: AssetPath;
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
  behind: boolean;
}

/** Place un accessoire dans le repère de layoutSprite (origine centre-sol). null si masqué par la pose. */
export function layoutAccessory(id: AccessoryId, species: Species, stage: Stage, pose: PetPose, sprite: SpriteLayout): AccessoryLayout | null {
  const def = ACCESSORIES[id];
  if (def.slot === 'HAND' && HAND_HIDDEN_POSES.includes(pose)) return null;
  const meta = metaFor(def.path);
  if (!meta) return null;
  const place = ACCESSORY_PLACEMENTS[species][def.slot];
  const width = sprite.body.width * place.widthRatio * STAGE_PLACEMENT_SCALE[stage];
  const height = width * (meta.height / meta.width);
  const ax = sprite.body.left + sprite.body.width * place.anchor.x;
  const ay = sprite.body.top + sprite.body.height * place.anchor.y;
  // Les objets au sol reposent sur la ligne de sol ; les autres sont centrés sur l'ancrage.
  const top = def.slot === 'FLOOR' ? -height : ay - height / 2;
  return { id, path: def.path, left: ax - width / 2, top, width, height, rotation: place.rotation ?? 0, behind: place.behind ?? false };
}

/** Séquence de frames ; une séquence `procedural` n'a aucune frame et se rabat sur l'animation du renderer. */
export const framesFor = (species: Species, kind: 'walk' | 'jump'): FrameSequence => FRAME_SEQUENCES[species][kind];

/**
 * Bébé partagé (P-5.17) : hybride préfabriqué si disponible, sinon variante explicite du parent
 * « corps » au stade bébé (avec repli de stade documenté).
 */
export function resolveBabySprite(bodyParent: Species, detailParent: Species): { path: AssetPath | null; hybrid: boolean; variantOf: Species } {
  const key = `${bodyParent}_${detailParent}` as const;
  const rev = `${detailParent}_${bodyParent}` as const;
  const hybrid = HYBRID_BABIES[key] ?? HYBRID_BABIES[rev];
  if (hybrid) return { path: hybrid, hybrid: true, variantOf: bodyParent };
  return { path: resolveSprite(bodyParent, 'BABY', 'PRESENTATION').path, hybrid: false, variantOf: bodyParent };
}

export interface InventoryRow {
  species: Species;
  stage: Stage;
  pose: PetPose;
  status: 'PRESENT' | 'FALLBACK' | 'PLACEHOLDER';
  resolvedTo: string;
}

/** Inventaire exhaustif 4 espèces × 3 stades × 12 poses (sert au doc et aux tests). */
export function spriteInventory(): InventoryRow[] {
  const rows: InventoryRow[] = [];
  for (const species of SPECIES)
    for (const stage of STAGES)
      for (const pose of PET_POSES) {
        const r = resolveSprite(species, stage, pose);
        rows.push({
          species,
          stage,
          pose,
          status: r.path === null ? 'PLACEHOLDER' : r.degraded ? 'FALLBACK' : 'PRESENT',
          resolvedTo: r.path === null ? 'placeholder' : `${r.resolvedStage}/${r.resolvedPose} (${r.path})${r.overlay ? ` + overlay ${r.overlay}` : ''}`,
        });
      }
  return rows;
}

/** Toutes les références de chemins déclarées par le catalogue (tests d'existence). */
export function allDeclaredPaths(): AssetPath[] {
  const out = new Set<AssetPath>();
  for (const s of SPECIES)
    for (const st of STAGES) for (const e of Object.values(POSE_SPRITES[s][st])) if (e) out.add(e.path);
  for (const s of SPECIES) for (const k of ['walk', 'jump'] as const) for (const f of FRAME_SEQUENCES[s][k].frames) out.add(f.path);
  for (const a of Object.values(ACCESSORIES)) out.add(a.path);
  for (const h of Object.values(HYBRID_BABIES)) if (h) out.add(h);
  return [...out];
}
