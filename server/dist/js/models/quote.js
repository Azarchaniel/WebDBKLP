"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const quoteSchema = new mongoose_1.Schema({
    text: String,
    fromBook: { type: [mongoose_2.default.Schema.Types.ObjectId], ref: 'Book', required: false },
    pageNo: { type: Number, required: false },
    note: { type: String, required: false },
    isDeleted: { type: Boolean, defaut: false }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Quote', quoteSchema);
