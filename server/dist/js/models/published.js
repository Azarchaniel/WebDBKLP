"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishedSchema = void 0;
const mongoose_1 = require("mongoose");
exports.publishedSchema = new mongoose_1.Schema({
    publisher: { type: String, required: false },
    year: { type: Number, required: false },
    country: { type: String, required: false }
}, { _id: false });
exports.default = mongoose_1.model('Published', exports.publishedSchema);
