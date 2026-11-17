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
P=['neutre','joie','triste','surpris','boude','dodo','mange','joue','marche','coucou','check','pense']
HEAD=['headTop','crown','eyes','eyeL','eyeR','nose','lip','mouth','cheeks','neck','torso']
# Main libre et visible (côté de l'image) ; sinon l'objet de main se pose au sol.
HAND={'neutre':'R','triste':'R','surpris':'R','coucou':'R','check':'L','pense':'R'}
# Profil : objets du visage masqués.
PROFILE={'marche'}
FACE={'eyes','eyeL','eyeR','nose','lip','mouth','cheeks'}
fit=json.load(open(FIT)); base=json.load(open(K+'base.json')); reg=json.load(open(K+'register.json'))
fix=json.load(open(K+'fix.json'))  # corrections à la main après lecture des planches
def alpha(s,p): return np.asarray(Image.open(f'{A}{s}_corps_{p}.webp'))[...,3]>40
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
    ys=range(860,950); xr=max(np.where(a[y])[0].max() for y in ys if a[y].any())
    return [round(min(0.93,(xr-40)/900),4), 0.958]
out={}
def neutral(s):
    """Ancres de la pose neutre : celles de `debout` recalées, ou relevées à la main (fix.<s>.neutre.points, px)."""
    pts0=fit['species'][s]['points']; b=base[s]; f=fix.get(s,{}).get('neutre',{})
    res={}
    for k in HEAD:
        if k in f.get('px',{}): res[k]=f['px'][k]; continue
        res[k]=apply(b,[pts0[k][0]*900,pts0[k][1]*1000])
    return res
for s in ['nino','suzie','gaston','pia']:
    b=base[s]; out[s]={}; N=neutral(s)
    for p in P:
        t=reg[s][p]; a=alpha(s,p)
        f=fix.get(s,{}).get(p,{})
        if 'reg' in f: t={**t,**f['reg']}
        if p=='neutre': t={**t,'s':1.0,'rot':0.0,'tgt_c':t['ref_c']}
        pts={}
        for k in HEAD:
            q=apply(t,N[k])
            hx,hy=f.get('head',[0,0]); fx,fy=f.get('face',[0,0]) if k in FACE else (0,0)
            pts[k]=[round((q[0]+hx+fx)/900,4),round((q[1]+hy+fy)/1000,4)]
        pts['ground']=[0.5,0.958]
        pts['toy']=toy(a)
        if p in HAND: pts['hand']=hand(a,HAND[p])
        for k,v in f.get('points',{}).items(): pts[k]=v
        out[s][p]=dict(points=pts, tilt=round(f.get('tilt',t['rot']),1), scale=round(b['s']*f.get('scale',t['s']),3), face=p not in PROFILE)
json.dump(out,open(K+'poses.json','w'),indent=1)
if '--write' in sys.argv:
    for s in out:
        fit['species'][s]['poses']={p:{**v,'points':v['points']} for p,v in out[s].items()}
    raw=json.dumps(fit,indent=1,ensure_ascii=False)
    open(FIT,'w').write(raw+'\n'); print('fit.json écrit')
