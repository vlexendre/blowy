#!/usr/bin/env bash
# Anime une pose de minimoa avec Seedance (via treg) et produit les fichiers
# que lit le lecteur Masko (vidéo « empilée » H.264 et AV1), un WebM VP9 alpha
# pour le web, l'affiche PNG et des planches de contrôle du détourage.
# Mode d'emploi : tools/mascottes/README.md
#
#   tools/mascottes/animer.sh --espece nino --pose rit --nom rire \
#     --prompt "The fluffy lime-green creature bursts into a happy laugh…"
#
# Aucune clé ici : la génération passe par la CLI treg déjà connectée.
set -euo pipefail

ICI="$(cd "$(dirname "$0")" && pwd)"
RACINE="$(cd "$ICI/../.." && pwd)"
POSES="$RACINE/packages/ui/assets/pets"

usage() {
  cat <<'FIN'
Usage : animer.sh --espece <nino|suzie|gaston|pia> --pose <pose> --nom <réaction> --prompt "<texte>" [options]

  --espece E        espèce (fixe la couleur du fond et le despill)
  --pose P          pose de départ : packages/ui/assets/pets/<E>_corps_<P>.webp
  --nom N           nom de la réaction (rire, repos…) : nom des fichiers
  --prompt T        consigne Seedance (en anglais ; décrire le fond uni et la caméra fixe)
  --boucle          boucle propre : fondu entre la fin et le début (voir --fondu)
  --fondu S         durée du fondu de boucle en secondes (défaut 0.5)
  --taille PX       côté de la mascotte à l'écran (défaut 540 ; fichier empilé PX × 2·PX)
  --duree S         durée Seedance, 4 à 12 s (défaut 4)
  --resolution R    480p, 720p ou 1080p (défaut 720p)
  --video F         n'appelle pas Seedance : repart d'une vidéo déjà générée (réglage du détourage, gratuit)
  --similarite X    chromakey : similarité (défaut 0.24)
  --melange X       chromakey : fondu du bord (défaut 0.06)
  --despill-mix X   despill : mix (défaut 1)
  --despill-expand X despill : expand (défaut 0.3)
  --erosion N       ronge N px du masque (0 à 3, défaut 2) contre un liseré persistant
  --sortie D        dossier de sortie (défaut /tmp/mascottes/sortie)
  --oui             ne demande pas de confirmation avant de payer
FIN
}

ESPECE="" POSE="" NOM="" PROMPT="" BOUCLE=0 FONDU=0.5 TAILLE=540 DUREE=4 RESOLUTION=720p
VIDEO="" SIM=0.24 MELANGE=0.06 DMIX=1 DEXPAND=0.3 EROSION=2 SORTIE=/tmp/mascottes/sortie OUI=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --espece) ESPECE="$2"; shift 2 ;;
    --pose) POSE="$2"; shift 2 ;;
    --nom) NOM="$2"; shift 2 ;;
    --prompt) PROMPT="$2"; shift 2 ;;
    --boucle) BOUCLE=1; shift ;;
    --fondu) FONDU="$2"; shift 2 ;;
    --taille) TAILLE="$2"; shift 2 ;;
    --duree) DUREE="$2"; shift 2 ;;
    --resolution) RESOLUTION="$2"; shift 2 ;;
    --video) VIDEO="$2"; shift 2 ;;
    --similarite) SIM="$2"; shift 2 ;;
    --melange) MELANGE="$2"; shift 2 ;;
    --despill-mix) DMIX="$2"; shift 2 ;;
    --despill-expand) DEXPAND="$2"; shift 2 ;;
    --erosion) EROSION="$2"; shift 2 ;;
    --sortie) SORTIE="$2"; shift 2 ;;
    --oui) OUI=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Option inconnue : $1" >&2; usage >&2; exit 2 ;;
  esac
done
[[ -n "$ESPECE" && -n "$POSE" && -n "$NOM" ]] || { usage >&2; exit 2; }
[[ -n "$VIDEO" || -n "$PROMPT" ]] || { echo "Il faut --prompt (ou --video pour repartir d'une vidéo)." >&2; exit 2; }
(( TAILLE % 2 == 0 )) || { echo "--taille doit être pair." >&2; exit 2; }

