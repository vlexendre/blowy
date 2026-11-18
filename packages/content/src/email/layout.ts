/**
 * Mise en page commune des e-mails de Minimoa : l'univers du site (nuit, panneaux de couleur, jaune d'accent, titres en
 * capitales) et un minimoa qui parle dans une bulle.
 *
 * Fait pour les clients de messagerie : tableaux, styles en ligne (le bloc <style> n'ajoute que des améliorations :
 * police Allo, marges sur petit écran), largeur 600 px au plus, bouton en cellule de tableau, texte d'aperçu caché,
 * images en 2x avec largeur, hauteur et texte alternatif, fonds de couleur sur les cellules (lisible images coupées),
 * thème sombre déclaré (`color-scheme`) pour que Apple Mail et Gmail n'inversent pas les couleurs, version texte
 * construite à partir des mêmes blocs.
 *
 * Tous les textes passés ici sont bruts : ils sont échappés au rendu.
 */
import type { Locale } from '@blowy/domain';
import { brand, labels } from '../labels';
import { EMAIL_ART, EMAIL_ASSETS_URL, EMAIL_COLORS as C, EMAIL_FACES, type EmailScene, emailArtUrl, panelOf } from './art';
import { emailChromeText } from './chrome';

export interface Email {
  subject: string;
  html: string;
  text: string;
}

/** Un bloc du corps : un paragraphe, ou un bloc mis en valeur. Les lignes « · … » consécutives forment une liste. */
export type EmailBlock =
  | string
  /** Citation (le motif d'un avertissement) : la même ligne dans la version texte. */
  | { kind: 'quote'; text: string }
  /** Tableau de faits (date, montant, chemin) : « libellé : valeur » dans la version texte. */
  | { kind: 'facts'; items: readonly { label: string; value: string }[] }
  /** Code mis en avant ; `text` est la phrase de la version texte (« Ton code : AB12CD »). */
  | { kind: 'code'; label: string; value: string; text: string };

export interface EmailLayout {
  title: string;
  paragraphs: readonly EmailBlock[];
  cta?: { label: string; url: string };
  /** Ligne discrète du pied (pourquoi cet e-mail, comment ne plus le recevoir). */
  footer?: string;
  /** Lien de désinscription, affiché après `footer`. */
  unsubscribe?: { label: string; url: string };
  /** Texte d'aperçu de la boîte de réception (caché dans l'e-mail). */
  preheader?: string;
  /** Petite étiquette au-dessus du titre. */
  eyebrow?: string;
  /** Le minimoa de l'image et ce qu'il dit. */
  scene?: EmailScene;
  bubble?: string;
}

const FONT = "'Allo',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const isBullet = (b: EmailBlock): b is string => typeof b === 'string' && b.startsWith('· ');

/** Paragraphes regroupés : les puces consécutives deviennent une liste. */
function group(blocks: readonly EmailBlock[]): (EmailBlock | { kind: 'list'; items: string[] })[] {
  const out: (EmailBlock | { kind: 'list'; items: string[] })[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (isBullet(b)) {
      const item = b.slice(2);
      if (last && typeof last === 'object' && last.kind === 'list') last.items.push(item);
      else out.push({ kind: 'list', items: [item] });
    } else out.push(b);
  }
  return out;
}

const P = `margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.55;color:${C.text}`;

function blockHtml(b: EmailBlock | { kind: 'list'; items: string[] }): string {
  if (typeof b === 'string') return `<p style="${P}">${escapeHtml(b)}</p>`;
  switch (b.kind) {
    case 'list':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">${b.items
        .map(
          (i) =>
            `<tr><td width="22" valign="top" style="padding:3px 0 8px;font-family:${FONT};font-size:16px;line-height:1.45;color:${C.accent}">&#9679;</td><td valign="top" style="padding:3px 0 8px;font-family:${FONT};font-size:16px;line-height:1.45;color:${C.text}">${escapeHtml(i)}</td></tr>`,
        )
        .join('')}</table>`;
    case 'quote':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px"><tr><td bgcolor="${C.card}" style="background-color:${C.card};border-left:4px solid ${C.accent};border-radius:6px 16px 16px 6px;padding:14px 18px;font-family:${FONT};font-size:16px;line-height:1.5;font-weight:700;color:${C.text}">${escapeHtml(b.text)}</td></tr></table>`;
    case 'facts':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="margin:4px 0 20px;background-color:${C.card};border-radius:18px">${b.items
        .map(
          (f, n) =>
            `<tr><td style="padding:14px 18px;${n > 0 ? `border-top:1px solid ${C.line};` : ''}font-family:${FONT}"><div style="font-size:12px;line-height:1.3;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${C.mute}">${escapeHtml(f.label)}</div><div style="padding-top:4px;font-size:18px;line-height:1.35;font-weight:800;color:${C.text}">${escapeHtml(f.value)}</div></td></tr>`,
        )
        .join('')}</table>`;
    case 'code':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px"><tr><td align="center" bgcolor="${C.night}" style="background-color:${C.night};border:2px dashed ${C.accent};border-radius:18px;padding:16px 12px;font-family:${FONT}"><div style="font-size:12px;line-height:1.3;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.mute}">${escapeHtml(b.label)}</div><div style="padding-top:6px;font-family:${FONT};font-size:32px;line-height:1.1;font-weight:800;letter-spacing:.18em;color:${C.accent}">${escapeHtml(b.value)}</div></td></tr></table>`;
  }
}

