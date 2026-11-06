# Langage visuel Blowy — relevé V4 (repris à l'identique par la V5)

Source : `design/v4-reference/project/*.dc.html` (52 maquettes, CSS relevé automatiquement : règles
de `<style>`, styles en ligne, `@keyframes`), rendus `design/v4-reference/renders/*.png`
(390×844 @2x). `design/v5/project` est vide à la date du relevé (2026-11-06) : rien de propre à la V5.

Chaque valeur existe dans `@blowy/design-tokens` (nom entre crochets) et est appliquée par
`@blowy/ui-mobile`. Colonne RN = ce qu'écrit le composant (aucune valeur en dur dans les écrans).

## 1. Cadre d'écran

| Élément | CSS source | React Native |
|---|---|---|
| Écran | `width:390px;height:844px;box-sizing:border-box;background:#FFF7EC;display:flex;flex-direction:column;overflow:hidden;padding:56px 22px 26px;position:relative` | `<ScreenTemplate>` : `flex:1`, `backgroundColor: color.cream`, `overflow:'hidden'`, marges `screenPadding(insets)` [`layout.padTop/padX/padBottom`] |
| Zones sûres | maquette = iPhone 47/34 pt | haut `max(56, inset+9)`, bas `max(26, inset−8)` (390×844 → 56/26 exacts ; îlot 59 → 68) |
| Corps | `body{font-family:'Inter';color:#16110D}` | `bodyFont()` + `color.ink` |
| Liens | `a{color:inherit;text-decoration:none}` | aucun soulignement (variante `ghost`/`link`) |
| Réserve barre d'onglets | `flex:0 0 96px;margin-top:auto` | `TAB_BAR_SPACE` [`layout.navReserve`] |

## 2. Couleurs (valeurs exactes, fréquence d'usage dans les 52 maquettes)

| Jeton | Hex | Usage relevé |
|---|---|---|
| `cream` | `#FFF7EC` | fond d'écran (×34) |
| `ink` | `#16110D` | texte, `.b2`, `.cap`, tampon « PET. », ombre `.bl` (×320) |
| `white` | `#FFFFFF` | cartes, puces, texte sur foncé (×323) |
| `lime` | `#C8F542` | onglet actif, `.bl`, tampon, anneaux `pulse` (×147) |
| `coral` | `#FF5A3C` | `.b1`, point du logo, « RENCONTRE », ombre « PET. » (×82) |
| `coralShadow` | `#C4341B` | ombre `.b1` (×43) |
| `creamShadow` | `#EEDFCB` | ombre `.card` 4 px / `.back` 3 px (×78) |
| `creamShadowAlt` | `#E8D9C4` | ombre `.b3` |
| `creamDeep` | `#F4EADC` | séparateurs `.row`, piste de jauge `.g` |
| `pink` / `pinkShadow` | `#FF3D7F` / `#B81F55` | badges `.bdg`, halos, dégradés |
| `violet` / `violetDeep` / `violetShadow` | `#7C3AED` / `#4C1D95` / `#2E1065` | « PLUS », dégradés nuit |
| `mango` | `#FFB347` | halo haut-droit Welcome, pièces |
| `sun` / `sunShadow` / `sunLight` | `#FFE36E` / `#C97A12` / `#FFF1C9` | pastilles « attente » |
| `limeShadow` | `#7DA11A` | ombre des surfaces lime |
| `muted` | `#8A7E70` | `.lbl`, « pets & potes » |
| `sig` | `#6B6259` | `.sig`, textes tertiaires |
| `inkSoft` | `#5A5047` | texte secondaire |
| `navInk` | `#5E544A` | onglets inactifs |
| `online` | `#2EAD6A` | pastille « en ligne » + anneau `pulse` |
| `cyan` / `cyanLight` / `cyanDeep` | `#22D3EE` / `#DDF8FC` / `#0E7490` | pastille « jamais vu » |
| `lilac`, `rose`, `night` | `#A78BFA`, `#FF7A9C`, `#2E1B3D` | dégradés de cartes (`linear-gradient(145deg,#A78BFA,#FF7A9C)`, `160deg,#16110D,#2E1B3D`) |

