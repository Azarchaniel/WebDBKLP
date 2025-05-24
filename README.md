# WebDBKLP

**System for cataloging books** (and LPs and board games) I own. Predecessor for this system is https://github.com/Azarchaniel/DBKLP.
I'm using **MERN stack**.

## RUN
cd ./server; npm run start
cd ./client; npx run start

### TODO
- [ ] better granulating - what is possible, move to components
- [ ] in BookTable, when clicking on property, filter the value of property
- [ ] (in far future) localization 
- [ ] allow user to add tags - "fantasy", "read2012"

### Known problems and how to fix it

`SyntaxError: Unexpected token '??='`
Use Node newer than v15 (`nvm use 18.2.0`)

`tsc command not found`
Reinstall TS (`npm install typescript -g`)
