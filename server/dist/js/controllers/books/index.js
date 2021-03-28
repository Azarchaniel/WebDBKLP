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
const book_1 = __importDefault(require("../../models/book"));
const getAllBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const books = yield book_1.default.find();
        res.status(200).json({ books: books });
    }
    catch (error) {
        throw error;
    }
});
exports.getAllBooks = getAllBooks;
const getBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const book = yield book_1.default.findById(req.params.id);
        const allBooks = yield book_1.default.find();
        res.status(200).json({ book: book, books: allBooks });
    }
    catch (err) {
        throw err;
    }
});
exports.getBook = getBook;
const addBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const body = req.body;
        const book = new book_1.default({
            title: body.title,
            subtitle: body.subtitle,
            ISBN: body.ISBN,
            language: body.language,
            note: body.note,
            numberOfPages: body.numberOfPages,
            published: {
                publisher: (_a = body.published) === null || _a === void 0 ? void 0 : _a.publisher,
                year: (_c = (_b = body.published) === null || _b === void 0 ? void 0 : _b.year) !== null && _c !== void 0 ? _c : undefined,
                country: (_e = (_d = body.published) === null || _d === void 0 ? void 0 : _d.country) !== null && _e !== void 0 ? _e : ''
            },
        });
        const newBook = yield book.save();
        const allBooks = yield book_1.default.find();
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
        const allBooks = yield book_1.default.find();
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
        const deletedBook = yield book_1.default.findByIdAndRemove(req.params.id);
        const allBooks = yield book_1.default.find();
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