Translucides [`alpha`] : orbite `rgba(22,17,13,.15)`, ombre de puce `rgba(0,0,0,.07)` (`.08`
renforcée), anneau badge `rgba(255,255,255,.9)`, verre `rgba(255,255,255,.66→.34)`, bord verre
`.8`, ombres de barre `rgba(22,17,13,.24)` / `.08`, onglet actif `rgba(214,250,110,.95→200,245,66,.85)`
+ lueur `rgba(125,161,26,.35)`.

**Accessibilité** : toutes les paires texte/fond utilisées passent (tests `contrast.test.ts`), sauf
**corail sur crème = 2,92:1** (« RENCONTRE », display 56 px) : < 3:1 « grand texte ». Écart de la
maquette documenté et figé par test (≥ 2,9) ; à arbitrer en V5 (`#F0502F` donnerait 3,35:1).

## 3. Typographie

Google Fonts des maquettes : `Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,500..800` et
`Inter:wght@400;500;600;700` (même binaire que `@fontsource-variable`, vérifié : v1.001 / v4.001).

| Style | CSS source | RN (`foundations/typography.ts`) |
|---|---|---|
| `.d` | `font-family:'Bricolage Grotesque';font-weight:800;font-stretch:85%;letter-spacing:-.03em;line-height:.95` + opsz auto = taille | `<DisplayText size>` → `displayFont(size)` : famille `BricolageGrotesque-D<size>` (wdth 85, wght 800, **opsz = size**), `letterSpacing = −0,03·size`, `lineHeight = 0,95·size` (non arrondi). Variantes relevées : interligne .9/.92/1 (`lineHeight` prop) |
| `.logo` | idem `.d`, `letter-spacing:-.04em;line-height:.9` | `<DisplayText letterSpacingEm={-0.04} lineHeight={0.9}>` |
| Tailles `.d` relevées | 13 15 16 17 18 19 20 22 24 25 26 28 29 30 32 34 36 38 40 44 46 48 50 52 54 56 64 120 | une instance par taille [`opticalSizes.display`] ; 25 → 24/26, 120 → opsz 96 (borne de l'axe, identique au navigateur) |
| `.btn` | Bricolage 800, **largeur 100 %**, 18 px, `uppercase`, `.01em` | `strongFont(18)` → `BricolageGrotesque-B18` ; variantes 15/16/17/19 (`.act`, `.seg`, `.mini`, `.lg`) [`opticalSizes.strong`] |
| `.lbl` | 11 px, **800**, `.14em`, capitales (`#8A7E70` quand précisé) | `<Label>` : Inter **700** (800 non chargé → rendu 700 par le navigateur), 1,54 px |
| tagline | 11 px 800 `.12em` capitales `#8A7E70` | `<Label variant="tagline">` |
| `.chip` | 12 px 700 (Welcome/Craft) ; 11 px 800 (majorité) ; 10,5 px (Chat) | `<Chip size="md">` 12/700, `size="sm"` 11/700 |
| `.cap` | 13 px 600 | `<Caption>` Inter-600 |
| `.bl` (Welcome) | Inter 13 px 700, hérite `.01em` | `<Button variant="link">` |
| `.ghost` | Inter 14 px 700 | `<Button variant="ghost">` |
| `.gnav a` | 9,5 px 800 `.05em` capitales | TabBar : Inter-700 9,5 px 0,475 |
| Corps | 14 px 600, 13,5 px 600 lh 1,4 (bulles) | `bodyFont(size, weight)` ; `lineHeight` absent = `normal` CSS |

Interlignes : sans `line-height` explicite les maquettes utilisent `normal` (métriques de la
police) ; `bodyFont` n'impose pas d'interligne pour reproduire ce comportement.

### Polices chargées par l'app

`apps/mobile/scripts/fonts/build-fonts.py` (fonttools) fige 40 instances statiques (1,8 Mio) dans
`apps/mobile/assets/fonts/` (+ licences OFL) et génère `src/core/fonts/font-files.generated.ts`,
chargé par `useFonts` dans `app/_layout.tsx`. Pourquoi des instances statiques : React Native natif
ne règle pas les axes d'une police variable (ni `font-stretch`, ni opsz) ; une famille = une
instance, sans `fontWeight` (aucun gras synthétique). Mesures (Chrome, `.local/ui-fondation/fonttest.mjs`) :

| Texte | Maquette (variable) | Instance générée |
|---|---|---|
| Inter 600 13 px « Ton pet se fait… » | 303 px | **303 px** (311 px si la table `prep` est retirée au sous-ensemble) |
| Bricolage `.d` 29 px « DE NOUVELLES PERSONNES. » | 314 px | **314 px** (321 px sans `prep`) |

La largeur 85 % (« condensée ») explique l'écart systémique relevé par le banc QA : l'ancienne
police `@expo-google-fonts` (largeur 100 %, opsz 14) élargissait tous les titres. Aucun repli
système : le banc liste les faces `loaded` (D29, D32, D56, B18, Inter-600, Inter-700 sur Welcome).

## 4. Rayons, espacements, ombres « 3D »

| Élément | CSS | Jeton / RN |
|---|---|---|
| `.btn` | `min-height:56px;padding:0 20px;border-radius:18px;gap:10px` (variantes 52/16, 54/18) | `resolveButton` |
| `.b1` | `background:#FF5A3C;box-shadow:0 5px 0 #C4341B` | `shadow3d.b1` |
| `.b2` | `#16110D` / `0 5px 0 #000` | `shadow3d.b2` |
| `.b3` | `#fff` / `0 5px 0 #E8D9C4` | `shadow3d.b3` |
| `.bl` (V3/V4 sauf Welcome) | `#C8F542` / `0 5px 0 #16110D` | `variant="lime"` |
| Appui | `.btn:active{transform:translateY(4px);box-shadow:none}` ; `.row/.act/.opt:active` 3 px | `pressable3DStyle(…, pressed)` [`press.depth`=4, `depthSmall`=3] |
| `.card` | `background:#fff;border-radius:22px;box-shadow:0 4px 0 #EEDFCB` (20 px sur Profil) | `<Card>` |
| `.grp` | rayon 20, ombre 4 px `#EEDFCB`, `overflow:hidden` ; `.row` `border-top:1px solid #F4EADC`, min 46–50, marges 0 14 | `<Card variant="group">` |
| `.back` | 44×44, rayon 14, blanc, `0 3px 0 #EEDFCB` (variante 40/12 transparente) | `shadow3d.cardSm` |
| `.chip` | `inline-flex;gap:6px;border-radius:999px;padding:6px 12px` (ou 5/10) ; blanche : `0 2px 0 rgba(0,0,0,.07)` | `chipStyle` |
| `.cap` | `background:#16110D;border-radius:12px;padding:9px 13px` | `captionBox` |
| Tampon « PET. » | `display:inline-block;background:#16110D;color:#fff;border-radius:16px;padding:0 12px 6px;transform:rotate(-3deg);box-shadow:0 5px 0 #FF5A3C` | `<Stamp tone="ink">` |
| Tampon lime | `inline-flex;gap:8px;background:#C8F542;border-radius:14px;padding:2px 12px 6px;transform:rotate(-2deg);box-shadow:0 4px 0 #16110D` | `<Stamp tone="lime">` (voir note) |
| `.ico` | 30×30 rayon 10 | `radii.icon` |

Ombres RN : `boxShadow: [{ offsetX:0, offsetY, blurRadius:0, spreadDistance:0, color }]`
(RN ≥ 0.76, iOS/Android/web) ; l'ombre tourne avec la forme comme en CSS.

**Note tampon lime** : dans V4-Welcome l'élément porte `class="pop"` ET `transform:rotate(-2deg)` ;
l'animation (`fill-mode: both`, image finale `transform:none`) écrase la rotation : le rendu de
référence est **droit**. La reproduction suit le rendu (`rotate={0}`) ; le composant garde −2° par
défaut (intention). À trancher en V5.

**Note puce pulsée** : `.chip.pulse` a une ombre en ligne `0 2px 0 rgba(0,0,0,.07)` que
l'animation `pulse` (qui anime `box-shadow`) remplace : pas d'ombre portée, seulement l'anneau.
`<Chip pulse>` reproduit ce comportement.

## 5. Halos `.blob` (fonds dégradés)

CSS : `.blob{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none}` (60 et
80 px selon écran). Welcome : Ø300 `#FFB347` .8 (top −60, right −110, `.dr1`), Ø320 `#FF3D7F` .45
(top 360, left −150, `.dr2`), Ø280 `#C8F542` .55 (bottom −90, right −90, `.dr1`).

RN : `<Blob size color opacity blur top/left/right/bottom drift>`. Pas de filtre de flou portable
(iOS : aucun, Android ≥ 12 seulement) → profil EXACT d'un disque convolué par une gaussienne σ
(`I(r) = ∫ (ρ/σ²)·e^{−(r−ρ)²/2σ²}·I₀e(rρ/σ²) dρ`, `foundations/blur.ts`) dessiné en dégradé radial
SVG de 32 arrêts sur un rayon R + 3σ. Rendu identique iOS/Android/web, coût d'un SVG.

## 6. Barre d'onglets `.gnav`

`position:absolute;left:14px;right:14px;bottom:18px;display:grid;grid-template-columns:repeat(5,1fr);gap:2px;padding:6px;border-radius:34px;background:linear-gradient(180deg,rgba(255,255,255,.66),rgba(255,255,255,.34));backdrop-filter:blur(22px) saturate(190%);border:1px solid rgba(255,255,255,.8);box-shadow:inset 0 1px 1px rgba(255,255,255,.95),inset 0 -10px 18px rgba(255,255,255,.2),0 16px 36px rgba(22,17,13,.24),0 2px 6px rgba(22,17,13,.08)`
+ reflet `::before` (left/right 22, top 1, hauteur 44 %, `border-radius:30px 30px 60% 60%`, blanc .75→0).
Onglet : hauteur 54, rayon 28, icône 21 px trait 2,2, libellé 9,5 px ; actif : encre, dégradé lime
+ `inset 0 1px 1px` blanc .95, `inset 0 -2px 4px rgba(125,161,26,.25)`, `0 6px 14px rgba(125,161,26,.35)`,
**icône pleine** (trou de la carte en lime). Compteur `.bdg` : top 4, left 50 % + 6, min 16×16,
rose, 9 px, anneau `0 0 0 2px rgba(255,255,255,.9)` ; `.pls` « PLUS » : 50 % + 4, h 15, violet, 8 px `.04em`.
RN : `organisms/TabBar` (BlurView iOS/web, crème opaque si transparence réduite ou Android ;
dégradés et reflet en SVG ; `sheenPath` reproduit la réduction CSS des rayons).
Ancienne barre `.nav` (V3) : non retenue.

## 7. Animations (durées et courbes exactes) — `keyframes` des jetons

Moteur pur `foundations/keyframes.ts` (worklet) : courbe appliquée **par intervalle** entre images
clés (sémantique CSS/Web Animations), délai négatif, `reverse`, `fill-mode: both`. Horloge
`foundations/motion-clock.tsx` : `live` (Reanimated, `useFrameCallback`), `rest` (Réduire les
animations : fin des entrées, début des boucles, aucune boucle), `frozen` (`<MotionClockProvider
frozenAtMs>` : pose exacte à t, pour les captures).

| Nom | CSS source | Jeton |
|---|---|---|
| `pop` | `0%{translateY(18px) scale(.94);opacity:0} 60%{translateY(-3px) scale(1.02);opacity:1} 100%{none}` ; `.65s cubic-bezier(.2,1.2,.3,1) both` (0,45/0,5/0,55/0,6 s selon écrans) ; délais Welcome 0/.08/.16/.24/.36/.44/.52 s | `keyframes.pop`, `<PopIn delayMs durationMs>` |
| `sq` | `0,100%{translateY(0) scale(1,1)} 30%{translateY(-12px) scale(.96,1.05)} 52%{translateY(0) scale(1.05,.95)} 70%{translateY(-3px)}` ; `2.4s cubic-bezier(.3,0,.2,1) infinite`, origine 50 % 100 % ; délais Welcome 0/−.6/−1.2/−1.8 s (variantes 1,8/2/2,2/2,8 s, amplitudes 6/8/10 px en V3) | `keyframes.sq`, `<PetSprite motion="sq" delayMs durationMs>` |
| `drift` | `0,100%{translate(0,0) scale(1)} 50%{translate(24px,-30px) scale(1.15)}` ; `.dr1` 10 s ease-in-out ; `.dr2` 12 s, −5 s, `reverse` | `keyframes.drift`, `<Blob drift>` |
| `pulse` | `0,100%{box-shadow:0 0 0 0 rgba(46,173,106,.5)} 70%{0 0 0 7px rgba(…,0)}` ; 1,8 s (`ease`) ; variantes lime .7/10 px, corail .55/8 px | `keyframes.pulse`, `<Chip pulse>` (anneau extérieur seul) |
| `orbit` | `to{rotate(360deg)}` ; `.orb` 24 s linear ; `.cnt` même animation `reverse` (Éclosion : 14 s) | `keyframes.orbit`, `<OrbitRing>` |
| `peek` | `0,100%{translateY(0) rotate(-5deg)} 50%{translateY(-6px) rotate(5deg)}` ; 2,2 s ease-in-out (Révélation : −6/5°, −8 px, 2 s) | `keyframes.peek` |
| `beat` | `0,100%{scale(1)} 20%{scale(1.2)} 40%{scale(1)}` ; 1,4 s ease-in-out | `keyframes.beat` |
| `bounce` | `0%{scale(.5);opacity:0} 60%{scale(1.12);opacity:1} 100%{scale(1)}` ; .55 s `cubic-bezier(.2,1.4,.4,1)` | `keyframes.bounce` |
| `wob`, `bob` | rotation −8/7/−3° (2,2 s, origine 50 % 90 %) ; translateY −5 px (2 s) | `keyframes.wob/bob` |

Autres animations relevées (propres à un écran, à porter avec leur écran) : `ring`, `glow`,
`slam`, `tick`, `sway`, `fade`, `spin`, `shine`, `num`, `jump`, `burst`, `chk`, `radar`, `float`,
`sheet`, `msg`, `chipin`, `menu`, `dash`, `walk`, `fadein`, `fr`, `rise`, `crown`, `swap`,
`shake`, `hatch`, `grow`, `lock`, `bubble`, `hearts`, `sheen`, `flick`, `dots`, `unblur`,
`wobble`, `bump`, `beg`, `scan`, `cloud`, `gift`, `wave`, `flame`, `day`, `shield`, `ok`.
Courbes associées toutes dans `easing` (`pop`, `spring`, `slam`, `squash`, `grow`, `ease`…).

## 8. Composants (`packages/ui-mobile`)

| Niveau | Composant | Rôle |
|---|---|---|
| atoms | `DisplayText`, `Label`, `Caption`, `Stamp`, `Card`, `Blob`, `PopIn`, `Button` (b1/b2/b3/lime/link/ghost + anciens noms), `Chip` (dot, pulse, drop), `Badge` (count/plus), `Pressable3D`, `Icon` (`arrow`, `filled`) | résolveurs purs testés dans `atoms/styles.ts` |
| molecules | `PetSprite` (sq/peek/beat/pop/bounce/bob/wob, positionnement absolu), `OrbitRing` | |
| organisms | `TabBar` (`.gnav`) | |
| templates | `ScreenTemplate` (56/22/26, zones sûres, fond, calque de halos) | |

Avatars / visages masqués : les maquettes V4 n'en ont pas de générique (avatars = sprites de pets
dans des ronds `border-radius:50%`, ex. V4-Chats « Où est Nino », V4-Revelation flou `blur(8px)` →
`unblur`) ; à construire avec les écrans V5 sur `PetSprite` + `Card`.

