# WebDBKLP

**System for cataloging books** (and LPs and board games) I own. Predecessor for this system is https://github.com/Azarchaniel/DBKLP.
I'm using **MERN stack**.

## RUN
cd ./server; npm run start
cd ./client; npx run start

### TODO
- [ ] lagging in autors
- [X] pagination in Select
- [X] cache first page of books
- [X] responsivity
- [ ] divide CSS into chunks based on page
- [ ] better granulating - what is possible, move to components
- [ ] in BookTable, when clicking on property, filter the value of property
- [X] rework Autocomplete - custom - if there is no item found, parse the string and create item
- [ ] (in far future) localization 
- [ ] allow user to add tags - "fantasy", "read2012"
- [X] connect to devices camera and read the bar code to get ISBN
- [ ] allow to pick search column and filtering - send as a JSON to BE

### Known problems and how to fix it

`SyntaxError: Unexpected token '??='`
Use Node newer than v15 (`nvm use 18.2.0`)

`tsc command not found`
Reinstall TS (`npm install typescript -g`)
