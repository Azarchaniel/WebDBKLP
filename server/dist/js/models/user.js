"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: false },
    lastName: { type: String },
    hashedPassword: { type: String, required: false }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('User', userSchema);
