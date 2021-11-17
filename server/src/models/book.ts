import {IBook} from '../types';
import {model, Schema} from 'mongoose'
import {publishedSchema} from "./published";
import {editionSerieSchema} from "./editionSerie";

const bookSchema: Schema = new Schema({
    //string, because it's ID
    autor: {type: [String], required: false},
    editor: {type: [String], required: false},
    ilustrator: {type: [String], required: false},
    translator: {type: [String], required: false},
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
    isDeleted: {type: Boolean, default: false}
}, {timestamps: true})

export default model<IBook>('Book', bookSchema);
