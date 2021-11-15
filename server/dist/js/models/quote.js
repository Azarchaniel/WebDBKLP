"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const quoteSchema = new mongoose_1.Schema({
    text: String,
    fromBook: String,
    isDeleted: { type: Boolean, defaut: false }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Quote', quoteSchema);
