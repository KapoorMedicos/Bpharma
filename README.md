# BPharma Library

A static study library for **Kapoor Medicos**, built with HTML, CSS, and vanilla JavaScript. No install, build step, API keys, or backend. The site runs from `docs/` on GitHub Pages, including under the `/Bpharma/` project path.

## What is included

- All eight BPharma semester subject lists, with notes for Semesters I–VI.
- 145 original Imperfect Pharmacy unit PDFs, five Carewell Industrial Pharmacy unit PDFs, one Carewell revision PDF, and the syllabus: **152 note/syllabus PDFs**.
- **362 unique PTU question papers**, covering every semester, with session menus and subject buttons that update together.

| Semester | Notes and revision PDFs | PYQs |
| --- | ---: | ---: |
| I | 20 | 38 |
| II | 20 | 60 |
| III | 25 | 56 |
| IV | 25 | 49 |
| V | 31 | 44 |
| VI | 30 | 50 |
| VII | 0 | 27 |
| VIII | 0 | 38 |

Imperfect Pharmacy marks Communication Skills, Remedial Biology, Remedial Mathematics, Computer Applications in Pharmacy, Environmental Sciences, and all Semester VII/VIII notes as **Available Soon**, checked 31 October 2026. Their unit pages show the source availability. Semester VII has source lecture links. Question papers are available separately even where notes are pending.

The PTUStudy papers match the library's current subject lists. Semester II also retains 14 papers from older subjects in the original FirstRanker collection. Eight current-subject Semester II copies were merged after comparing full extracted text and page counts; four have conflicting source session labels (FirstRanker's March 2020 and PTUStudy's November 2019), explained in their readers. Nine Semester V copies were similarly merged during its original import. Existing reader IDs and PDF paths are retained for bookmarked links.

The November 2026 update adds **200 PTU BPharm papers** from Chandigarh College of Pharmacy's [PTU archive](https://www.ccpmohali.org/qp-syllabus/): 72 dated 2023, 72 dated 2024, and 56 dated 2025. Both spring/summer and winter collections are represented. Printed exam dates determine session labels, including June and January where the source bundle name differs. Three 2023 scans have unclear day/month headers and are labelled separately. The audit is `docs/data/ccp-pyq-audit.json`. Six repeated scans and three papers already hosted from PTUStudy were merged. PharmD papers, other universities, and subjects outside the existing syllabus were excluded. Not every semester/session combination is available online.

Two-page spreads were rotated and separated into reading pages with continuation scans retained. JPEG optimization was verified to preserve decoded pixels. Five existing note PDFs were also optimized losslessly to keep the site below a conservative 1,000,000,000-byte budget; their original hashes and verification details are in `docs/data/storage-optimization.json`.

The library contains **514 PDFs** in total. Assets are checked by SHA-256 to avoid duplicate binaries. The published folder is about 947 MiB, below GitHub Pages' 1 GB limit; the largest PDF is about 51 MB, so use Git rather than GitHub's browser uploader.

Features include subject/topic search, provider filters, a PDF.js reader with page navigation and zoom, a prominent button opening the original PDF in a new tab, downloads, and source-provided lecture links. No video links are guessed. Carewell PDFs have no video links. Layouts support mobile and desktop screens and keyboard navigation.

Availability and provenance are recorded in `docs/data/imperfect-availability.json` , `docs/data/ptustudy-availability.json`, and `docs/data/ccp-pyq-audit.json`. Only actual downloaded PDFs have reader links; pending notes are clearly labelled.

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
node tests/check_pyq_filters.js
# Optional PDF structure verification, requires pypdf:
python3 tests/check_ccp_pdfs.py
```

The Python checks verify catalog references, valid PDF files and hashes, missing/orphan assets, duplicates, relative project paths, and GitHub’s per-file size limit. Browser checks should cover semester navigation, topic search, filters, source tabs, PDF loading, and a narrow mobile layout. PYQ checks should also cover subject/code search and available exam sessions, session-dependent subject buttons, and retained filters after returning from a PDF.

## Files

- `docs/index.html` — static entry page
- `docs/assets/` — styles, interface logic, and favicon
- `docs/data/library.json` — library catalog
- `docs/pdfs/` — hosted PDF assets
- `scripts/import-notes.py` — repeatable import
- `tests/check_site.py` — collection integrity checks

The reader vendors Mozilla PDF.js 5.6.205 under Apache-2.0; its license and version are included in `docs/assets/pdfjs/`. The canvas preview displays one page at a time; use the original PDF for text selection, searching, or assistive reading.

Notes remain credited to Imperfect Pharmacy and Carewell Pharma; question papers are attributed to their universities and source archives. No license or permission to redistribute their content is granted by this repository.
