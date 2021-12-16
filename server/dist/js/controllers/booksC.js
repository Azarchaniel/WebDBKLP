"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBook = exports.deleteBook = exports.updateBook = exports.addBook = exports.getAllBooks = void 0;
const book_1 = __importDefault(require("../models/book"));
const getAllBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //remember: when populating, and NameOfField != Model, define it with {}
        //todo: populate also editor, translator...
        const books = yield book_1.default
            .find()
            .populate([
            { path: 'autor', model: 'Autor' },
            { path: 'owner', model: 'User' },
            { path: 'readBy', model: 'User' }
        ])
            .exec();
        res.status(200).json({ books: books });
    }
    catch (error) {
        throw error;
    }
});
exports.getAllBooks = getAllBooks;
const getBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const book = yield book_1.default
            .findById(req.params.id)
            .populate([
            { path: 'autor', model: 'Autor' },
            { path: 'owner', model: 'User' },
            { path: 'readBy', model: 'User' }
        ])
            .exec();
        const allBooks = yield book_1.default.find().populate([
            { path: 'autor', model: 'Autor' },
            { path: 'owner', model: 'User' },
            { path: 'readBy', model: 'User' }
        ]).exec();
        res.status(200).json({ book: book, books: allBooks });
    }
    catch (err) {
        throw err;
    }
});
exports.getBook = getBook;
const addBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        //todo: there has to be a better way for cleaner code
        const { title, subtitle, ISBN, language, note, numberOfPages, published, autor, owner, exLibris, readBy, location } = req.body;
        console.trace(req.body);
        const book = new book_1.default({
            autor: autor,
            title: title,
            subtitle: subtitle,
            ISBN: ISBN,
            language: language,
            note: note,
            numberOfPages: numberOfPages,
            published: {
                publisher: published === null || published === void 0 ? void 0 : published.publisher,
                year: (_a = published === null || published === void 0 ? void 0 : published.year) !== null && _a !== void 0 ? _a : undefined,
                country: (_b = published === null || published === void 0 ? void 0 : published.country) !== null && _b !== void 0 ? _b : ''
            },
            location: {
                city: location === null || location === void 0 ? void 0 : location.city,
                shelf: location === null || location === void 0 ? void 0 : location.shelf,
            },
            owner: owner,
            exLibris: exLibris,
            readBy: readBy
        });
        const newBook = yield book.save();
        const allBooks = yield book_1.default.find().populate([
            { path: 'autor', model: 'Autor' },
            { path: 'owner', model: 'User' },
            { path: 'readBy', model: 'User' }
        ]).exec();
        res.status(201).json({ message: 'Book added', book: newBook, books: allBooks });
    }
    catch (error) {
        throw error;
    }
});
exports.addBook = addBook;
const updateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const updateBook = yield book_1.default.findByIdAndUpdate({ _id: id }, body);
        const allBooks = yield book_1.default.find().populate([
            { path: 'autor', model: 'Autor' },
            { path: 'owner', model: 'User' },
            { path: 'readBy', model: 'User' }
        ]).exec();
        res.status(200).json({
            message: 'Book updated',
            book: updateBook,
            books: allBooks,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.updateBook = updateBook;
const deleteBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const deletedBook = yield book_1.default.findByIdAndUpdate({ _id: id }, Object.assign(Object.assign({}, body), { isDeleted: true }));
        const allBooks = yield book_1.default.find().populate([
            { path: 'autor', model: 'Autor' },
            { path: 'owner', model: 'User' },
            { path: 'readBy', model: 'User' }
        ]).exec();
        res.status(200).json({
            message: 'Book deleted',
            book: deletedBook,
            books: allBooks,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.deleteBook = deleteBook;