# Fond de chaque espèce : une couleur loin de sa teinte, et la teinte de sa
# fourrure (sert de couleur « sous » les zones transparentes de la moitié
# couleur, pour qu'un bord semi-transparent ne tire jamais vers le fond).
case "$ESPECE" in
  nino)   FOND=0x0047FF; DESPILL=blue;  FOURRURE=0xC8C520 ;;  # vert anis → bleu
  gaston) FOND=0x0047FF; DESPILL=blue;  FOURRURE=0xF87F15 ;;  # orange → bleu
  suzie)  FOND=0x00B140; DESPILL=green; FOURRURE=0xF88EAD ;;  # rose → vert
  pia)    FOND=0x00B140; DESPILL=green; FOURRURE=0xAF49CF ;;  # violet → vert
  *) echo "Espèce inconnue : $ESPECE" >&2; exit 2 ;;
esac
SRC_POSE="$POSES/${ESPECE}_corps_${POSE}.webp"
[[ -f "$SRC_POSE" ]] || { echo "Pose introuvable : $SRC_POSE" >&2; exit 2; }

ID="${ESPECE}_${NOM}"
DOSSIER="$SORTIE/$ID"
TRAVAIL="$DOSSIER/travail"
mkdir -p "$TRAVAIL"
JOURNAL="$DOSSIER/journal.txt"
note() { echo "$*" | tee -a "$JOURNAL"; }
ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }
note "== $ID ($(date -u +%FT%TZ)) pose=$POSE fond=$FOND boucle=$BOUCLE taille=$TAILLE"

# ---------------------------------------------------------------------------
# 1. Génération (ou reprise d'une vidéo existante)
# ---------------------------------------------------------------------------
SOURCE="$DOSSIER/source.mp4"
if [[ -n "$VIDEO" ]]; then
  [[ "$(realpath "$VIDEO")" == "$(realpath -m "$SOURCE")" ]] || cp "$VIDEO" "$SOURCE"
  note "Vidéo reprise : $VIDEO (aucun appel payant)"
