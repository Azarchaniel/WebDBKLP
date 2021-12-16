"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const published_1 = require("./published");
const editionSerie_1 = require("./editionSerie");
const mongoose = __importStar(require("mongoose"));
const location_1 = require("./location");
const bookSchema = new mongoose_1.Schema({
    autor: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
    editor: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
    ilustrator: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
    translator: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
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
    location: { type: location_1.locationSchema, required: false },
    isDeleted: { type: Boolean, default: false },
    owner: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: true },
    readBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Book', bookSchema);
