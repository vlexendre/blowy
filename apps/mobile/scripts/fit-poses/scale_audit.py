"""Échelle réelle de chaque pose : compare la hauteur dans la planche brute et dans la découpe."""
import os, numpy as np, json, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
from PIL import Image
from scipy import ndimage as ndi
M=os.environ.get('MASCOTS', '/home/claude/work/mascots/')
P=['neutre','joie','triste','surpris','boude','dodo','mange','joue','marche','coucou','check','pense']
out={}
for s in ['nino','suzie','gaston','pia']:
    raw=[]
    for i in range(6):
        im=np.asarray(Image.open(f'{M}{s}/raw/pair{i}.png').convert('RGB')).astype(int)
        w=im.shape[1]//2
        for half in (im[:,:w],im[:,w:]):
            d=(255*3-half.sum(-1))>60
            lab,n=ndi.label(d); sz=ndi.sum(d,lab,range(1,n+1)); m=lab==(1+int(np.argmax(sz)))
            ys,xs=np.where(m); raw.append((ys.max()-ys.min(), xs.max()-xs.min()))
    res={}
    for k,p in enumerate(P):
        a=np.asarray(Image.open(f'{M}{s}/cut/{s}_corps_{p}.webp'))[...,3]; ys,xs=np.where(a>20)
        hc=ys.max()-ys.min(); res[p]=dict(raw_h=int(raw[k][0]),raw_w=int(raw[k][1]),cut_h=int(hc),cut_w=int(xs.max()-xs.min()))
    s0=res['neutre']['cut_h']/res['neutre']['raw_h']
    for p,r in res.items(): r['c']=round(r['raw_h']*s0/r['cut_h'],3); r['true_w']=round(r['raw_w']*s0)
    out[s]=res
    print(s, {p:(r['c'],r['true_w']) for p,r in res.items()})
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scale_audit.json'),'w'),indent=1)
