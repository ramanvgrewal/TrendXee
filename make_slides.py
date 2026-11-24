from PIL import Image, ImageDraw, ImageFont
import sys, json
W,H=1080,1350
BG=(42,29,23); CREAM=(240,228,212); ORANGE=(217,132,90); MUTED=(180,160,140)
LORA="/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf"
INTER="/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
INTER_R="/usr/share/fonts/opentype/inter/Inter-Regular.otf"
def f(p,s): return ImageFont.truetype(p,s)
def wrap(d,text,font,maxw):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=font)<=maxw: cur=t
        else: lines.append(cur); cur=w
    lines.append(cur); return lines
def base():
    im=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(im)
    d.text((90,90),"TRENDXEE",font=f(INTER,34),fill=ORANGE,spacing=8)
    d.line((90,1230,990,1230),fill=(80,60,50),width=2)
    d.text((90,1255),"trendxee.com",font=f(INTER_R,30),fill=MUTED)
    return im,d
spec=json.load(open(sys.argv[1]))
im,d=base()
d.text((90,300),spec["kicker"].upper(),font=f(INTER,32),fill=ORANGE)
y=370
for line in wrap(d,spec["title"],f(LORA,104),900):
    d.text((90,y),line,font=f(LORA,104),fill=CREAM); y+=124
y+=30
for line in wrap(d,spec["sub"],f(INTER_R,40),880):
    d.text((90,y),line,font=f(INTER_R,40),fill=MUTED); y+=56
d.text((90,1130),"Swipe  →",font=f(INTER,40),fill=CREAM)
im.save(sys.argv[2]+"/cover.jpg",quality=92)
im,d=base()
y=330
for line in wrap(d,spec["end_title"],f(LORA,92),900):
    d.text((90,y),line,font=f(LORA,92),fill=CREAM); y+=112
y+=40
for line in spec["end_lines"]:
    d.text((90,y),line,font=f(INTER_R,42),fill=MUTED); y+=64
d.rounded_rectangle((90,1080,620,1170),radius=45,fill=ORANGE)
d.text((130,1102),spec["end_cta"],font=f(INTER,38),fill=BG)
im.save(sys.argv[2]+"/end.jpg",quality=92)
