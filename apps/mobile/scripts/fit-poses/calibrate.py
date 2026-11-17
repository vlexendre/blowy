"""Calibration de l'habillage par pose : écrit species.<s>.poses.<pose> dans packages/ui/src/assets/fit.json.

Chaîne complète (images du pack dans packages/ui/assets/pets/<espèce>_corps_<pose>.webp) :
  1. scale_audit.py + normalize.py <sortie> : échelle commune par espèce (depuis les découpes de $MASCOTS).
  2. register.py : recale chaque pose sur `neutre` par la silhouette du haut de la tête (échelle, rotation,
     translation) -> register.json (long : ~40 s par pose).
  3. calibrate.py [--write] : ancres de `debout` -> `neutre` (base.json), puis -> chaque pose (register.json),
     corrections relevées à l'œil sur les planches (fix.json : `head`/`face` en px, `scale`, `tilt`, `px` absolus),
     main libre détectée sur la silhouette, sol, inclinaison et taille de la tête.
  4. anchors_sheet.py : planche des ancres ; la planche de l'habillage se regarde dans l'app (/dev/fit).
Usage : python3 -I calibrate.py [--write]"""
import os, json, sys, numpy as np
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
from PIL import Image
K=os.path.dirname(os.path.abspath(__file__)) + '/'
FIT=os.path.join(ROOT, 'packages/ui/src/assets/fit.json')
A=os.path.join(ROOT, 'packages/ui/assets/pets/')
sys.path.insert(0,K)
from register import apply
P=['neutre','joie','triste','surpris','boude','dodo','mange','joue','marche','coucou','check','pense',
   'colere','malade','timide','fier','rit','danse','accueil','assis','baille','bain','applaudit','fete',
   'evo_sociable','evo_joueur','evo_casanier','evo_tendre','evo_piquant','bebe','oeuf','oeuf_fele','eclosion','fantome','danger']
# Œufs : pas de tête (ancres posées sur l'œuf, rien de porté).
EGG={'oeuf','oeuf_fele'}
# Emplacements cachés : la tenue sous le plaid, dans le bain ; le fantôme ne porte ni tenue ni objet au sol ; rien sur
# l'œuf ni pendant l'éclosion ; le bébé garde son couvre-chef (plus petit : la taille de sa tête) mais pas la tenue.
HIDE={'malade':['body'],'bain':['body','toy'],'fantome':['body','toy'],'eclosion':['head','face','body','toy'],'bebe':['body'],
      'oeuf':['head','face','body','toy'],'oeuf_fele':['head','face','body','toy']}
HEAD=['headTop','crown','brow','eyes','eyeL','eyeR','nose','lip','mouth','cheeks','neck','torso']
# Main libre et visible (côté de l'image) ; sinon l'objet de main se pose au sol.
HAND={'neutre':'R','triste':'R','surpris':'R','coucou':'R','check':'L','pense':'R','accueil':'R'}
# Profil : objets du visage masqués.
PROFILE={'marche'}
FACE={'eyes','eyeL','eyeR','nose','lip','mouth','cheeks'}
fit=json.load(open(FIT)); base=json.load(open(K+'base.json')); reg=json.load(open(K+'register.json'))
fix=json.load(open(K+'fix.json'))  # corrections à la main après lecture des planches
def img(s,p): return f'{A}{s}_{p}.webp' if p.startswith('evo_') else f'{A}{s}_corps_{p}.webp'
def alpha(s,p): return np.asarray(Image.open(img(s,p)))[...,3]>40
def hand(a, side):
    rows=range(520,830,4); best=None
    for y in rows:
        xs=np.where(a[y])[0]
        if not len(xs): continue
        x=xs.max() if side=='R' else xs.min()
        v=x if side=='R' else -x
        if best is None or v>best[0]: best=(v,x,y)
    _,x,y=best
    return [round((x+(-50 if side=='R' else 50))/900,4), round((y+25)/1000,4)]
def toy(a):
    ys=[y for y in range(860,950) if a[y].any()]
    if not ys: return [0.78,0.958]  # en l'air (fête) : à côté, au sol
    xr=max(np.where(a[y])[0].max() for y in ys)
    return [round(min(0.93,(xr-40)/900),4), 0.958]
out={}
def brow(s):
    """Front (couvre-chefs) mesuré sur la pose neutre : première ligne où la tête est d'un seul tenant (oreilles, cornes,
    antennes à part) et plus large que 62 % du corps. Renvoie ([x, y] en px, largeur de la tête en px)."""
    a=np.asarray(Image.open(f'{A}{s}_corps_neutre.webp'))[...,3]/255.0
    rows=(a>0.5).sum(1); mx=rows.max()
    def runs(r):
        m=(a[r]>0.5).astype(np.int8); return int((np.diff(np.concatenate([[0],m,[0]]))==1).sum())
    b=next(r for r in range(a.shape[0]) if rows[r]>mx*0.62 and runs(r)==1)
    cx=float((np.arange(a.shape[1])*(a[b]>0.5)).sum()/(a[b]>0.5).sum())
    return [cx,float(b)], float(rows[b])
