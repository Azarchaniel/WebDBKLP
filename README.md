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
- Auto-fill book details from ISBN via GoodReads and DatabazeKnih scraper.
- Multi-select rows for bulk editing.
- Expandable row detail panels.
- PWA with offline IndexDB.

## RUN
cd ./server; npm run start
cd ./client; npx run start

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
