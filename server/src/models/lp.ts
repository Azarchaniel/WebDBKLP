import {model, Schema} from "mongoose";
import mongoose from "mongoose";
import {editionSerieSchema} from "./editionSerie";
import {ILp} from "../types";
import {publishedSchema} from "./published";

//TODO: add owner, add songs: string[]
const lpSchema: Schema = new Schema({
    autor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    title: {type: String, required: true},
    subtitle: {type: String, required: false},
    edition: {type: editionSerieSchema, required: false},
    publisher: {type: publishedSchema, required: false},
    countLp: Number,
    speed: Number,
    language: {type: [String], required: true},
    note: {type: String, required: false},
    deletedAt: {type: Date}
}, {timestamps: true})

export default model<ILp>('LP', lpSchema);