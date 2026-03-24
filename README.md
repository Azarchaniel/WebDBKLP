# WebDBKLP

**System for cataloging books** (and LPs and board games) I own. Predecessor for this system is https://github.com/Azarchaniel/DBKLP.
I'm using **MERN stack**.

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
