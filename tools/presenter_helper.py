#!/usr/bin/env python3
"""Local, loopback-only PPTX renderer for the Masjid Ibrahim staging presenter portal.
Requires Python 3 and locally installed LibreOffice. Files are temporary.
Start: python tools/presenter_helper.py
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import os, pathlib, shutil, subprocess, sys, tempfile, urllib.parse

PORT=43871
ALLOWED={'https://masjid-ibrahim-staging.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'}
MAX_BYTES=50*1024*1024

def office():
    x=shutil.which('soffice') or shutil.which('libreoffice')
    if x:return x
    candidates=['/Applications/LibreOffice.app/Contents/MacOS/soffice',
                'C:/Program Files/LibreOffice/program/soffice.exe',
                'C:/Program Files (x86)/LibreOffice/program/soffice.exe']
    return next((p for p in candidates if pathlib.Path(p).is_file()),None)

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print('Presenter helper:',fmt%args)
    def origin_ok(self):
        return self.headers.get('Origin') in ALLOWED
    def headers_common(self,status,mime='text/plain'):
        self.send_response(status)
        self.send_header('Content-Type',mime)
        self.send_header('Cache-Control','no-store')
        self.send_header('Access-Control-Allow-Origin',self.headers.get('Origin',''))
        self.send_header('Vary','Origin')
        self.send_header('Access-Control-Allow-Private-Network','true')
        self.send_header('X-Content-Type-Options','nosniff')
        self.end_headers()
    def do_OPTIONS(self):
        if not self.origin_ok():self.send_error(403);return
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin',self.headers['Origin'])
        self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type')
        self.send_header('Access-Control-Allow-Private-Network','true')
        self.send_header('Access-Control-Max-Age','600')
        self.end_headers()
    def do_POST(self):
        if not self.origin_ok():self.send_error(403);return
        if urlsplit(self.path).path!='/convert':self.send_error(404);return
        try: length=int(self.headers.get('Content-Length','0'))
        except ValueError:length=0
        if length<1 or length>MAX_BYTES:
            self.headers_common(413);self.wfile.write(b'File must be between 1 byte and 50 MB');return
        executable=office()
        if not executable:
            self.headers_common(503);self.wfile.write(b'LibreOffice is not installed on this computer.');return
        try:
            with tempfile.TemporaryDirectory(prefix='masjid-render-') as tmp:
                src=pathlib.Path(tmp)/'presentation.pptx'
                with src.open('wb') as out:
                    remaining=length
                    while remaining:
                        chunk=self.rfile.read(min(1024*1024,remaining))
                        if not chunk:raise ValueError('Incomplete upload')
                        out.write(chunk);remaining-=len(chunk)
                if not src.read_bytes()[:4]==bytes([0x50,0x4b,0x03,0x04]):
                    raise ValueError('Not a valid PPTX archive')
                outdir=pathlib.Path(tmp)/'out';outdir.mkdir()
                profile=(pathlib.Path(tmp)/'lo-profile').as_uri()
                command=[executable,'-env:UserInstallation='+profile,'--headless','--convert-to','pdf:impress_pdf_Export','--outdir',str(outdir),str(src)]
                result=subprocess.run(command,capture_output=True,text=True,timeout=180)
                pdf=outdir/'presentation.pdf'
                if result.returncode!=0 or not pdf.is_file():raise ValueError('LibreOffice could not convert this PowerPoint.')
                data=pdf.read_bytes()
                if not data.startswith(b'%PDF-'):raise ValueError('Invalid PDF returned by converter')
                self.send_response(200)
                self.send_header('Content-Type','application/pdf')
                self.send_header('Content-Length',str(len(data)))
                self.send_header('Access-Control-Allow-Origin',self.headers['Origin'])
                self.send_header('Vary','Origin')
                self.send_header('Cache-Control','no-store')
                self.send_header('X-Content-Type-Options','nosniff')
                self.end_headers();self.wfile.write(data)
        except (ValueError,subprocess.TimeoutExpired) as exc:
            self.headers_common(422);self.wfile.write(str(exc).encode('utf-8')[:500])
        except (BrokenPipeError,ConnectionResetError):
            pass
        except Exception:
            self.headers_common(500);self.wfile.write(b'Local conversion failed')
if __name__=='__main__':
    if not office():sys.exit('Install LibreOffice from libreoffice.org first.')
    print('Masjid Ibrahim local presenter helper active on 127.0.0.1:'+str(PORT))
    print('Keep this window open while presenting. Stop with Ctrl+C.')
    ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
