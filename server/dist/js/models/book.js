"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const published_1 = require("./published");
const bookSchema = new mongoose_1.Schema({
    autor: { type: [String], required: false },
    title: { type: String, required: true },
    subtitle: { type: String, required: false },
    ISBN: { type: String, required: false },
    language: { type: String, required: true },
    note: { type: String, required: false },
    numberOfPages: { type: Number, required: false },
    published: { type: published_1.publishedSchema, required: false }
}, { timestamps: true });
exports.default = mongoose_1.model('Book', bookSchema);
