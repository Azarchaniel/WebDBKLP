"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const controllers_2 = require("../controllers");
const controllers_3 = require("../controllers");
const controllers_4 = require("../controllers");
const controllers_5 = require("../controllers");
const router = (0, express_1.Router)();
// ### BOOKS ###
router.get('/book/:id', controllers_1.getBook);
router.get('/books', controllers_1.getAllBooks);
router.post('/add-book', controllers_1.addBook);
router.put('/edit-book/:id', controllers_1.updateBook);
router.post('/delete-book/:id', controllers_1.deleteBook);
router.get('/get-book-info/:isbn', controllers_1.getInfoFromISBN);
// ### AUTORS ###
router.get('/autor/:id', controllers_2.getAutor);
router.get('/autors', controllers_2.getAllAutors);
router.post('/add-autor', controllers_2.addAutor);
router.put('/edit-autor/:id', controllers_2.updateAutor);
router.post('/delete-autor/:id', controllers_2.deleteAutor);
// ### QUOTES ###
router.get('/quote/:id', controllers_3.getQuote);
router.get('/quotes', controllers_3.getAllQuotes);
router.post('/add-quote', controllers_3.addQuote);
router.post('/delete-quote/:id', controllers_3.deleteQuote);
// ### USERS ###
router.get('/user/:id', controllers_4.getUser);
router.get('/users', controllers_4.getAllUsers);
// ### LP ###
router.get('/lp/:id', controllers_5.getLp);
router.get('/lps', controllers_5.getAllLps);
router.post('/add-lp', controllers_5.addLp);
router.post('/delete-lp/:id', controllers_5.deleteLp);
router.get('/webScrapper');
router.get('/count-books/:id', controllers_1.dashboard.countBooks);
router.get('/get-dimensions-statistics', controllers_1.dashboard.getDimensionsStatistics);
router.get('/get-language-statistics', controllers_1.dashboard.getLanguageStatistics);
router.get('/get-size-groups', controllers_1.dashboard.getSizesGroups);
router.get('/get-read-by', controllers_1.dashboard.getReadBy);
exports.default = router;
