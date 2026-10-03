import pypdfium2 as pdfium, sys
from pathlib import Path
pdf=pdfium.PdfDocument(sys.argv[1]); out=Path(sys.argv[2]); out.mkdir(parents=True,exist_ok=True)
for i,page in enumerate(pdf):
 page.render(scale=1.6).to_pil().save(out/f'page-{i+1}.png')
print(len(pdf))
