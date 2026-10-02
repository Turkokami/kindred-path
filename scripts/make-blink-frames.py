# Generates Wren half-closed (blink1) and closed (blink2) eye frames by sliding her real
# upper lash line down over the eye. Source image at ./scene.png (1254x1254).
from PIL import Image, ImageFilter
import numpy as np
src = Image.open('scene.png').convert('RGB')
S = 4
EB = (560,290,775,378)  # patch box (source px)
EYES = [
 dict(top=[(564,347),(575,340),(585,336),(597,331),(615,330),(630,331),(637,336),(642,344)],
      bot=[(564,350),(580,358),(595,361),(610,361),(625,359),(635,355),(642,349)], T=11, A=18),
 dict(top=[(690,337),(696,322),(702,310),(712,304),(730,303),(745,304),(755,307),(763,313)],
      bot=[(690,339),(700,336),(712,335),(722,333),(732,330),(742,326),(752,321),(763,317)], T=11, A=13),
]
def interp(pts, x):
    xs=[p[0] for p in pts]; ys=[p[1] for p in pts]; return np.interp(x, xs, ys)
def frame(c):
    x0,y0,x1,y1 = EB
    big = np.asarray(src.crop(EB).resize(((x1-x0)*S,(y1-y0)*S), Image.LANCZOS)).astype(float)
    out = big.copy(); Hb = big.shape[0]
    for e in EYES:
        xa, xb = e['top'][0][0], e['top'][-1][0]
        for xi in range(int((xa-x0)*S), int((xb-x0)*S)):
            x = x0 + xi/S
            yt = (interp(e['top'],x)-y0)*S
            yb = (interp(e['bot'],x)-y0)*S
            T = e['T']*S; A = e['A']*S
            yl = yt + T
            if yb <= yl: continue
            ye = yl + c*(yb-yl)          # new lid edge
            ya = yt - A                  # top of lid-skin strip (unchanged above)
            for yi in range(int(ya), int(ye)+1):
                if yi < 0 or yi >= Hb: continue
                if yi < ye - T:   # stretched lid skin: map [ya, ye-T] <- [ya, yt]
                    sy = ya + (yi-ya)*(yt-ya)/max(1e-6,(ye-T-ya))
                else:             # lash band: map [ye-T, ye] <- [yt, yl]
                    sy = yt + (yi-(ye-T))
                s0 = int(np.clip(sy,0,Hb-2)); f = sy - s0
                out[yi,xi] = big[s0,xi]*(1-f) + big[s0+1,xi]*f
    img = Image.fromarray(out.clip(0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
    return img.resize((x1-x0,y1-y0), Image.LANCZOS)
frame(0.5).save('blink1.png'); frame(1.0).save('blink2.png'); src.crop(EB).save('eyes0.png')
sheet = Image.new('RGB',(215*3,88),'white')
for i,n in enumerate(['eyes0','blink1','blink2']): sheet.paste(Image.open(n+'.png'),(i*215,0))
sheet.resize((sheet.width*2,sheet.height*2), Image.LANCZOS).save('blinksheet.png')
