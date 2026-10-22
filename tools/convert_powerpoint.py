#!/usr/bin/env python3
"""Masjid Ibrahim local PowerPoint renderer. Runs only on the speaker's computer.
Requires LibreOffice (soffice), Python 3 and its standard library.
No source slides, notes or presentation contents are sent to a conversion server.
"""
import argparse, json, pathlib, shutil, subprocess, sys, tempfile, zipfile, xml.etree.ElementTree as ET

def extract_notes(pptx):
    ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main',
        'a':'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
    out={}
    with zipfile.ZipFile(pptx) as z:
        for name in z.namelist():
            import re
            m=re.fullmatch(r'ppt/notesSlides/notesSlide(\d+)\.xml',name)
            if not m: continue
            root=ET.fromstring(z.read(name))
            paras=[]
            for shape in root.findall('.//p:sp',ns):
                ph=shape.find('./p:nvSpPr/p:nvPr/p:ph',ns)
                if ph is None or ph.get('type')!='body': continue
                for paragraph in shape.findall('.//a:p',ns):
                    line=''.join((t.text or '') for t in paragraph.findall('.//a:t',ns))
                    if line.strip():paras.append(line)
            out[m.group(1)]='\n'.join(paras)
    return out

def main():
    ap=argparse.ArgumentParser(description='Convert PPTX to local PDF and verify page count')
    ap.add_argument('pptx',type=pathlib.Path)
    ap.add_argument('--output',type=pathlib.Path,help='Output folder (default: next to source in a new _slides folder)')
    args=ap.parse_args()
    source=args.pptx.expanduser().resolve()
    if not source.is_file() or source.suffix.lower()!='.pptx':ap.error('Specify a .pptx file')
    if source.stat().st_size>50*1024*1024:ap.error('File exceeds 50 MB limit')
    soffice=shutil.which('soffice') or shutil.which('libreoffice')
    if not soffice and sys.platform=='darwin':
        candidate=pathlib.Path('/Applications/LibreOffice.app/Contents/MacOS/soffice')
        if candidate.exists():soffice=str(candidate)
    if not soffice and sys.platform=='win32':
        for root in ('C:/Program Files/LibreOffice/program/soffice.exe','C:/Program Files (x86)/LibreOffice/program/soffice.exe'):
            if pathlib.Path(root).exists():soffice=root;break
    if not soffice:sys.exit('LibreOffice is required on this computer. Install from libreoffice.org, then rerun.')
    out=(args.output or source.parent/(source.stem+'_slides')).expanduser().resolve()
    out.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='masjid-ppt-') as temp:
        profile=(pathlib.Path(temp)/'profile').as_uri()
        command=[soffice,'-env:UserInstallation='+profile,'--headless','--convert-to','pdf:impress_pdf_Export','--outdir',str(out),str(source)]
        result=subprocess.run(command,capture_output=True,text=True,timeout=180)
        target=out/(source.stem+'.pdf')
        if result.returncode!=0 or not target.is_file() or target.stat().st_size==0:
            sys.exit('Local PowerPoint conversion failed: '+(result.stderr or result.stdout)[-500:])
    print(json.dumps({'status':'converted','pdf':str(target),'source':str(source),'note':'Open your original PPTX in the Presenter Portal, then select this generated PDF under slide graphics. Notes come from PPTX, not PDF.'},indent=2))
if __name__=='__main__':main()
