"""Validate the shipped catalog, PDF assets, and GitHub Pages paths."""
import hashlib
import json
from pathlib import Path
import unittest
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1] / 'docs'
DATA = json.loads((ROOT / 'data/library.json').read_text())

class LibraryTests(unittest.TestCase):
    def test_catalog_and_routes(self):
        subjects = {s['id']: s for s in DATA['subjects']}
        self.assertEqual(len(subjects), len(DATA['subjects']))
        self.assertEqual({s['semester'] for s in subjects.values()}, set(range(1,9)))
        ids = [r['id'] for r in DATA['resources']]
        self.assertEqual(len(ids), len(set(ids)))
        for r in DATA['resources']:
            with self.subTest(resource=r['id']):
                if r['kind'] == 'syllabus':
                    continue
                self.assertIn(r['subject'], subjects)
                s = subjects[r['subject']]
                self.assertEqual(r['semester'], s['semester'])
                self.assertIn(r['provider'], DATA['providers'])
                if r['kind'] == 'unit':
                    self.assertIn(r['unit'], [u['number'] for u in s['units']])
                if r['provider'] == 'carewell':
                    self.assertNotIn('playlist', r)
    def test_pdf_integrity_and_duplicates(self):
        paths = {}
        hashes = {}
        for r in DATA['resources']:
            with self.subTest(resource=r['id']):
                self.assertFalse(r['path'].startswith('/'))
                p = (ROOT / r['path']).resolve()
                self.assertTrue(p.is_relative_to(ROOT.resolve()))
                self.assertTrue(p.is_file())
                self.assertTrue(p.read_bytes()[:8].startswith(b'%PDF-'))
                self.assertEqual(p.stat().st_size, r['bytes'])
                self.assertLess(r['bytes'], 100*1024*1024)
                with p.open('rb') as stream:
                    sha = hashlib.file_digest(stream, 'sha256').hexdigest()
                self.assertEqual(sha, r['sha256'])
                if sha in hashes:
                    self.assertEqual(hashes[sha], p, 'Duplicate binary assets')
                hashes[sha] = p
                paths[p] = True
        self.assertEqual(set(ROOT.rglob('*.pdf')), set(paths))
    def test_static_entry_and_video_links(self):
        self.assertTrue((ROOT / 'index.html').is_file())
        self.assertTrue((ROOT / '.nojekyll').is_file())
        self.assertTrue((ROOT / 'viewer.html').is_file())
        for name in ('styles.css','app.js','favicon.svg','viewer.js','viewer.css','pdfjs/pdf.mjs','pdfjs/pdf.worker.mjs','pdfjs/LICENSE'):
            self.assertTrue((ROOT / 'assets' / name).is_file())
        for s in DATA['subjects']:
            if s.get('playlist'):
                self.assertEqual(urlparse(s['playlist']).netloc, 'www.youtube.com')
                self.assertTrue(urlparse(s['playlist']).query.startswith('list='))

if __name__ == '__main__':
    unittest.main()