else
  # Pose 900×1000 au centre d'un carré 1200×1200 : 100 px au-dessus, 140 px
  # sous les pieds, 150 px de chaque côté, pour que les rebonds restent dans le cadre.
  ff -i "$SRC_POSE" -filter_complex "color=$FOND:s=1200x1200[f];[f][0]overlay=150:100:format=auto,format=rgb24" \
     -frames:v 1 "$TRAVAIL/depart.png"
  case "$RESOLUTION" in 480p) TARIF=18000 ;; 720p) TARIF=36000 ;; 1080p) TARIF=72000 ;; *) echo "Résolution inconnue" >&2; exit 2 ;; esac
  PRIX_MICRO=$(( TARIF * DUREE ))
  PRIX=$(awk "BEGIN { printf \"%.3f\", $PRIX_MICRO / 1e6 }")
  note "Prix attendu : $PRIX \$ (Seedance 1 lite, $RESOLUTION, $DUREE s ; Masko : $(awk "BEGIN { printf \"%.2f\", 0.25 * $DUREE }") \$)"
  if [[ $OUI -eq 0 ]]; then
    read -r -p "Lancer la génération ? [o/N] " r
    [[ "$r" == o || "$r" == O ]] || { echo "Abandon."; exit 1; }
  fi
  URL_IMAGE="$(treg host "$TRAVAIL/depart.png" | tail -n 1)"
  [[ "$URL_IMAGE" == https://* ]] || { echo "treg host n'a pas rendu d'URL : $URL_IMAGE" >&2; exit 1; }
  note "Image hébergée : $URL_IMAGE"
  # Seedance a tendance à « gonfler » le personnage en mouvement (ventre +10 à
  # +30 %) : caméra verrouillée et consigne de silhouette ajoutée à chaque prompt.
  # (last_frame_image n'est pas accepté par Seedance lite : erreur flf2v.)
  node -e '
    const [image, prompt, duration, resolution] = process.argv.slice(1);
    const garde = " Its body keeps exactly the same size, shape and proportions as in the first frame the whole time: it never gets bigger, wider, fatter or rounder, no squash and stretch, no zoom.";
    const input = { image, prompt: prompt + garde, duration: Number(duration), resolution, aspect_ratio: "1:1", camera_fixed: true };
    process.stdout.write(JSON.stringify({ input }));
  ' "$URL_IMAGE" "$PROMPT" "$DUREE" "$RESOLUTION" > "$TRAVAIL/corps.json"
  note "Prompt : $PROMPT"
  SOLDE_AVANT="$(treg balance 2>/dev/null | sed -n 's/.*(\([0-9]*\) micro-USD).*/\1/p' | head -n 1)"
  set +e
  treg call replicate.video-gen.seedance-1-lite --method POST --data @"$TRAVAIL/corps.json" \
    --await --timeout 560 > "$TRAVAIL/reponse.txt" 2> "$TRAVAIL/reponse.err"
  CODE=$?
  set -e
  cat "$TRAVAIL/reponse.err" >> "$JOURNAL"
  [[ $CODE -eq 0 ]] || { echo "Échec de treg (code $CODE) :" >&2; cat "$TRAVAIL/reponse.txt" "$TRAVAIL/reponse.err" >&2; exit 1; }
  # Coût réel : en-tête X-Treg-Cost-Micro ou ligne « charged » de la CLI, sinon écart de solde.
  COUT_LIGNE="$(grep -h -i -E 'x-treg-cost-micro|charged|reservation' "$TRAVAIL/reponse.err" "$TRAVAIL/reponse.txt" | head -n 3 || true)"
  sleep 2
  SOLDE_APRES="$(treg balance 2>/dev/null | sed -n 's/.*(\([0-9]*\) micro-USD).*/\1/p' | head -n 1)"
  [[ -n "$COUT_LIGNE" ]] && note "Coût annoncé par treg : $COUT_LIGNE"
  if [[ -n "$SOLDE_AVANT" && -n "$SOLDE_APRES" ]]; then
    note "Coût réel (écart de solde) : $(awk "BEGIN { printf \"%.4f\", ($SOLDE_AVANT - $SOLDE_APRES) / 1e6 }") \$"
  fi
  URL_VIDEO="$(grep -o -E 'https://[^"[:space:]]+\.mp4' "$TRAVAIL/reponse.txt" | head -n 1 || true)"
  [[ -n "$URL_VIDEO" ]] || { echo "Pas d'URL de vidéo dans la réponse :" >&2; cat "$TRAVAIL/reponse.txt" >&2; exit 1; }
  note "Vidéo générée : $URL_VIDEO"
  curl -sSfL "$URL_VIDEO" -o "$SOURCE"
fi
INFO="$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=width,height,r_frame_rate,nb_read_frames -of csv=p=0 "$SOURCE")"
note "Source : $INFO (largeur,hauteur,cadence,images)"
CADENCE="$(cut -d, -f3 <<<"$INFO")"
IMAGES="$(cut -d, -f4 <<<"$INFO")"
LONGUEUR="$(awk -F/ "BEGIN { split(\"$CADENCE\", c, \"/\"); printf \"%.4f\", $IMAGES * c[2] / c[1] }")"

# ---------------------------------------------------------------------------
# 2. Boucle : la fin se fond dans le début (avant détourage, en RVB)
# ---------------------------------------------------------------------------
ecart() { # SSIM entre la dernière et la première image (le raccord de la boucle), et
  # pour comparer, le SSIM moyen entre deux images voisines (1 = identiques)
  local n raccord voisines
  n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$1")
  raccord=$(ffmpeg -hide_banner -i "$1" -i "$1" -filter_complex \
    "[0]select='eq(n\,$((n - 1)))'[a];[1]select='eq(n\,0)'[b];[a][b]ssim" -f null - 2>&1 \
    | sed -n 's/.*All:\([0-9.]*\).*/\1/p')
  voisines=$(ffmpeg -hide_banner -i "$1" -i "$1" -filter_complex \
    "[1]trim=start_frame=1,setpts=PTS-STARTPTS[b];[0][b]ssim=stats_file=-" -f null - 2>/dev/null \
    | awk '{ for (i = 1; i <= NF; i++) if ($i ~ /^All:/) { split($i, a, ":"); s += a[2]; k++ } } END { printf "%.3f", s / k }')
  echo "raccord $raccord (images voisines : $voisines en moyenne)"
}
A_DETOURER="$SOURCE"
note "Écart début/fin de la source : SSIM $(ecart "$SOURCE")"
if [[ $BOUCLE -eq 1 ]]; then
  # A = [0, F], B = [F, fin] ; B se fond dans A sur F secondes : la vidéo
  # commence à l'image F et finit sur l'image F-1, donc la boucle est continue.
  RESTE="$(awk "BEGIN { printf \"%.4f\", $LONGUEUR - $FONDU }")"
  DECALAGE="$(awk "BEGIN { printf \"%.4f\", $LONGUEUR - 2 * $FONDU }")"
  ff -i "$SOURCE" -filter_complex \
    "[0]split[x][y];[x]trim=0:$FONDU,setpts=PTS-STARTPTS[a];[y]trim=$FONDU,setpts=PTS-STARTPTS[b];[b][a]xfade=transition=fade:duration=$FONDU:offset=$DECALAGE,format=yuv420p" \
    -c:v libx264 -crf 12 -preset slow "$TRAVAIL/boucle.mp4"
  A_DETOURER="$TRAVAIL/boucle.mp4"
  note "Boucle : fondu de $FONDU s, durée $RESTE s ; écart début/fin après fondu : SSIM $(ecart "$A_DETOURER")"
fi

# ---------------------------------------------------------------------------
# 3. Détourage, puis réduction
# ---------------------------------------------------------------------------
EROSION_F=""
for ((i = 0; i < EROSION; i++)); do EROSION_F+=",erosion"; done
# Le masque est rongé à part (alphaextract → erosion → alphamerge) pour ne pas toucher la couleur.
CLE="format=yuv444p,chromakey=$FOND:$SIM:$MELANGE,despill=type=$DESPILL:mix=$DMIX:expand=$DEXPAND,format=rgba"
if [[ $EROSION -gt 0 ]]; then
  CLE="$CLE,split[c][m];[m]alphaextract$EROSION_F[mm];[c][mm]alphamerge"
fi
# Intermédiaire sans perte, en taille d'origine (pour le zoom) puis réduit.
ff -i "$A_DETOURER" -filter_complex "[0]$CLE,format=rgba[v]" -map "[v]" -c:v ffv1 -pix_fmt rgba "$TRAVAIL/detoure_grand.mkv"
ff -i "$TRAVAIL/detoure_grand.mkv" -vf "scale=$TAILLE:$TAILLE:flags=lanczos,format=rgba" -c:v ffv1 -pix_fmt rgba "$TRAVAIL/detoure.mkv"

# ---------------------------------------------------------------------------
# 4. Fichiers livrés
# ---------------------------------------------------------------------------
# (a) Empilé, au format du lecteur Masko (spec/player.md, « The file and the
# size ») : couleur en haut, transparence en bas (luminance : blanc = opaque),
# même largeur, hauteur double ; YUV 4:2:0 BT.709 plage limitée ; couleur NON
# prémultipliée (le shader multiplie) ; MP4 sans son, faststart.
COULEURS="-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"
EMPILE="[0]split=3[c][m][f];[f]format=rgb24,drawbox=c=$FOURRURE:t=fill[fond];[fond][c]overlay=format=auto[cc];[m]alphaextract[aa];[cc][aa]vstack,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
# shellcheck disable=SC2086
ff -i "$TRAVAIL/detoure.mkv" -filter_complex "$EMPILE" -an -c:v libx264 -profile:v high -preset veryslow -crf 20 -g 48 \
   $COULEURS -movflags +faststart "$DOSSIER/$ID.stacked.mp4"
# shellcheck disable=SC2086
ff -i "$TRAVAIL/detoure.mkv" -filter_complex "$EMPILE" -an -c:v libaom-av1 -cpu-used 6 -crf 32 -b:v 0 -g 48 \
   $COULEURS -movflags +faststart "$DOSSIER/$ID.av1.mp4"
# (b) WebM VP9 avec alpha, pour le web (Chrome, Firefox, Edge).
ff -i "$TRAVAIL/detoure.mkv" -an -c:v libvpx-vp9 -pix_fmt yuva420p -crf 32 -b:v 0 -auto-alt-ref 0 -row-mt 1 \
   -metadata:s:v:0 alpha_mode=1 "$DOSSIER/$ID.webm"
# (c) Affiche : la première image, en PNG transparent.
ff -i "$TRAVAIL/detoure.mkv" -frames:v 1 "$DOSSIER/$ID.png"

# (d) Planche de contrôle : 5 images, sur fond sombre (haut) et clair (bas).
N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$TRAVAIL/detoure.mkv")
CHOIX="eq(n\,0)+eq(n\,$((N / 4)))+eq(n\,$((N / 2)))+eq(n\,$((3 * N / 4)))+eq(n\,$((N - 1)))"
ff -i "$TRAVAIL/detoure.mkv" -vf "select='$CHOIX',scale=360:360" -fps_mode passthrough "$TRAVAIL/planche_%d.png"
FILTRE="" ENTREES=()
for i in 1 2 3 4 5; do ENTREES+=(-i "$TRAVAIL/planche_$i.png"); done
for i in 0 1 2 3 4; do
  FILTRE+="[$i]split[s$i][c$i];color=0x1E1E24:s=360x360[fs$i];[fs$i][s$i]overlay=format=auto[S$i];"
  FILTRE+="color=0xF4F1EA:s=360x360[fc$i];[fc$i][c$i]overlay=format=auto[C$i];"
done
FILTRE+="[S0][S1][S2][S3][S4]hstack=5[haut];[C0][C1][C2][C3][C4]hstack=5[bas];[haut][bas]vstack"
ff "${ENTREES[@]}" -filter_complex "$FILTRE" -frames:v 1 "$DOSSIER/${ID}_planche.png"

# Zoom 1:1 sur l'image du milieu, en taille d'origine : la houppette (haut du
# personnage) et le flanc gauche, sur blanc et sur noir — là où un liseré se voit.
ff -i "$TRAVAIL/detoure_grand.mkv" -vf "select='eq(n\,$((N / 2)))'" -fps_mode passthrough -frames:v 1 "$TRAVAIL/milieu.png"
read -r X0 Y0 X1 Y1 < <(python3 -I -c '
import sys
from PIL import Image
a = Image.open(sys.argv[1]).getchannel("A").point(lambda v: 255 if v > 128 else 0)
print(*a.getbbox())' "$TRAVAIL/milieu.png")
C=360
HX=$(( (X0 + X1) / 2 - C / 2 )); HY=$(( Y0 > 20 ? Y0 - 20 : 0 ))
FX=$(( X0 > 40 ? X0 - 40 : 0 )); FY=$(( (Y0 + Y1) / 2 - C / 2 ))
ff -i "$TRAVAIL/milieu.png" -filter_complex \
  "[0]split=2[h][f];[h]crop=$C:$C:$HX:$HY,split[h1][h2];[f]crop=$C:$C:$FX:$FY,split[f1][f2];\
color=white:s=${C}x$C[b1];[b1][h1]overlay=format=auto[H1];color=black:s=${C}x$C[n1];[n1][h2]overlay=format=auto[H2];\
color=white:s=${C}x$C[b2];[b2][f1]overlay=format=auto[F1];color=black:s=${C}x$C[n2];[n2][f2]overlay=format=auto[F2];\
[H1][H2][F1][F2]hstack=4" -frames:v 1 "$DOSSIER/${ID}_zoom.png"

note "Fichiers :"
for f in "$DOSSIER/$ID".stacked.mp4 "$DOSSIER/$ID".av1.mp4 "$DOSSIER/$ID".webm "$DOSSIER/$ID".png \
         "$DOSSIER/${ID}_planche.png" "$DOSSIER/${ID}_zoom.png"; do
  note "  $(du -h "$f" | cut -f1)	$f"
done
note "Réglages : chromakey=$FOND:$SIM:$MELANGE despill=$DESPILL:mix=$DMIX:expand=$DEXPAND erosion=$EROSION"
rm -f "$TRAVAIL"/*.mkv "$TRAVAIL"/planche_*.png
