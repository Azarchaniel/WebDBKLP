import {IBook} from '../types';
import {model, Schema} from 'mongoose'
import {publishedSchema} from "./published";
import {editionSerieSchema} from "./editionSerie";
import * as mongoose from "mongoose";
import {locationSchema} from "./location";

//FIXME: dimension
const bookSchema: Schema = new Schema({
    autor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    editor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    ilustrator: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    translator: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    title: {type: String, required: true},
    subtitle: {type: String, required: false},
    content: {type: String, required: false},
    edition: {type: editionSerieSchema, required: false},
    serie: {type: editionSerieSchema, required: false},
    ISBN: {type: String, required: false},
    language: {type: [String], required: true},
    note: {type: String, required: false},
    numberOfPages: {type: Number, required: false},
    exLibris: {type: Boolean},
    published: {type: publishedSchema, required: false},
    location: {type: locationSchema, required: false},
    deletedAt: {type: Date},
    owner: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: true},
    readBy: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false},
    picture: {type: String, required: false},
    hrefGoodReads: {type: String, required: false},
    hrefDatabazeKnih: {type: String, required: false},
}, {timestamps: true})

export default model<IBook>('Book', bookSchema);
