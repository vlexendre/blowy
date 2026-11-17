"""Pose les 48 corps sur la toile de l'app à une échelle commune par espèce (corrige les poses rétrécies à la découpe).
Usage : python3 -I normalize.py <sortie>"""
import os, json, sys, os
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
from PIL import Image
import numpy as np
M=os.environ.get('MASCOTS', '/home/claude/work/mascots/'); out=sys.argv[1]
audit=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scale_audit.json')))
F={'nino':1.0,'suzie':1.0,'gaston':0.874,'pia':0.881}
GROUND=958
total=0
for s,poses in audit.items():
    for p,r in poses.items():
        im=Image.open(f'{M}{s}/cut/{s}_corps_{p}.webp').convert('RGBA')
        c=r['c'] if r['c']>1.025 else 1.0
        k=F[s]*c
        if abs(k-1)>1e-3:
            a=np.asarray(im)[...,3]; ys,xs=np.where(a>8)
            fig=im.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
            cx=(xs.min()+xs.max()+1)/2
            fig=fig.resize((round(fig.width*k),round(fig.height*k)),Image.LANCZOS)
            can=Image.new('RGBA',(900,1000),(0,0,0,0))
            can.alpha_composite(fig,(round(450-fig.width/2),round(GROUND+1-fig.height)))
            im=can
        dst=os.path.join(out,f'{s}_corps_{p}.webp'); im.save(dst,'WEBP',quality=88,method=6)
        sz=os.path.getsize(dst); total+=sz; print(f'{s}_corps_{p}', round(k,3), sz//1024,'Ko')
print('total',total//1024,'Ko')