def feet(a, top):
    for y in range(953, int(top), -1):
        m=a[y].astype(np.int8)
        if int((np.diff(np.concatenate([[0],m,[0]]))==1).sum())==1: return y
    return 900
def body_width(s):
    """Largeur du corps à la ligne du torse, sur la pose neutre (px)."""
    a=np.asarray(Image.open(f'{A}{s}_corps_neutre.webp'))[...,3]>128
    y=int(fit['species'][s]['poses']['neutre']['points']['torso'][1]*1000) if 'poses' in fit['species'][s] else 790
    xs=np.where(a[y])[0]; return float(xs.max()-xs.min())
def neutral(s):
    """Ancres de la pose neutre : celles de `debout` recalées, ou relevées à la main (fix.<s>.neutre.points, px)."""
    pts0=fit['species'][s]['points']; b=base[s]; f=fix.get(s,{}).get('neutre',{})
    res={'brow':brow(s)[0]}
    for k in HEAD:
        if k in res: continue
        if k in f.get('px',{}): res[k]=f['px'][k]; continue
        res[k]=apply(b,[pts0[k][0]*900,pts0[k][1]*1000])
    return res
for s in ['nino','suzie','gaston','pia']:
    b=base[s]; out[s]={}; N=neutral(s)
    for p in P:
        a=alpha(s,p)
        if p in EGG:
            # L'œuf : le neutre recalé sur le haut et la largeur de l'œuf (bulle, « z », mèche de série).
            ys,xs=np.where(a); na=alpha(s,'neutre'); nys,nxs=np.where(na)
            k=(xs.max()-xs.min())/(nxs.max()-nxs.min())
            t={'s':float(k),'rot':0.0,'ref_c':[float(nxs.mean()),float(nys.min())],'tgt_c':[float(xs.mean()),float(ys.min())]}
        else:
            t=reg[s][p]
        f=fix.get(s,{}).get(p,{})
        if 'reg' in f: t={**t,**f['reg']}
        if p=='neutre': t={**t,'s':1.0,'rot':0.0,'tgt_c':t['ref_c']}
        pts={}
        for k in HEAD:
            q=apply(t,N[k])
            hx,hy=f.get('head',[0,0]); fx,fy=f.get('face',[0,0]) if k in FACE else (0,0)
            pts[k]=[round((q[0]+hx+fx)/900,4),round((q[1]+hy+fy)/1000,4)]
        pts['ground']=[0.5,0.958]
        # Vêtements : haut de la tenue (bouche + 55 px) et ligne des pieds (première ligne d'un seul tenant en
        # remontant du sol), mesurés sur chaque pose.
        mouth_y=pts['mouth'][1]*1000
        pts['chest']=[pts['torso'][0],round((mouth_y+55)/1000,4)]
        pts['feet']=[pts['torso'][0],round(feet(a,mouth_y)/1000,4)]
        pts['toy']=toy(a)
        if p in HAND: pts['hand']=hand(a,HAND[p])
        for k,v in f.get('points',{}).items(): pts[k]=v
        out[s][p]=dict(points=pts, tilt=round(f.get('tilt',t['rot']),1), scale=round(b['s']*f.get('scale',t['s']),3), face=p not in PROFILE, **({'arms':f['arms']} if 'arms' in f else {}), **({'hide':HIDE[p]} if p in HIDE else {}))
json.dump(out,open(K+'poses.json','w'),indent=1)
if '--write' in sys.argv:
    for s in out:
        fit['species'][s]['poses']={p:{**v,'points':v['points']} for p,v in out[s].items()}
        # Mesure des couvre-chefs : largeur du front sur la pose neutre (ramenée à l'échelle de `debout`).
        fit['species'][s]['sizes']['brow']=round(brow(s)[1]/900/out[s]['neutre']['scale'],4)
        # Mesure des vêtements et des objets tenus : largeur du corps à la ligne du torse (pose neutre).
        fit['species'][s]['sizes']['bodyw']=round(body_width(s)/900/out[s]['neutre']['scale'],4)
        # Mesure des objets du visage : écart des yeux (Gaston, œil unique : ×1,6), exacte sur la pose neutre.
        fit['species'][s]['sizes']['face']=round(fit['species'][s]['sizes']['eyes']*(1.6 if s=='gaston' else 1)/out[s]['neutre']['scale'],4)
    raw=json.dumps(fit,indent=1,ensure_ascii=False)
    open(FIT,'w').write(raw+'\n'); print('fit.json écrit')
