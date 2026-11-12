import { StyleSheet, View } from 'react-native';

import { FORM_BOX, type PetPose, RENDER_RATIO } from '../assets/pets';
import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Sticker } from '../atoms/Sticker';
import { Title } from '../atoms/Title';
import { SpeechBubble } from '../molecules/SpeechBubble';
import { hitSlopFor, layout } from '../lib/styles';
import { alpha, color, type GradientName, speciesGradient } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface PetHeroProps {
  pet: PetLook;
  /** « NINO, / PLUTÔT JOUEUR. » */
  title: TitleContent;
  /** Puce d'humeur en haut (« d'humeur joueuse »). */
  moodLabel?: string;
  /** Autocollant de forme (« joueur »). */
  formLabel?: string;
  /** Ce que dit le pet (bulle en haut à droite). */
  speech?: string;
  /** Dégradé ; défaut celui de l'espèce. */
  gradient?: GradientName;
  /** Pose du grand pet. Défaut `debout` (corps entier) ; une humeur donne un buste. */
  pose?: PetPose;
  /** Montre la forme d'évolution (`pet.form`) plutôt que la pose. */
  showForm?: boolean;
  onPetPress?: () => void;
  petLabel?: string;
  /** Petit bouton rond à côté de la puce d'humeur (renommer le pet). */
  onEdit?: () => void;
  editLabel?: string;
}

const PANEL_H = 226;
const PET_W = 250;
/**
 * Formes d'évolution (en pied) : le haut du dessin (houppe, crête…) est calé juste sous la bulle, le panneau coupe le corps
 * comme le buste de la maquette ; centre horizontal identique au pet de la maquette. La largeur s'adapte à la hauteur du
 * dessin pour que la même part du pet (tête et haut du corps) reste visible quelle que soit la forme.
 */
const FORM_DRAWN_H = 210;
const FORM_TOP_Y = 64;
const FORM_CENTER_RIGHT = 87;
const EDIT = 28;

/** Grand pet sur un panneau en dégradé, avec son nom en Anton (maquette V6-Pet). */
export function PetHero({ pet, title, moodLabel, formLabel, speech, gradient, pose = 'debout', showForm, onPetPress, petLabel, onEdit, editLabel }: PetHeroProps) {
  const box = FORM_BOX[pet.species][pet.form ?? 'equilibre'];
  const formW = Math.round(Math.min(270, Math.max(200, (FORM_DRAWN_H / box.height) * RENDER_RATIO)));
  const formFrame = { top: FORM_TOP_Y - box.top * (formW / RENDER_RATIO), right: FORM_CENTER_RIGHT - formW / 2 };
  const image = (
    <PetImage species={pet.species} mood={pose} form={showForm ? pet.form : undefined} size={showForm ? formW : PET_W} animation="breathe" accessibilityLabel={petLabel ?? pet.name} />
  );
  return (
    <Panel gradient={gradient ?? speciesGradient[pet.species]} radius={32} padding="none" style={styles.panel}>
      <View style={showForm ? [styles.formPet, formFrame] : styles.pet} pointerEvents="box-none">
        {onPetPress ? (
          <Pressable onPress={onPetPress} accessibilityLabel={petLabel ?? pet.name} scaleTo={0.94} haptic="medium">
            {image}
          </Pressable>
        ) : (
          image
        )}
      </View>
      <View style={styles.text} pointerEvents="box-none">
        {moodLabel || onEdit ? (
          <View style={[layout.row, styles.chips]}>
            {moodLabel ? <Chip label={moodLabel} tone="dark" ink={color.accent} left={<View style={styles.moodDot} />} style={styles.mood} /> : null}
            {onEdit ? (
              <Pressable onPress={onEdit} accessibilityLabel={editLabel} haptic="selection" hitSlop={hitSlopFor(EDIT)} style={styles.edit}>
                <Glyph name="more" size={14} color={color.dark} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <Title text={title} size={52} style={styles.title} />
      </View>
      {speech ? <SpeechBubble text={speech} tail="right" rotate={3} compact style={styles.speech} /> : null}
      {formLabel ? <Sticker label={formLabel} tone="white" rotate={-6} style={styles.sticker} /> : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { height: PANEL_H, paddingTop: 16, paddingHorizontal: 18 },
  text: { zIndex: 2, alignItems: 'flex-start' },
  chips: { gap: 6 },
  mood: { height: 26, paddingHorizontal: 11 },
  edit: { width: EDIT, height: EDIT, borderRadius: EDIT / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(color.dark, 0.12) },
  title: { marginTop: 12 },
  pet: { position: 'absolute', right: -38, bottom: -40, zIndex: 1 },
  formPet: { position: 'absolute', zIndex: 1 },
  speech: { position: 'absolute', top: 14, right: 14, maxWidth: 150, zIndex: 3, alignSelf: 'auto' },
  sticker: { position: 'absolute', bottom: 16, right: 24, zIndex: 3 },
  moodDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.accent },
});
