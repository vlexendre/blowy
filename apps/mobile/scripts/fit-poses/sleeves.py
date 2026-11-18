"""sleeves.py : manches (bras hors du ventre) de chaque espèce × pose -> fit.json species.<s>.poses.<p>.sleeves
[[manche x,y,...], [poignet x,y,...]] par bras (fractions de la toile, polygones simplifiés) ; species.<s>.furL :
luminance moyenne de la fourrure (pour recolorer). Planche de contrôle à côté du script (sleeves_<espèce>.png).
Lancer : python3 apps/mobile/scripts/fit-poses/sleeves.py"""
import json, os, numpy as np, cv2
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.join(HERE,'../../../..')
P=os.path.join(ROOT,'packages/ui/src/assets/fit.json'); PETS=os.path.join(ROOT,'packages/ui/assets/pets')
d=json.load(open(P))
SLEEVE=0.72  # part du bras couverte (le reste : la patte)
CUFF=0.14    # largeur du poignet (part de la longueur du bras)
def poly(m):
    cs,_=cv2.findContours(m.astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    if not cs: return None
    c=max(cs,key=cv2.contourArea); c=cv2.approxPolyDP(c,2.5,True)[:,0,:]
    return [round(float(v),4) for x,y in c for v in (x/900,y/1000)]
for sp in ['nino','suzie','gaston','pia']:
  cells=[]; Ls=[]
  for pose,pf in d['species'][sp]['poses'].items():
    pf.pop('sleeves',None)
    try: im=Image.open(f'{PETS}/{sp}_corps_{pose}.webp').convert('RGBA').resize((900,1000))
    except Exception: continue
    arr=np.asarray(im); a=arr[...,3]>128
    if pose=='neutre': Ls.append(float((arr[a][:,:3]@np.array([0.3,0.59,0.11])).mean()/255))
    if pose in ('oeuf','oeuf_fele','eclosion','fantome','bain','malade','marche','danger'): continue
    pts=pf['points']; eyes=pts['eyes'][1]*1000; feet=pts['feet'][1]*1000; top=pts['headTop'][1]*1000
    R=int(0.16*900*pf['scale'])
    core=cv2.morphologyEx(a.astype(np.uint8),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*R+1,2*R+1)))>0
    prot=a&~(cv2.dilate(core.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))>0)
    prot=ndi.binary_opening(prot,iterations=3)
    lab,n=ndi.label(prot); out=[]
    dist=ndi.distance_transform_edt(~core)
    ov=np.zeros((1000,900,4),np.uint8)
    for i in range(1,n+1):
      m=lab==i
      if m.sum()<1500: continue
      ys,xs=np.where(m); cy=ys.mean()
      if cy<eyes-90 or cy>feet-140 or ys.max()>feet-20: continue
      # le bras part du ventre : on l'élargit un peu vers le corps pour que la manche y entre
      grow=cv2.dilate(m.astype(np.uint8),cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(45,45)))>0
      arm=grow&a
      dm=dist*arm; L=dm.max()
      sleeve=arm&(dist<SLEEVE*L); cuff=sleeve&(dist>(SLEEVE-CUFF)*L)
      # épaule : la manche rejoint le vêtement (dont le haut est vers la bouche) le long du bord du corps
      yb=int(pts['mouth'][1]*1000+30)
      if ys.min()<yb:
        row=np.where(a[yb])[0]
        if len(row):
          side=1 if xs.mean()>450 else -1
          ex=row.max() if side>0 else row.min(); ix=ex-side*int(0.13*900*pf['scale'])
          sy_,sx_=np.where(sleeve&(dist<0.25*L))
          if len(sx_):
            hull=cv2.convexHull(np.array(list(zip(sx_,sy_))+[(ex,yb),(ix,yb)],np.int32))
            sh=np.zeros_like(a,np.uint8); cv2.fillPoly(sh,[hull],1)
            sleeve=sleeve|((sh>0)&a)
      ps,pc=poly(sleeve),poly(cuff)
      if ps and pc: out.append([ps,pc]); ov[sleeve]=(0,120,255,140); ov[cuff]=(255,60,60,160)
    if out: pf['sleeves']=out
    bg=Image.new('RGBA',im.size,(30,30,50,255)); bg.alpha_composite(im); bg.alpha_composite(Image.fromarray(ov,'RGBA'))
    c=bg.convert('RGB').resize((180,200)); ImageDraw.Draw(c).text((4,4),pose,fill=(255,255,0)); cells.append(c)
  d['species'][sp]['furL']=round(Ls[0],3)
  s=Image.new('RGB',(180*9,200*((len(cells)+8)//9)))
  for i,c in enumerate(cells): s.paste(c,((i%9)*180,(i//9)*200))
  s.save(os.path.join(HERE,f'sleeves_{sp}.png'))
open(P,'w').write(json.dumps(d,ensure_ascii=False,indent=1)+'\n')
print({sp:sum(1 for p in d['species'][sp]['poses'].values() if 'sleeves' in p) for sp in d['species']}, {sp:d['species'][sp]['furL'] for sp in d['species']})