## 9. Preuve pixel — V4-Welcome

Route interne `/(dev)/kitchen-sink` (servie seulement si `EXPO_PUBLIC_BLOWY_ENV=local`) :
reproduction de V4-Welcome **uniquement** avec les composants ci-dessus.

La référence `renders/V4-Welcome.png` a été capturée animations en cours. Instant retrouvé en
re-rendant la maquette avec toutes les animations figées à t (`.local/ui-fondation/render-mock.mjs`)
et en minimisant l'écart : **t = 2 550 ms** (0,76 % maquette-contre-elle-même, plancher dû au rendu
du texte pendant la capture d'origine ; 26 % à t = 0). La route accepte `?t=2550`.

`pnpm qa:visual -- --only V4-Welcome --route '/(dev)/kitchen-sink?t=2550'` (pixelmatch 0,1,
anticrénelage exclu, compteur masqué) : **1,01 %** des pixels (13 077 / 1 295 520), basse
résolution 1,10 %. Sans masque : 1,21 %. Contre la maquette re-rendue au même instant dans le même
Chrome : **0,17 %**. Avant ce travail : 48,3 % (écran Welcome produit).

Écarts restants (tous sous-pixel) : contours d'anticrénelage du texte (positions fractionnaires
légèrement différentes entre le DOM de la maquette et react-native-web), bords des puces en
rotation. Aucun écart de couleur, de police, de taille ou de position mesurable.
