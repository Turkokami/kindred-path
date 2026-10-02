# Generates Wren lip-sync (m1-m3) and blink frames from the source illustration.
# Usage: put the original 1254x1254 image at ./scene.png, run: python3 make-avatar-frames.py
# Then export to public/avatar/*.webp. Coordinates below are in source-image pixels.
from PIL import Image, ImageDraw, ImageFilter
import math
src = Image.open('scene.png').convert('RGB')
S = 4  # supersample factor
BOX = (618,395,750,490)
LX,LY,RX,RY = 634,440,728,416
BAND = 46
def lipline(x):
    t=(x-LX)/(RX-LX); return LY+(RY-LY)*t+4*math.sin(math.pi*t)
def mouth(s):
    x0,y0,x1,y1 = BOX
    big = src.crop(BOX).resize(((x1-x0)*S,(y1-y0)*S), Image.LANCZOS)
    if s == 0: return src.crop(BOX)
    out = big.copy(); px = out.load(); sp = big.load(); Wb,Hb = big.size
    for xb in range(Wb):
        x = x0 + xb/S
        if x < LX-1 or x > RX+1: continue
        t = min(1,max(0,(x-LX)/(RX-LX)))
        sh = s*(math.sin(math.pi*t)**0.8)*S
        yl = (lipline(x)-y0)*S
        band = BAND*S
        for yb in range(math.ceil(yl), min(Hb, int(yl+band))):
            d = yb-yl
            if d < sh:
                f = d/max(sh,1)
                col = (int(62+40*f), int(24+14*f), int(28+10*f))
                if s >= 6 and d < min(2.6*S, sh*0.3) and 0.22<t<0.8:
                    col = (222,212,204)
                px[xb,yb] = col
            else:
                ys = yl + (d-sh)*band/(band-sh)
                ya = int(ys); fr = ys-ya
                a = sp[xb,ya]; b = sp[xb,min(Hb-1,ya+1)]
                px[xb,yb] = tuple(int(a[i]*(1-fr)+b[i]*fr) for i in range(3))
    out = out.filter(ImageFilter.GaussianBlur(0.6*S/2))
    return out.resize((x1-x0,y1-y0), Image.LANCZOS)
for n,s in [('m0',0),('m1',3),('m2',6),('m3',10)]: mouth(s).save(f'{n}.png')

EB = (570,290,770,378)
def blink():
    x0,y0,x1,y1 = EB
    big = src.crop(EB).resize(((x1-x0)*S,(y1-y0)*S), Image.LANCZOS)
    d = ImageDraw.Draw(big)
    eyes = [((566,318,648,370),(588,372,636,380)), ((688,296,764,342),(700,344,748,351))]
    for (ex0,ey0,ex1,ey1),(sx0,sy0,sx1,sy1) in eyes:
        reg = src.crop((sx0,sy0,sx1,sy1)).resize((1,1), Image.BOX).getpixel((0,0))
        lid = tuple(int(c*0.97) for c in reg)
        m = Image.new('L', big.size, 0)
        ImageDraw.Draw(m).ellipse(((ex0-x0)*S,(ey0-y0)*S,(ex1-x0)*S,(ey1-y0)*S), fill=255)
        m = m.filter(ImageFilter.GaussianBlur(3*S))
        big.paste(Image.new('RGB', big.size, lid), (0,0), m)
        cy = ey0 + (ey1-ey0)*0.58
        bb = ((ex0+6-x0)*S, (cy-14-y0)*S, (ex1-6-x0)*S, (cy+6-y0)*S)
        d.arc(bb, 20, 160, fill=(48,30,24), width=int(2.6*S))
    return big.resize((x1-x0,y1-y0), Image.LANCZOS)
blink().save('blink.png'); src.crop(EB).save('eyes_open.png')
sheet = Image.new('RGB',(132*4,95+88),'white')
for i,n in enumerate(['m0','m1','m2','m3']): sheet.paste(Image.open(n+'.png'),(i*132,0))
sheet.paste(Image.open('blink.png'),(0,95)); sheet.paste(Image.open('eyes_open.png'),(210,95))
sheet.resize((sheet.width*2,sheet.height*2)).save('sheet.png')