function blockText(b: EmailBlock, sep: string): string[] {
  if (typeof b === 'string') return [b];
  switch (b.kind) {
    case 'quote':
      return [b.text];
    case 'facts':
      return b.items.map((f) => `${f.label}${sep}${f.value}`);
    case 'code':
      return [b.text];
  }
}

/** Bouton « à l'épreuve des balles » : une cellule colorée (le dégradé protège la couleur de l'inversion de Gmail). */
const button = (label: string, url: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px"><tr><td align="center" bgcolor="${C.accent}" style="border-radius:999px;background-color:${C.accent};background-image:linear-gradient(${C.accentSoft},${C.accent})"><a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:16px 28px;border-radius:999px;font-family:${FONT};font-size:16px;line-height:1.2;font-weight:800;color:${C.ink};text-decoration:none">${escapeHtml(label)}&nbsp;&rarr;</a></td></tr></table>`;

/** Remplissage après le texte d'aperçu : la boîte de réception n'affiche pas le début du corps à la suite. */
const PREHEADER_FILL = '&#8199;&#65279;&#847; '.repeat(60);

/** Espaces insécables du français (avant « : ; ? ! » et dans les guillemets), pour la version HTML seulement. */
const frenchSpaces = (s: string): string => s.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

function withFrenchSpaces(l: EmailLayout): EmailLayout {
  const f = frenchSpaces;
  return {
    ...l,
    title: f(l.title),
    eyebrow: l.eyebrow && f(l.eyebrow),
    bubble: l.bubble && f(l.bubble),
    footer: l.footer && f(l.footer),
    preheader: l.preheader && f(l.preheader),
    cta: l.cta && { ...l.cta, label: f(l.cta.label) },
    unsubscribe: l.unsubscribe && { ...l.unsubscribe, label: f(l.unsubscribe.label) },
    paragraphs: l.paragraphs.map((b) =>
      typeof b === 'string'
        ? f(b)
        : b.kind === 'quote'
          ? { ...b, text: f(b.text) }
          : b.kind === 'facts'
            ? { ...b, items: b.items.map((i) => ({ label: f(i.label), value: f(i.value) })) }
            : { ...b, label: f(b.label) },
    ),
  };
}

export function renderEmail(locale: Locale, subject: string, source: EmailLayout): Email {
  const layout = locale === 'fr' ? withFrenchSpaces(source) : source;
  const t = emailChromeText.in(locale);
  const tagline = labels.in(locale).tagline;
  const sep = t.ctaSeparator;
  const art = layout.scene ? EMAIL_ART[layout.scene] : null;
  const panel = panelOf(art?.panel ?? 'night');
  const speaker = art ? (art.speaker === 'duo' ? t.speakers.duo : art.speaker === 'band' ? t.speakers.band : art.speaker) : null;
  const site = brand.site.replace(/^https?:\/\//, '');

  const eyebrow = layout.eyebrow
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px"><tr><td bgcolor="${C.ink}" style="background-color:${C.ink};border-radius:999px;padding:7px 13px;font-family:${FONT};font-size:11px;line-height:1.2;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.text}">${escapeHtml(layout.eyebrow)}</td></tr></table>`
    : '';
  const bubble =
    layout.bubble && speaker
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:420px"><tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-radius:22px;padding:14px 18px;font-family:${FONT};box-shadow:0 8px 20px rgba(0,0,0,.18)"><div style="font-size:11px;line-height:1.2;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#6B6585">${escapeHtml(speaker)}</div><div style="padding-top:4px;font-size:16px;line-height:1.4;font-weight:700;color:${C.ink}">${escapeHtml(layout.bubble)}</div></td></tr></table></td></tr><tr><td align="center" style="line-height:0;font-size:0"><div style="width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:12px solid #FFFFFF;margin:0 auto"></div></td></tr></table>`
      : '';
  const image =
    art && layout.scene
      ? `<img src="${emailArtUrl(layout.scene)}" width="${art.width}" height="${art.height}" alt="${escapeHtml(t.art[layout.scene])}" style="display:block;margin:${bubble ? 6 : 20}px auto 0;border:0;outline:none;text-decoration:none;width:100%;max-width:${art.width}px;height:auto;font-family:${FONT};font-size:14px;line-height:1.4;font-weight:700;color:${panel.fg};text-align:center">`
      : '';
  const hero = `<tr><td class="hero" bgcolor="${panel.solid}" style="background-color:${panel.solid};background-image:linear-gradient(180deg,${panel.from} 0%,${panel.to} 100%);border-radius:28px;padding:28px 28px ${art ? 0 : 28}px">
${eyebrow}<h1 class="title" style="margin:0;font-family:${FONT};font-size:34px;line-height:1.04;font-weight:800;letter-spacing:-.01em;text-transform:uppercase;color:${panel.fg}">${escapeHtml(layout.title)}</h1>
${bubble}${image}</td></tr>`;

  const body = group(layout.paragraphs).map(blockHtml).join('');
  const cta = layout.cta ? button(layout.cta.label, layout.cta.url) : '';
  const card = `<tr><td style="height:12px;line-height:12px;font-size:0">&nbsp;</td></tr>
<tr><td class="card" bgcolor="${C.panel}" style="background-color:${C.panel};border:1px solid ${C.line};border-radius:28px;padding:28px 28px ${cta ? 28 : 12}px">${body}${cta}</td></tr>`;

  const unsubscribe = layout.unsubscribe
    ? ` <a href="${escapeHtml(layout.unsubscribe.url)}" target="_blank" style="color:${C.text};text-decoration:underline">${escapeHtml(layout.unsubscribe.label)}</a>`
    : '';
  const small = `font-family:${FONT};font-size:12px;line-height:1.55;color:${C.mute}`;
  const footer = `<tr><td align="center" style="padding:28px 16px 0">
<img src="${emailArtUrl(EMAIL_FACES.file)}" width="${EMAIL_FACES.width}" height="${EMAIL_FACES.height}" alt="${escapeHtml(t.faces)}" style="display:block;margin:0 auto 14px;border:0;width:100%;max-width:${EMAIL_FACES.width}px;height:auto;${small}">
<p style="margin:0 0 12px;font-family:${FONT};font-size:14px;line-height:1.4;font-weight:800;color:${C.text}">${escapeHtml(tagline)}</p>
${layout.footer || unsubscribe ? `<p style="margin:0 0 12px;${small}">${layout.footer ? escapeHtml(layout.footer) : ''}${unsubscribe}</p>` : ''}
<p style="margin:0;${small}">${escapeHtml(t.contact)} <a href="mailto:${brand.supportEmail}" style="color:${C.text};text-decoration:underline">${brand.supportEmail}</a> · <a href="${brand.site}" target="_blank" style="color:${C.text};text-decoration:underline">${site}</a></p>
</td></tr>`;

  const html = `<!doctype html>
<html lang="${locale}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<style>
@font-face{font-family:'Allo';src:url('${EMAIL_ASSETS_URL}/allo.woff2') format('woff2');font-weight:400 800;font-style:normal}
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0!important;padding:0!important;width:100%!important;background-color:${C.night}}
a{color:inherit}
img{-ms-interpolation-mode:bicubic}
@media (max-width:480px){
.hero{padding-left:20px!important;padding-right:20px!important}
.card{padding-left:20px!important;padding-right:20px!important}
.title{font-size:29px!important}
.wrap{padding-left:10px!important;padding-right:10px!important}
}
@media (prefers-color-scheme:dark){
body,.bg{background-color:${C.night}!important}
}
</style>
</head>
<body class="bg" style="margin:0;padding:0;background-color:${C.night};-webkit-text-size-adjust:100%;text-size-adjust:100%">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.night}">${escapeHtml(layout.preheader ?? layout.title)}${PREHEADER_FILL}</div>
<table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.night}" style="background-color:${C.night}">
<tr><td class="wrap" align="center" style="padding:24px 16px 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
<tr><td style="padding:0 6px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${FONT};font-size:26px;line-height:1;font-weight:800;letter-spacing:-.04em;color:${C.text}"><a href="${brand.site}" target="_blank" style="color:${C.text};text-decoration:none">${escapeHtml(brand.name.toLowerCase())}<span style="color:${C.accent}">.</span></a></td>
<td align="right" style="font-family:${FONT};font-size:13px;line-height:1;font-weight:700;color:${C.mute}">${site}</td>
</tr></table>
</td></tr>
${hero}
${card}
${footer}
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    source.title,
    '',
    ...(source.bubble && speaker ? [`${speaker}${sep}${t.quote(source.bubble)}`, ''] : []),
    ...source.paragraphs.flatMap((b) => blockText(b, sep)),
    ...(source.cta ? ['', `${source.cta.label}${sep}${source.cta.url}`] : []),
    ...(source.footer ? ['', source.footer] : []),
    ...(source.unsubscribe ? [`${source.unsubscribe.label}${sep}${source.unsubscribe.url}`] : []),
    '',
    `${brand.name} — ${tagline}`,
    `${t.contact} ${brand.supportEmail} · ${site}`,
  ].join('\n');
  return { subject, html, text };
}
