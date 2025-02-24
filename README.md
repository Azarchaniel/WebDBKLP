# WebDBKLP

**System for cataloging books** (and LPs and board games) I own. Predecessor for this system is https://github.com/Azarchaniel/DBKLP.
I'm using **MERN stack**.

## RUN
cd ./server; npm run start
cd ./client; npx run start

### TODO
- [X] unify modals
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
- [X] ConfirmAlert -> Modal
- [X] add ESLint
- [X] add Role to Autor and filter by it (autor, musician, editor, translator) (multirole - Translator and Autor)
- [ ] divide CSS into chunks based on page
- [ ] better granulating - what is possible, move to components
- [X] updating book - fix modal AddBook (MVP)
- [ ] in BookDetail, when clicking on Edice/Serie, filter every book from Edice/Serie
- -[ ] but this requires to have Edice/Serie as entry in DB with ID
- -[ ] which require CRUD form Edice/Serie
- -[ ] I need it in DB for MultiSelect anyway
- [ ] remove bootstrap (bootstrap is used in modals)
- [X] a href to DatabazeKnih and GoodReads
- [X] get pagination, number of entities per page etc. from backend (faster than get all and then sort it on frontend) (MVP) https://medium.com/@kannankannan18/client-side-pagination-vs-server-side-pagination-576a8f57257d
- - [ ] lazy loading quotes https://medium.com/@iamusamasattar/how-to-implement-scroll-pagination-in-mern-application-f253f170754f
- [X] fix router not fetching data when changing Owner - I need global store for ActiveUser (MVP)
- [ ] rework Autocomplete - custom - if there is no item found, parse the string and create item
- [X] custom modal - grid system
- [X] webscrapper and autofilling (MVP)
- [X] some reports, numbers, graph on Main page
- [X] import books from DBKLP (MVP)
- -[X] write script, that will get ID of every author
- [ ] (in far future) localization
- [ ] (in far future) authorization/authentication
- - [ ] add comments
- - [ ] allow adding comments that is visible only for creator
- [X] WYSWIG editor for Quotes (with pictures)
- [ ] generalize CRUD - first parameter is DB entity name, then ID, then requested params. In Error specify, what is missing in model. 
- [X] too many !importants in index.scss
- [ ] allow user to add tags - "fantasy", "read2012"
- [ ] connect to devices camera and read the bar code to get ISBN
- [X] check and fix requirments in models and types (MVP)
- [ ] allow to pick search column - send as a JSON to BE

(MVP) - Minimum Viable Product

### Known problems and how to fix it

`SyntaxError: Unexpected token '??='`
Use Node newer than v15 (`nvm use 18.2.0`)

`tsc command not found`
Reinstall TS (`npm install typescript -g`)
