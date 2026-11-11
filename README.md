# WebDBKLP

A personal collection management system for cataloging books, vinyl LPs, board games, quotes, and authors. Successor to [DBKLP](https://github.com/Azarchaniel/DBKLP).

Built with the **MERN stack** (MongoDB · Express · React · Node.js) and **TypeScript** on both frontend and backend.

## Features

### Collections
- **Books** — full metadata: title, subtitle, authors/editors/translators/illustrators, ISBN, language, publisher, year, dimensions (height, width, thickness, weight), number of pages, series, edition, location (city/shelf), cover image, GoodReads & DatabazeKnih links, ex-libris flag, owner and read-by tracking.
- **Authors** — first/last name, nationality, birth/death dates, roles (author, editor, illustrator, translator, musician, board game designer), linked books and LPs.
- **LPs (vinyl records)** — title, artist, subtitle, speed, track count, publisher, language.
- **Board Games** — title, designer, publisher, player count, play time, age recommendation, cover image, URL, expansions/parent-game hierarchy.
- **Quotes** — rich-text or image quotes linked to books, page number, owner assignment.

### Core functionality
- Server-side paginated tables with sorting, filtering and column visibility toggle for all collections.
- Full-text search across all major fields (diacritic-insensitive).
- Add / edit / delete via modal forms with live validation.
- Barcode scanner (ISBN lookup via camera) for quick book entry.
- Experimental live barcode + book width/height scanning in the single-book add/edit form (ruler button on the left of the form footer).
- Auto-fill book details from ISBN via GoodReads and DatabazeKnih scraper.
- Multi-select rows for bulk editing.
- Expandable row detail panels.
- PWA with offline IndexedDB.

## RUN
cd ./server; npm run start
cd ./client; npx run start

## Camera book measurement (experimental)

On a frozen snapshot, drag the green corner circles to adjust the detected book outline and recalculate dimensions. Drag orange corner circles to edit a manually selected barcode quadrilateral, then search the updated selection again. Editing the barcode area clears the previous decoded result until the new selection is scanned.

1. Print [the measurement mat](client/public/book-measurement-mat.svg) **in black and white on A4 at 100% actual size**, with no fit-to-page scaling. Use the graduated ruler at the bottom to verify the printed scale (centimeter numbers, 5 mm medium ticks and 1 mm short ticks).
   Use the current high-contrast grid for white/light covers; the earlier faint gray grid may not provide enough contrast and should be reprinted. The corner marker design and physical scale are unchanged.
2. Open the ruler scanner on the left of the single-book form footer. Printing instructions and the mat download are available under the **i** icon in the scanner's upper-right corner. Allow camera access (HTTPS or localhost required), keep the camera approximately perpendicular to the mat, and keep all four coded black-and-white squares fully visible and uncovered.
3. Capture the **empty** mat as background. The button requests the next valid camera frame; wait for the background-ready prompt before placing a book. Brief marker loss does not discard a pending capture or an already captured background, and language changes do not restart the camera. Place one contrasting book barcode-side up entirely inside the dashed border (174 x 261 mm usable area). Remove hands and other objects; use diffuse, steady lighting.
4. Press **Capture and analyze**. The scanner freezes one image and reads both the barcode and dimensions from that same snapshot, without waiting for stable video frames. Check the frozen preview and green outline, then confirm. If automatic barcode detection fails, choose **Mark barcode area**, click its four corners clockwise on the image, and search the selected quadrilateral. Results remain available until you confirm, return to the camera or recapture the background. If detection fails, return to the camera, adjust the scene and capture again. Width and height are converted from millimeters to the form's centimeters. Existing thickness and weight are preserved. The original barcode-only scanner and search-page scanner are unchanged.

Processing is local in the browser using the existing ZXing dependency, coded black-and-white fiducials, perspective rectification, background subtraction and a minimum-area rectangle. Marker IDs use a black border and distinct 3 x 3 interior patterns; color printing is not needed. Markers are detected afresh on each photograph using local brightness thresholds, without restricting them to their calibration positions. The camera may move between photographs as long as the mat and all four markers remain visible; perspective rectification aligns each image to the same physical grid. Small exposure changes are compensated using the exposed paper and printed black corners. Light covers are detected from low-contrast differences and the grid they hide; an adaptive noise threshold and enclosed-region filling avoid requiring a dark, solid silhouette. Ambiguous/missing markers, clipped objects, multiple substantial objects or low rectangular coverage in the snapshot block confirmation. Recapture the empty background after substantial lighting changes. This requires the new monochrome mat, not the original unmarked black grid or the earlier colored-marker version.

Enter the lens-to-mat distance and book thickness in centimeters to compensate for the cover being closer to the camera. Dimensions are multiplied by `(distance - thickness) / distance`, assuming parallel mat/cover planes and a roughly perpendicular camera. The initial distance is 30 cm; thickness defaults to zero (no correction). Set the measured values for each capture; editing them also updates a frozen result without accumulating corrections. These inputs do not change the book form's thickness field.

Measurements are **approximate**, not a calibrated accuracy guarantee. Shadows, white or transparent covers, reflections, curved covers, lens distortion and the height difference between the cover and mat can introduce error or prevent detection. The shorter edge is assigned to width and the longer to height; swap them manually for landscape books. Thickness and weight cannot be inferred from this view. A real camera/printed-mat check is required before relying on the results; synthetic image tests do not establish physical accuracy.

Reference books for the camera tests (dimensions in cm, measured manually):

| Photo | Height | Width | Thickness | ISBN |
|---|---:|---:|---:|---|
| light.jpg | 20.6 | 14.4 | 0.8 | 9788024723365 |
| black.jpg | 15.8 | 11.0 | 2.2 | 9788074590924 |
| atyp.jpg | 13.0 | 13.0 | 2.2 | 9788088299646 |
| white.jpg | 17.9 | 10.6 | 1.6 | 9788074070655 |

These values are centralized in the measurement tests. The empty-mat reference is `client/src/__tests__/empty.jpg`; the capture height is 30 cm. JPEG tests verify marker and ISBN detection, and the empty image correctly produces no measurement. Four end-to-end dimension regressions compare real book photos against that reference, apply each book's thickness correction, and require each dimension to be within 3 mm of its manually measured value. These four tests currently fail at outline detection and are explicitly marked TODO: the exposure/grid-noise threshold rejects the real covers. They are not evidence of verified physical measurement accuracy. Synthetic geometry and measurement tests remain separate.

## Localhost Test Database

Backend localhost config is in [server/nodemon.json](server/nodemon.json).

- `MONGO_DB`: primary database name.
- `MONGO_DB_LOCAL`: mirror database used for localhost.
- `USE_LOCAL_DB_MIRROR`: when `true`, localhost uses `MONGO_DB_LOCAL`.

Current config is set to use `WebDBKLP-test` on localhost.

To refresh mirror data from primary DB, run:

```bash
cd ./server
npm run cloneDb
```

Optional overrides for one-time copy:

```bash
# PowerShell
$env:MONGO_DB_SOURCE="WebDBKLP"; $env:MONGO_DB_TARGET="WebDBKLP-test"; npm run cloneDb

# bash/zsh
MONGO_DB_SOURCE=WebDBKLP MONGO_DB_TARGET=WebDBKLP-test npm run cloneDb
```

### Known problems and how to fix it

`SyntaxError: Unexpected token '??='`
Use Node newer than v15 (`nvm use 18.2.0`)

`tsc command not found`
Reinstall TS (`npm install typescript -g`)

`Error: listen EADDRINUSE: address already in use :::4000`
Kill everything running on ports 3000 and 4000:
`3000,4000 | ForEach-Object { Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue } | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }`