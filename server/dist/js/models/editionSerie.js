"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editionSerieSchema = void 0;
const mongoose_1 = require("mongoose");
exports.editionSerieSchema = new mongoose_1.Schema({
    no: { type: String, required: false },
    title: { type: String }
});
exports.default = (0, mongoose_1.model)('EditionSerie', exports.editionSerieSchema);
