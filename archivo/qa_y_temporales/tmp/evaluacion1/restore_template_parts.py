from pathlib import Path
import os
import zipfile

source = Path(r"C:\Users\cajgo\Downloads\1.5_GuiaEstudiante_Fase 1_Definicion Proyecto APT.docx")
target = Path(r"C:\Users\cajgo\Documents\Codex\LocalitoSaaS\entregables\Evaluacion1\Definicion_Proyecto_APT_Localito_Camilo_Gonzalez.docx")
temp = target.with_suffix(".preserved.tmp.docx")

preserve = {
    "word/header1.xml",
    "word/_rels/header1.xml.rels",
    "word/media/image1.png",
    "word/theme/theme1.xml",
    "word/numbering.xml",
    "word/styles.xml",
    "word/fontTable.xml",
    "word/_rels/document.xml.rels",
}

with zipfile.ZipFile(source, "r") as src, zipfile.ZipFile(target, "r") as dst, zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED) as out:
    src_names = set(src.namelist())
    for info in dst.infolist():
        data = src.read(info.filename) if info.filename in preserve and info.filename in src_names else dst.read(info.filename)
        out.writestr(info, data)

os.replace(temp, target)
print(target)
