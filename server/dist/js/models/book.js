"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const published_1 = require("./published");
const editionSerie_1 = require("./editionSerie");
const bookSchema = new mongoose_1.Schema({
    //string, because it's ID
    autor: { type: [String], required: false },
    editor: { type: [String], required: false },
    ilustrator: { type: [String], required: false },
    translator: { type: [String], required: false },
    title: { type: String, required: true },
    subtitle: { type: String, required: false },
    content: { type: String, required: false },
    edition: { type: editionSerie_1.editionSerieSchema, required: false },
    serie: { type: editionSerie_1.editionSerieSchema, required: false },
    ISBN: { type: String, required: false },
    language: { type: [String], required: true },
    note: { type: String, required: false },
    numberOfPages: { type: Number, required: false },
    exLibris: { type: Boolean },
    published: { type: published_1.publishedSchema, required: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Book', bookSchema);
