#!/usr/bin/env python3
"""Import locally collected PDFs into the buildless GitHub Pages library."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'docs/data/library.json'

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Folder containing subject folders')
    parser.add_argument('--semester', type=int, required=True, choices=range(1, 9))
    args = parser.parse_args()
    if not args.source.is_dir():
        parser.error('The source folder does not exist.')
    data = json.loads(CATALOG.read_text())
    resources = {r['id']: r for r in data['resources']}
    known_hashes = {r['sha256']: r['path'] for r in resources.values()}
    imported = skipped = 0
    try:
        from pypdf import PdfReader
    except ImportError:
        PdfReader = None
    def add(path, resource, relative):
        nonlocal imported, skipped
        sha = digest(path)
        if path.stat().st_size >= 100 * 1024 * 1024:
            raise ValueError(f'{path.name} exceeds GitHub’s 100 MiB file limit.')
        target = ROOT / 'docs' / relative
        existing = resources.get(resource['id'], {})
        # Identical content can share one asset, including across semesters.
        relative = known_hashes.get(sha, relative)
        target = ROOT / 'docs' / relative
        if target.exists() and digest(target) == sha:
            skipped += 1
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
            imported += 1
        record = {**existing, **resource, 'path': relative, 'bytes': path.stat().st_size, 'sha256': sha}
        if PdfReader:
            record['pages'] = len(PdfReader(path).pages)
        elif existing.get('sha256') != sha:
            record.pop('pages', None)
        resources[record['id']] = record
        known_hashes[sha] = relative
    matched = set()
    claimed_ids = set()
    for subject in data['subjects']:
        if subject['semester'] != args.semester:
            continue
        folder = args.source / subject.get('folder', subject['id'])
        if not folder.is_dir():
            continue
        for path in sorted(folder.rglob('*')):
            if path.suffix.lower() != '.pdf':
                continue
            source = 'carewell' if any(p.lower() == 'carewell' for p in path.relative_to(folder).parts) else 'imperfect'
            match = re.match(r'Unit[ _-]*(\d+)\b', path.stem, flags=re.I)
            base = {'semester': args.semester, 'subject': subject['id'], 'provider': source}
            if match:
                unit = int(match[1])
                if unit not in {u['number'] for u in subject['units']}:
                    raise ValueError(f'Add Unit {unit} to {subject["id"]} in the catalog first.')
                slug = f'unit-{unit}'
                base.update(kind='unit', unit=unit, title=f'Unit {unit}')
            else:
                title = path.stem.split(' - ')[0].strip()
                slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
                base.update(kind='revision', title=title)
            base['id'] = f's{args.semester}-{subject["id"]}-{source}-{slug}'
            if base['id'] in claimed_ids:
                raise ValueError(f'Two files map to the same resource: {base["id"]}. Keep one intended file per unit and provider.')
            claimed_ids.add(base['id'])
            add(path, base, f'pdfs/semester-{args.semester}/{subject["id"]}/{source}/{slug}.pdf')
            matched.add(path.resolve())
    syllabus = args.source / 'Syllabus_B_Pharm.pdf'
    if syllabus.is_file():
        add(syllabus, {'id':'bpharma-syllabus','kind':'syllabus','title':'BPharma syllabus','semester':args.semester}, 'pdfs/bpharma-syllabus.pdf')
        matched.add(syllabus.resolve())
    unknown = [p for p in args.source.rglob('*') if p.suffix.lower() == '.pdf' and p.resolve() not in matched]
    data['resources'] = sorted(resources.values(), key=lambda r: r['id'])
    CATALOG.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    print(f'{imported} PDFs copied; {skipped} unchanged PDFs skipped. {len(data["resources"])} catalog entries.')
    for path in unknown:
        print(f'Not imported (no matching subject folder): {path.relative_to(args.source)}')
    # Do not delete old assets automatically: they may have incoming links.

if __name__ == '__main__':
    main()
