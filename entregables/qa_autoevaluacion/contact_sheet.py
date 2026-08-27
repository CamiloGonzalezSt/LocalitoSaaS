from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import sys, math
files=sorted(Path(sys.argv[1]).glob('page-*.png'),key=lambda p:int(p.stem.split('-')[1]))
thumbs=[]
for i,f in enumerate(files,1):
 im=Image.open(f).convert('RGB'); im.thumbnail((420,325)); canvas=Image.new('RGB',(440,355),'white'); canvas.paste(im,((440-im.width)//2,25)); ImageDraw.Draw(canvas).text((8,5),f'Page {i}',fill='black'); thumbs.append(canvas)
sheet=Image.new('RGB',(440*3,355*math.ceil(len(thumbs)/3)),(220,220,220))
for i,im in enumerate(thumbs):sheet.paste(im,((i%3)*440,(i//3)*355))
sheet.save(sys.argv[2])
