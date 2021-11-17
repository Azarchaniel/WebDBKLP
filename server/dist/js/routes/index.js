"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const books_1 = require("../controllers/books");
const autors_1 = require("../controllers/autors");
const quotes_1 = require("../controllers/quotes");
const router = (0, express_1.Router)();
// ### BOOKS ###
router.get('/book/:id', books_1.getBook);
router.get('/books', books_1.getAllBooks);
router.post('/add-book', books_1.addBook);
router.put('/edit-book/:id', books_1.updateBook);
router.post('/delete-book/:id', books_1.deleteBook);
// ### AUTORS ###
router.get('/autor/:id', autors_1.getAutor);
router.get('/autors', autors_1.getAllAutors);
router.post('/add-autor', autors_1.addAutor);
router.put('/edit-autor/:id', autors_1.updateAutor);
router.post('/delete-autor/:id', autors_1.deleteAutor);
// ### QUOTES ###
router.get('/quote/:id', quotes_1.getQuote);
router.get('/quotes', quotes_1.getAllQuotes);
router.post('/add-quote', quotes_1.addQuote);
router.put('/edit-quote/:id', quotes_1.updateQuote);
router.post('/delete-quote/:id', quotes_1.deleteQuote);
exports.default = router;
