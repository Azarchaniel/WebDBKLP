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
exports.getAutor = exports.deleteAutor = exports.updateAutor = exports.addAutor = exports.getAllAutors = void 0;
const autor_1 = __importDefault(require("../../models/autor"));
const getAllAutors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const autors = yield autor_1.default.find();
        res.status(200).json({ autors: autors });
    }
    catch (error) {
        throw error;
    }
});
exports.getAllAutors = getAllAutors;
const getAutor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const autor = yield autor_1.default.findById(req.params.id);
        const allAutors = yield autor_1.default.find();
        res.status(200).json({ autor: autor, autors: allAutors });
    }
    catch (err) {
        throw err;
    }
});
exports.getAutor = getAutor;
const addAutor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //todo: maybe just const {firstName} = body; ?? Or not at all?
        const body = req.body;
        const autor = new autor_1.default({
            firstName: body.firstName,
            lastName: body.lastName,
            dateOfBirth: body.dateOfBirth,
            dateOfDeath: body.dateOfDeath,
            note: body.note,
            nationality: body.nationality
        });
        const newAutor = yield autor.save();
        const allAutors = yield autor_1.default.find();
        res.status(201).json({ message: 'Autor added', autor: newAutor, autors: allAutors });
    }
    catch (error) {
        throw error;
    }
});
exports.addAutor = addAutor;
const updateAutor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const updateAutor = yield autor_1.default.findByIdAndUpdate({ _id: id }, body);
        const allAutors = yield autor_1.default.find();
        res.status(200).json({
            message: 'Autor updated',
            Autor: updateAutor,
            Autors: allAutors,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.updateAutor = updateAutor;
const deleteAutor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.trace(req.params);
        const deletedAutor = yield autor_1.default.findByIdAndRemove(req.params.id);
        const allAutors = yield autor_1.default.find();
        res.status(200).json({
            message: 'Autor deleted',
            autor: deletedAutor,
            autors: allAutors,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.deleteAutor = deleteAutor;
