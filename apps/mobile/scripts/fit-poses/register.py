"""Recale chaque pose corps sur la pose de référence (neutre) par la silhouette du haut de la tête.
Sortie : transformations (échelle, rotation, translation) en px de la toile 900x1000."""
import os, numpy as np, cv2, json, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
from PIL import Image
A=os.path.join(ROOT, 'packages/ui/assets/pets/')
P=['neutre','joie','triste','surpris','boude','dodo','mange','joue','marche','coucou','check','pense',
   'colere','malade','timide','fier','rit','danse','accueil','assis','baille','bain','applaudit','fete',
   'evo_sociable','evo_joueur','evo_casanier','evo_tendre','evo_piquant','bebe','eclosion','fantome','danger']
# Tête bien plus petite (bébé) ou en partie cachée (éclosion) : recherche plus large. Les œufs n'ont pas de tête.
SCALES={'bebe':np.arange(0.45,0.95,0.03),'eclosion':np.arange(0.6,1.12,0.03)}
D=3  # réduction pour la recherche
def load(path):
    im=np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    a=im[...,3]/255; g=(im[...,:3].mean(-1)/255)*a
    return a,g
def feat(a,g):
    return np.dstack([a, g*0.6]).astype(np.float32)
def head_template(a,g,frac):
    ys,xs=np.where(a>0.5); top=ys.min(); H=958-top
    y1=int(top+frac*H)
    cols=np.where(a[top:y1].max(0)>0.5)[0]
    x0,x1=cols.min(),cols.max()
    return top,y1,x0,x1
def register(ref, tgt, frac=0.42, rots=np.arange(-24,24.1,2), scales=np.arange(0.84,1.17,0.04), box=None):
    ra,rg=ref; ta,tg=tgt
    top,y1,x0,x1=box or head_template(ra,rg,frac)
    pad=40
    crop=feat(ra,rg)[max(0,top-pad):y1, max(0,x0-pad):x1+pad]
    oy,ox=max(0,top-pad),max(0,x0-pad)
    B=300
    T=cv2.resize(cv2.copyMakeBorder(feat(ta,tg),B,B,B,B,cv2.BORDER_CONSTANT,value=0),None,fx=1/D,fy=1/D,interpolation=cv2.INTER_AREA)
    best=(-2,None)
    cy,cx=crop.shape[0]/2,crop.shape[1]/2
    for s in scales:
        for r in rots:
            M=cv2.getRotationMatrix2D((cx,cy),-r,s)
            # agrandit le cadre pour ne pas couper
            w=int(crop.shape[1]*s*1.3); h=int(crop.shape[0]*s*1.3)
            M[0,2]+=w/2-cx; M[1,2]+=h/2-cy
            wc=cv2.warpAffine(crop,M,(w,h),flags=cv2.INTER_LINEAR)
            wm=cv2.warpAffine(np.ones(crop.shape[:2],np.float32),M,(w,h))
            wc=cv2.resize(wc,None,fx=1/D,fy=1/D,interpolation=cv2.INTER_AREA); wm=cv2.resize(wm,None,fx=1/D,fy=1/D,interpolation=cv2.INTER_AREA)
            if wc.shape[0]>=T.shape[0] or wc.shape[1]>=T.shape[1]: continue
            mm=np.dstack([wm,wm]).astype(np.float32)
            res=cv2.matchTemplate(T,wc,cv2.TM_SQDIFF,mask=mm)/max(1.0,float(wm.sum()))
            res=np.nan_to_num(res,nan=9,posinf=9)
            mn,_,ml,_=cv2.minMaxLoc(res); mv=-mn
            if mv>best[0]:
                # point du gabarit (cx,cy) dans la cible
                tx=ml[0]*D+w/2-B; ty=ml[1]*D+h/2-B
                best=(mv,dict(s=float(s),rot=float(r),ref_c=[ox+cx,oy+cy],tgt_c=[float(tx),float(ty)],score=float(mv)))
    return best[1]
def apply(t,pt):
    """Point de la référence -> point de la cible."""
    th=np.deg2rad(t['rot']); s=t['s']
    dx=pt[0]-t['ref_c'][0]; dy=pt[1]-t['ref_c'][1]
    return [t['tgt_c'][0]+s*(dx*np.cos(th)-dy*np.sin(th)), t['tgt_c'][1]+s*(dx*np.sin(th)+dy*np.cos(th))]
if __name__=='__main__':
    # Usage : register.py [espèce…] [--poses a,b] [--out fichier] ; fusionne avec register.json (poses non relancées gardées).
    args=sys.argv[1:]; poses=P; dst=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'register.json')
    if '--poses' in args: i=args.index('--poses'); poses=args[i+1].split(','); del args[i:i+2]
    if '--out' in args: i=args.index('--out'); dst=args[i+1]; del args[i:i+2]
    out=json.load(open(dst)) if os.path.exists(dst) else {}
    for s in args or ['nino','suzie','gaston','pia']:
        ref=load(f'{A}{s}_corps_neutre.webp'); out.setdefault(s,{})
        for p in poses:
            t=register(ref, load(f'{A}{s}_corps_{p}.webp' if not p.startswith('evo_') else f'{A}{s}_{p}.webp'), **({'scales':SCALES[p]} if p in SCALES else {}))
            out[s][p]=t; print(s,p,round(t['s'],2),t['rot'],[round(v) for v in t['tgt_c']],round(t['score'],3),flush=True)
    json.dump(out,open(dst,'w'),indent=1)
