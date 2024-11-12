### Work in progress
# WebDBKLP

Nothing to be shown yet. 
Once done it will be a **system for cataloging books** I own. Predecessor for this system is https://github.com/Azarchaniel/DBKLP.
I'm using **MERN stack**.

## RUN
cd ./server; npm run start
cd ./client; npx run start

### TODO
- [ ] unify modals
- [X] redesign
- [X] side menu
- [X] adding / updating item
- [X] Autocomplete
- [X] allow multichoice
- [X] soft delete
- [X] CRUD for Quotes
- [X] add Owner
- [X] proper pages and router
- -[X] implement table library (https://material-table.com/#/)
- [X] clean form after saving item
- [X] create all models and interfaces
- [X] there is problem with fetchAll in Quotes when deleting
- [ ] divide CSS into chunks based on page
- [ ] better granulating - what is possible, move to components
- [ ] updating book - fix modal AddBook (MVP)
- [ ] in BookDetail, when clicking on Edice/Serie, filter every book from Edice/Serie
- -[ ] but this requires to have Edice/Serie as entry in DB with ID
- -[ ] which require CRUD form Edice/Serie
- -[ ] I need it in DB for MultiSelect anyway
- [ ] remove bootstrap (bootstrap is used in modals)
- [X] a href to DatabazeKnih and GoodReads
- [ ] get pagination, number of entities per page etc. from backend (faster than get all and then sort it on frontend) (MVP)
- [ ] fix router not fetching data when changing Owner - I need global store for ActiveUser (MVP)
- [ ] rework Autocomplete - custom
- [X] custom modal - grid system
- [ ] webscrapper and autofilling (MVP)
- [ ] some reports, numbers, graph on Main page
- [ ] import books from DBKLP (MVP)
- -[ ] write script, that will get ID of every author
- [ ] (in far future) localization
- [ ] (in far future) authorization/authentication
- - [ ] add comments
- - [ ] allow adding comments that is visible only for creator
- [ ] WYSWIG editor for Quotes (with pictures)
- [ ] generalize CRUD - first parameter is DB entity name, then ID, then requested params. In Error specify, what is missing in model. 
- [ ] too many !importants in index.scss
- [ ] translations
- [ ] allow user to add tags - "fantasy", "read2012"

(MVP) - Minimum Viable Product

### Known problems and how to fix it

`SyntaxError: Unexpected token '??='`
Use Node newer than v15 (`nvm use 18.2.0`)

`tsc command not found`
Reinstall TS (`npm install typescript -g`)