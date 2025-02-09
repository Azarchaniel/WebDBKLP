"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const published_1 = require("./published");
const editionSerie_1 = require("./editionSerie");
const mongoose = __importStar(require("mongoose"));
const location_1 = require("./location");
const dimensions_1 = require("./dimensions");
const bookSchema = new mongoose_1.Schema({
    autor: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
    editor: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
    ilustrator: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
    translator: { type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false },
    title: { type: String, required: true },
    subtitle: { type: String, required: false },
    content: { type: [String], required: false },
    edition: { type: editionSerie_1.editionSerieSchema, required: false },
    serie: { type: editionSerie_1.editionSerieSchema, required: false },
    ISBN: { type: String, required: false },
    language: { type: [String], required: false },
    note: { type: String, required: false },
    numberOfPages: { type: Number, required: false },
    dimensions: { type: dimensions_1.dimensionSchema, required: false },
    exLibris: { type: Boolean, required: false },
    published: { type: published_1.publishedSchema, required: false },
    location: { type: location_1.locationSchema, required: false },
    deletedAt: { type: Date, required: false },
    owner: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false },
    readBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false },
    picture: { type: String, required: false },
    hrefGoodReads: { type: String, required: false },
    hrefDatabazeKnih: { type: String, required: false },
    wasChecked: { type: Boolean, required: false, default: false }, //TEMPORARY
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Book', bookSchema);
