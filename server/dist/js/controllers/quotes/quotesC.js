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
exports.deleteQuote = exports.updateQuote = exports.addQuote = exports.getQuote = exports.getAllQuotes = void 0;
const quote_1 = __importDefault(require("../../models/quote"));
const getAllQuotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quotes = yield quote_1.default.find().populate('books').exec();
        res.status(200).json({ quotes: quotes });
    }
    catch (error) {
        res.status(400);
        throw error;
    }
});
exports.getAllQuotes = getAllQuotes;
const getQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quote = yield quote_1.default.findById(req.params.id).populate('book').exec();
        const allQuotes = yield quote_1.default.find().populate('book').exec();
        //todo: do I need allQuotes and allAuthors...?
        res.status(200).json({ quote: quote, quotes: allQuotes });
    }
    catch (err) {
        throw err;
    }
});
exports.getQuote = getQuote;
const addQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, fromBook, isDeleted } = req.body;
    try {
        const quote = new quote_1.default({
            text: text,
            fromBook: fromBook[0],
            isDeleted: isDeleted
        });
        const newQuote = yield quote.save();
        const allQuotes = yield quote_1.default.find();
        res.status(201).json({ message: 'Quote added', quote: newQuote, quotes: allQuotes });
    }
    catch (error) {
        throw error;
    }
});
exports.addQuote = addQuote;
const updateQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const updateQuote = yield quote_1.default.findByIdAndUpdate({ _id: id }, body);
        const allQuotes = yield quote_1.default.find();
        res.status(200).json({
            message: 'Quote updated',
            Autor: updateQuote,
            Autors: allQuotes,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.updateQuote = updateQuote;
const deleteQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const deletedQuote = yield quote_1.default.findByIdAndUpdate({ _id: id }, Object.assign(Object.assign({}, body), { isDeleted: true }));
        const allQuote = yield quote_1.default.find();
        res.status(200).json({
            message: 'Quote deleted',
            autor: deletedQuote,
            autors: allQuote,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.deleteQuote = deleteQuote;
