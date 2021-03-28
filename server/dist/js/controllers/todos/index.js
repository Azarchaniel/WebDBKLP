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
exports.deleteBook = exports.updateBook = exports.addBook = exports.getAllBooks = void 0;
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
const addBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const todo = new book_1.default({
            title: body.title,
            description: body.description,
            status: body.status,
        });
        const newTodo = yield todo.save();
        const allTodos = yield book_1.default.find();
        res.status(201).json({ message: 'Todo added', book: newTodo, books: allTodos });
    }
    catch (error) {
        console.error('Cannot add book');
        throw error;
    }
});
exports.addBook = addBook;
const updateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const updateTodo = yield book_1.default.findByIdAndUpdate({ _id: id }, body);
        const allTodos = yield book_1.default.find();
        res.status(200).json({
            message: 'Book updated',
            book: updateTodo,
            books: allTodos,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.updateBook = updateBook;
const deleteBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedTodo = yield book_1.default.findByIdAndRemove(req.params.id);
        const allTodos = yield book_1.default.find();
        res.status(200).json({
            message: 'Book deleted',
            book: deletedTodo,
            books: allTodos,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.deleteBook = deleteBook;
