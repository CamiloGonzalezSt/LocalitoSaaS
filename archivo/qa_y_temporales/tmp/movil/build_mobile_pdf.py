from pathlib import Path

from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[2]
SLIDES = Path(__file__).resolve().parent / "slides"
OUTPUT = ROOT / "output" / "pdf" / "Presentacion_Localito_Celular.pdf"
PAGE_SIZE = (1280, 720)


def main() -> None:
    images = sorted(SLIDES.glob("slide-*.png"))
    if len(images) != 10:
        raise RuntimeError(f"Se esperaban 10 laminas y se encontraron {len(images)}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=PAGE_SIZE, pageCompression=1)
    pdf.setTitle("Presentacion Localito - Version para celular")
    pdf.setAuthor("Camilo Gonzalez, Alexander Patino y Samuel Solis")
    pdf.setSubject("Propuesta de proyecto Localito")

    for image_path in images:
        pdf.drawImage(ImageReader(str(image_path)), 0, 0, width=PAGE_SIZE[0], height=PAGE_SIZE[1])
        pdf.showPage()

    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
