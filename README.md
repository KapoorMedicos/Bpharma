# BPharma Library

A static study library for **Kapoor Medicos**, built with HTML, CSS, and vanilla JavaScript. No install, build step, API keys, or backend. The site runs from `docs/` on GitHub Pages, including under the `/Bpharma/` project path.

## What is included

- All eight BPharma semesters and their subject lists. Semester V currently contains the notes.
- 25 original Imperfect Pharmacy unit PDFs, five Carewell Industrial Pharmacy unit PDFs, a Carewell two-mark revision PDF, and the BPharma syllabus: **32 note/syllabus PDFs**.
- A PYQ tab for the 22 papers linked on FirstRanker’s PTU Semester II page: March and December 2020, including older-syllabus subjects. Search by subject or paper code and filter by semester and exam session.
- Semester V adds only nine matching current-syllabus papers: five from December 2020 and four from March 2020. The source has no March Medicinal Chemistry II paper. Older Semester V subjects are excluded.
- Search subjects and unit topics; filter notes by provider.
- Self-contained PDF.js reader with page-number navigation and zoom, direct opening, and downloads.
- Imperfect Pharmacy subject lecture playlists next to the unit notes. These are subject playlists, not guessed unit-specific video links. Carewell PDFs have no video links.
- Responsive layouts and keyboard-accessible controls.

Together with 31 downloaded PTU question papers, the library contains **63 PDFs**. The largest PDF is about 51 MB; use Git rather than GitHub’s browser file uploader.

## Preview locally

From this repository folder:

```sh
python3 -m http.server 8765 --directory docs
```

Open <http://localhost:8765>. Stop the preview with Control-C. Opening `index.html` directly cannot load the JSON catalog in most browsers.

## Publish to GitHub

The remote is `https://github.com/KapoorMedicos/Bpharma.git`. From the prepared checkout:

```sh
cd /Users/dilgunnu/Coding/Github/Genera/Bpharma
git add docs scripts tests README.md .gitignore
git commit -m "Create static BPharma study library"
git push -u origin main
```

If the changes already have a local commit, only the `git push` command is needed. Authenticate with your GitHub account when Git asks; GitHub does not accept the account password for Git HTTPS pushes.

Then open the repository’s **Settings → Pages**:

1. Under **Build and deployment**, choose **Deploy from a branch**.
2. Set the branch to **main** and the folder to **/docs**.
3. Click **Save**.
4. Wait for GitHub to show a successful deployment and the **Visit site** link.

Expected address: <https://kapoormedicos.github.io/Bpharma/>. It is live only after a successful Pages deployment. Hash routes allow subjects and PDF readers to be bookmarked without a custom server or 404 routing rules. `docs/.nojekyll` tells Pages to serve the static files directly.

GitHub’s instructions: [Configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [Git file size limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

### Publication review

The Carewell PDFs are captured app pages and contain the account’s visible phone-number watermark. Review those PDFs before making them public. Keeping a repository private does not necessarily make its GitHub Pages site private. The complete collection, including those watermarks, was approved for public publication by the repository owner.

## Add or update notes

The catalog is `docs/data/library.json`. Each subject has a stable `id`, semester, folder name, and unit headings. The separate `pyqs` array stores question papers with university, semester, exam session, paper code, and source links. Resources contain relative asset paths, provider, page count when available, byte size, and SHA-256 hash.

To update the current collection:

```sh
python3 scripts/import-notes.py \
  --source /Users/dilgunnu/Documents/BPharma_Sem_V \
  --semester 5
python3 tests/check_site.py
```

The importer only needs Python 3. It keeps existing page counts and can calculate new ones if optional `pypdf` is installed. It skips unchanged content and reuses an existing asset when the SHA-256 matches. It never alters the original Documents folder or silently deletes old PDFs.

Folder convention:

```text
<source folder>/
  Industrial-Pharmacy/
    Unit 1 - Industrial Pharmacy I.pdf         # Imperfect Pharmacy
    Carewell/
      Unit 1 - Industrial Pharmacy I.pdf       # Carewell Pharma
      Revision/
        2 Marks - Industrial Pharmacy I.pdf
```

Set each subject’s `folder` field to match its folder name. Files under `Carewell/` use that provider; other PDFs use Imperfect Pharmacy. Unit filenames must start with `Unit 1`, `Unit 2`, etc. Other names become revision resources. Import a given collection from one source folder so each unit/provider has one intended file.

For another semester, add its unit headings and local folder names to the existing subject entries, then run the importer with the appropriate `--semester`. Add `playlist` and `source` URLs only when verified. The interface reads the catalog automatically.

After changes:

```sh
git add docs
git commit -m "Update pharmacy notes"
git push
```

## Checks

```sh
python3 tests/check_site.py
node --check docs/assets/app.js
```

The Python checks verify catalog references, valid PDF files and hashes, missing/orphan assets, duplicates, relative project paths, and GitHub’s per-file size limit. Browser checks should cover semester navigation, topic search, filters, source tabs, PDF loading, and a narrow mobile layout. PYQ checks should also cover subject/code search and the March/December session filters.

## Files

- `docs/index.html` — static entry page
- `docs/assets/` — styles, interface logic, and favicon
- `docs/data/library.json` — library catalog
- `docs/pdfs/` — hosted PDF assets
- `scripts/import-notes.py` — repeatable import
- `tests/check_site.py` — collection integrity checks

The reader vendors Mozilla PDF.js 5.6.205 under Apache-2.0; its license and version are included in `docs/assets/pdfjs/`. The canvas preview displays one page at a time; use the original PDF for text selection, searching, or assistive reading.

Notes remain credited to Imperfect Pharmacy and Carewell Pharma. No license or permission to redistribute their content is granted by this repository.
