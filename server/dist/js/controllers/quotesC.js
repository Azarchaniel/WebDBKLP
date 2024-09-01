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
exports.deleteQuote = exports.addQuote = exports.getQuote = exports.getAllQuotes = void 0;
const quote_1 = __importDefault(require("../models/quote"));
const populateOptions = [
    { path: 'fromBook', model: 'Book' },
    { path: 'owner', model: 'User' }
];
const getAllQuotes = (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quotes = yield quote_1.default.find()
            .populate(populateOptions)
            .exec();
        res.status(200).json({ quotes: quotes });
    }
    catch (error) {
        res.status(400);
        console.error(error);
    }
});
exports.getAllQuotes = getAllQuotes;
const getQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quote = yield quote_1.default.findById(req.params.id)
            .populate(populateOptions)
            .exec();
        const allQuotes = yield quote_1.default.find()
            .populate(populateOptions)
            .exec();
        res.status(200).json({ quote: quote, quotes: allQuotes });
    }
    catch (err) {
        throw err;
    }
});
exports.getQuote = getQuote;
const addQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, text, fromBook, note, deletedAt, owner, pageNo } = req.body;
    try {
        if (!id) {
            const quote = new quote_1.default({
                text: text,
                note: note,
                fromBook: fromBook,
                deletedAt: deletedAt,
                owner: owner,
                pageNo: pageNo
            });
            const newQuote = yield quote.save();
            const allQuotes = yield quote_1.default
                .find()
                .populate(populateOptions)
                .exec();
            res.status(201).json({ message: 'Quote added', quote: newQuote, quotes: allQuotes });
        }
        else {
            const updateQuote = yield quote_1.default.findByIdAndUpdate({ _id: id }, req.body);
            const allQuotes = yield quote_1.default
                .find()
                .populate(populateOptions)
                .exec();
            res.status(201).json({
                message: 'Quote updated',
                quote: updateQuote,
                quotes: allQuotes,
            });
        }
    }
    catch (err) {
        console.error("Error while adding/updating Quote: ", err);
    }
});
exports.addQuote = addQuote;
const deleteQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const deletedQuote = yield quote_1.default.findByIdAndUpdate({ _id: id }, Object.assign(Object.assign({}, body), { deletedAt: new Date() }));
        const allQuote = yield quote_1.default
            .find()
            .populate(populateOptions)
            .exec();
        res.status(200).json({
            message: 'Quote deleted',
            quote: deletedQuote,
            quotes: allQuote,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.deleteQuote = deleteQuote;
