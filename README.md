# WebDBKLP

**System for cataloging books** (and LPs and board games) I own. Predecessor for this system is https://github.com/Azarchaniel/DBKLP.
I'm using **MERN stack**.

## RUN
cd ./server; npm run start
cd ./client; npx run start

### TODO
- [ ] divide CSS into chunks based on page
- [ ] better granulating - what is possible, move to components
- [ ] in BookDetail, when clicking on Edice/Serie, filter every book from Edice/Serie
- - [ ] but this requires to have Edice/Serie as entry in DB with ID
- - [ ] which require CRUD form Edice/Serie
- - [ ] I need it in DB for MultiSelect anyway
- [ ] remove bootstrap (bootstrap is used in modals)
- [ ] lazy loading quotes https://medium.com/@iamusamasattar/how-to-implement-scroll-pagination-in-mern-application-f253f170754f
- [ ] rework Autocomplete - custom - if there is no item found, parse the string and create item
- [ ] (in far future) localization
- [ ] (in far future) authorization/authentication
- - [ ] add comments
- - [ ] allow adding comments that is visible only for creator
- [ ] generalize CRUD - first parameter is DB entity name, then ID, then requested params. In Error specify, what is missing in model. 
- [ ] allow user to add tags - "fantasy", "read2012"
- [ ] connect to devices camera and read the bar code to get ISBN
- [ ] allow to pick search column - send as a JSON to BE

### Known problems and how to fix it

`SyntaxError: Unexpected token '??='`
Use Node newer than v15 (`nvm use 18.2.0`)

`tsc command not found`
Reinstall TS (`npm install typescript -g`)
