"""Validate the shipped catalog, PDF assets, and GitHub Pages paths."""
import hashlib
import json
from pathlib import Path
import unittest
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1] / 'docs'
DATA = json.loads((ROOT / 'data/library.json').read_text())
RECORDS = DATA['resources'] + DATA.get('pyqs', [])

class LibraryTests(unittest.TestCase):
    def test_catalog_and_routes(self):
        subjects = {s['id']: s for s in DATA['subjects']}
        self.assertEqual(len(subjects), len(DATA['subjects']))
        self.assertEqual({s['semester'] for s in subjects.values()}, set(range(1,9)))
        exam_slots=[(r['semester'],r['code'],r['session']) for r in DATA.get('pyqs',[])]
        self.assertEqual(len(exam_slots),len(set(exam_slots)), 'Duplicate exam-session cards')
        ids = [r['id'] for r in RECORDS]
        self.assertEqual(len(ids), len(set(ids)))
        for r in RECORDS:
            with self.subTest(resource=r['id']):
                if r['kind'] == 'pyq':
                    self.assertIn(r['provider'], DATA['providers'])
                    self.assertIn(r['semester'], range(1,9))
                    self.assertTrue(r['code'])
                    self.assertTrue(r['session'])
                    if r['semester'] == 5:
                        self.assertIn(r['code'], {'76786','76787','76788','76789','76790'})
                        self.assertIn(r['syllabusSubject'], subjects)
                        self.assertEqual(subjects[r['syllabusSubject']]['semester'], 5)
                        self.assertEqual(r['paperSubject'], subjects[r['syllabusSubject']]['name'])
                    self.assertEqual(urlparse(r['source']).netloc, {'firstranker':'firstranker.com','ptustudy':'www.ptustudy.com'}[r['provider']])
                    continue
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
        for r in RECORDS:
            with self.subTest(resource=r['id']):
                if not r.get('path'):
                    self.assertEqual(r['kind'], 'pyq')
                    self.assertTrue(r['unavailableReason'])
                    continue
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
        for name in ('styles.css','app.js','pyq-filters.js','favicon.svg','viewer.js','viewer.css','pdfjs/pdf.mjs','pdfjs/pdf.worker.mjs','pdfjs/LICENSE'):
            self.assertTrue((ROOT / 'assets' / name).is_file())
        for s in DATA['subjects']:
            if s.get('playlist'):
                self.assertEqual(urlparse(s['playlist']).netloc, 'www.youtube.com')
                self.assertTrue(urlparse(s['playlist']).query.startswith('list='))

    def test_imperfect_semester_availability(self):
        audit = json.loads((ROOT / 'data/imperfect-availability.json').read_text())
        self.assertEqual(len(audit['subjects']), 22)
        for source in audit['subjects']:
            subject = next(s for s in DATA['subjects'] if s['id'] == source['subject'])
            self.assertEqual(subject['source'], source['source'])
            self.assertEqual(subject['sourceCheckedAt'], audit['checkedAt'])
            self.assertEqual([u['number'] for u in subject['units']], [1, 2, 3, 4, 5])
            for unit in source['units']:
                listed = next(u for u in subject['units'] if u['number'] == unit['number'])
                notes = [r for r in DATA['resources'] if r.get('subject') == subject['id']
                         and r.get('unit') == unit['number'] and r.get('provider') == 'imperfect']
                self.assertEqual(listed['availability'], unit['availability'])
                self.assertEqual(len(notes), len(unit['downloads']))
                for note in notes:
                    self.assertIn(note['downloadSource'], unit['downloads'])
                    self.assertEqual(urlparse(note['downloadSource']).netloc, 'dl.imperfectpharmacy.in')
                self.assertEqual([listed['video']] if listed.get('video') else [], unit['videos'])
                for video in unit['videos']:
                    self.assertEqual(urlparse(video).netloc, 'www.youtube.com')
        semester_six = [r for r in DATA['resources'] if r['semester'] == 6]
        self.assertEqual(len(semester_six), 30)
        self.assertEqual(len({r['subject'] for r in semester_six}), 6)

if __name__ == '__main__':
    unittest.main()
