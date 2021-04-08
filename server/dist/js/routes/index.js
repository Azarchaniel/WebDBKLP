"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const books_1 = require("../controllers/books");
const autors_1 = require("../controllers/autors");
const router = express_1.Router();
// ### BOOKS ###
router.get('/book/:id', books_1.getBook);
router.get('/books', books_1.getAllBooks);
router.post('/add-book', books_1.addBook);
router.put('/edit-book/:id', books_1.updateBook);
router.delete('/delete-book/:id', books_1.deleteBook);
// ### AUTORS ###
router.get('/autor/:id', autors_1.getAutor);
router.get('/autors', autors_1.getAllAutors);
router.post('/add-autor', autors_1.addAutor);
router.put('/edit-autor/:id', autors_1.updateAutor);
router.delete('/delete-autor/:id', autors_1.deleteAutor);
exports.default = router;
