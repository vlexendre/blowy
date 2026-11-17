"""Planche des ancres : chaque pose avec ses points (pour vérifier la calibration à l'œil)."""
import os, json, sys
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
from PIL import Image, ImageDraw
A=os.path.join(ROOT, 'packages/ui/assets/pets/')
P=['neutre','joie','triste','surpris','boude','dodo','mange','joue','marche','coucou','check','pense']
COL={'headTop':(255,0,0),'crown':(255,140,0),'eyes':(0,200,255),'eyeL':(0,120,255),'eyeR':(0,120,255),'nose':(255,0,255),'mouth':(255,255,0),'cheeks':(255,180,200),'neck':(0,255,0),'torso':(0,140,0),'hand':(255,255,255),'ground':(120,120,120)}
def sheet(points, out, species=None, poses=P, cell=300, cols=None):
    sp=species or list(points)
    cols=cols or len(poses); rows=-(-len(poses)//cols)
    ch=int(cell*1.111)
    W=Image.new('RGB',(cell*cols,ch*rows*len(sp)),(40,30,70))
    for i,s in enumerate(sp):
        for j,p in enumerate(poses):
            im=Image.open(f'{A}{s}_corps_{p}.webp').convert('RGBA')
            bg=Image.new('RGBA',im.size,(40,30,70,255)); bg.alpha_composite(im); d=ImageDraw.Draw(bg)
            pts=points[s].get(p,{})
            for k,v in pts.items():
                if k not in COL or v is None: continue
                x,y=v[0]*900,v[1]*1000; r=14
                d.ellipse((x-r,y-r,x+r,y+r),outline=COL[k],width=6)
            d.text((10,10),p,fill=(255,255,255))
            W.paste(bg.convert('RGB').resize((cell,ch)),((j%cols)*cell,(i*rows+j//cols)*ch))
    W.save(out)
if __name__=='__main__':
    sheet(json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3:] or None)
