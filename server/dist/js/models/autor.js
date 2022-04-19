"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const autorSchema = new mongoose_1.Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: true },
    nationality: { type: String, required: false },
    dateOfBirth: { type: Date, required: false },
    dateOfDeath: { type: Date, required: false },
    note: { type: String, required: false },
    deletedAt: { type: Date, defaut: false }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Autor', autorSchema);
