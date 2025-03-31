import {model, Schema} from "mongoose";
import mongoose from "mongoose";
import {ILp} from "../types";
import {publishedSchema} from "./published";
import {applyNormalizeSearchMiddleware, applyUpdateAtMiddleware, baseSchema} from "./baseSchema";

const lpSchema: Schema = new Schema({
    autor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    title: {type: String, required: true},
    subtitle: {type: String, required: false},
    published: {type: publishedSchema, required: false},
    countLp: Number,
    speed: Number,
    language: {type: [String], required: true},
    note: {type: String, required: false},
}, {timestamps: true})

lpSchema.add(baseSchema);

lpSchema.index({
    "normalizedSearchField.autor": "text",
    "normalizedSearchField.title": "text",
    "normalizedSearchField.subtitle": "text",
    "normalizedSearchField.note": "text",
    "normalizedSearchField.published": "text"
});

applyUpdateAtMiddleware(lpSchema, ['findOneAndUpdate', 'updateOne', 'updateMany']);
applyNormalizeSearchMiddleware(lpSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], "lp");

export default model<ILp>('LP', lpSchema);