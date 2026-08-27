import os
import runpy

os.environ['LOCALITO_NEW_REPORT'] = '1'
os.environ['LOCALITO_REPORT_OUT'] = r'C:\Users\cajgo\Documents\Codex\LocalitoSaaS\entregables\NUEVOS\Informe_Formativo_Proyecto_APT_Localito.docx'
runpy.run_path(r'C:\Users\cajgo\Documents\Codex\LocalitoSaaS\entregables\_qa_formativa\build_formativa.py', run_name='__main__')

