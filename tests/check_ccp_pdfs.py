"""Validate extracted scans, including the continuation-page resource regression."""
import json
from pathlib import Path
import unittest
from pypdf import PdfReader
from pypdf.generic import ContentStream

ROOT = Path(__file__).resolve().parents[1] / 'docs'
DATA = json.loads((ROOT / 'data/library.json').read_text())

class ArchivePdfTests(unittest.TestCase):
    def test_pages_are_readable_and_resources_resolve(self):
        papers = [r for r in DATA['pyqs'] if r['provider'] == 'ccp']
        self.assertEqual(len(papers), 200)
        for paper in papers:
            with self.subTest(paper=paper['id']):
                reader = PdfReader(ROOT / paper['path'])
                self.assertEqual(len(reader.pages), paper['pages'])
                for page in reader.pages:
                    used = {args[0] for args,op in ContentStream(page.get_contents(),reader).operations if op == b'Do'}
                    self.assertTrue(used, 'Blank extracted scan')
                    self.assertTrue(used.issubset(set(page['/Resources']['/XObject'])), 'Missing continuation image')
                    self.assertGreater(float(page.mediabox.height),float(page.mediabox.width), 'Reading page is sideways')
                    self.assertEqual(list(page.mediabox),list(page.cropbox))

    def test_continuations_are_retained(self):
        by_id = {r['id']:r for r in DATA['pyqs']}
        for id, expected in {
            'pyq-ptu-s1-2024-06-74644':6,
            'pyq-ptu-s8-2024-05-79767':4,
            'pyq-ptu-s8-2025-01-79764':3,
            'pyq-ptu-s8-2023-00-79764':3,
        }.items():
            self.assertEqual(by_id[id]['pages'],expected)

if __name__ == '__main__':
    unittest.main()
