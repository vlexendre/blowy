"""tips.py : centres des deux pompons (Suzie) / cornes (Pia) sur chaque pose (-> fit.json species.<s>.poses.<p>.tips).
Lancer depuis n'importe où : python3 apps/mobile/scripts/fit-poses/tips.py ; écrit tips.json et une planche de contrôle par espèce à côté du script."""
import json, os, sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.join(HERE,'../../../..'); P=os.path.join(ROOT,'packages/ui/src/assets/fit.json'); PETS=os.path.join(ROOT,'packages/ui/assets/pets')
d=json.load(open(P)); out={}
for sp in ['suzie','pia']:
  out[sp]={}
  for pose,pf in d['species'][sp]['poses'].items():
    try: im=Image.open(f'{PETS}/{sp}_corps_{pose}.webp').convert('RGBA').resize((900,1000))
    except Exception: continue
    arr=np.asarray(im).astype(int); a=arr[...,3]>128
    r,g,b=arr[...,0],arr[...,1],arr[...,2]
    if sp=='suzie':
      ht=pf['points']['headTop'][1]*1000
      reg=a.copy(); reg[int(ht-10):]=False
      reg=ndi.binary_erosion(reg,iterations=7)  # retire les tiges
    else:
      br=pf['points']['brow'][1]*1000
      # cornes : crème / rose pâle (pas le violet de la fourrure)
      reg=a&(r>215)&(g>165)&(b<g+12); reg[int(br-30):]=False
      reg=ndi.binary_opening(reg,iterations=3)
    lab,n=ndi.label(reg)
    if n<2: out[sp][pose]=None; continue
    sizes=ndi.sum(reg,lab,range(1,n+1)); idx=np.argsort(sizes)[::-1][:2]
    if sizes[idx[1]]<0.2*sizes[idx[0]] or sizes[idx[1]]<150: out[sp][pose]=None; continue
    cs=[ndi.center_of_mass(reg,lab,i+1) for i in idx]
    cs=sorted([(c[1]/900,c[0]/1000) for c in cs])
    rad=[float(np.sqrt(sizes[i]/np.pi)) for i in idx]
    out[sp][pose]={'L':[round(cs[0][0],4),round(cs[0][1],4)],'R':[round(cs[1][0],4),round(cs[1][1],4)],'r':round(sum(rad)/2,1)}
json.dump(out,open(os.path.join(HERE,'tips.json'),'w'),indent=1)
# planche
for sp in out:
  cells=[]
  for pose,v in out[sp].items():
    im=Image.open(f'{PETS}/{sp}_corps_{pose}.webp').convert('RGBA').resize((900,1000)); bg=Image.new('RGBA',im.size,(30,30,50,255)); bg.alpha_composite(im); dr=ImageDraw.Draw(bg)
    if v:
      for k in 'LR': x,y=v[k][0]*900,v[k][1]*1000; dr.ellipse((x-12,y-12,x+12,y+12),outline=(0,255,0),width=5)
    else: dr.text((20,20),'NONE',fill=(255,0,0))
    dr.text((20,950),pose,fill=(255,255,255)); cells.append(bg.resize((180,200)))
  s=Image.new('RGB',(180*9,200*((len(cells)+8)//9)))
  for i,c in enumerate(cells): s.paste(c.convert('RGB'),((i%9)*180,(i//9)*200))
  s.save(os.path.join(HERE,f'tips_{sp}.png'))
print({sp:sum(1 for v in out[sp].values() if v is None) for sp in out})
