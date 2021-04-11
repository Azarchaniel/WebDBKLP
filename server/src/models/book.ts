import {IBook} from '../types';
import {model, Schema} from 'mongoose'
import {publishedSchema} from "./published";

const bookSchema: Schema = new Schema({
    autor: {type: [String], required: false},
    title: {type: String, required: true},
    subtitle: {type: String, required: false},
    ISBN: {type: String, required: false},
    language: {type: String, required: true},
    note: {type: String, required: false},
    numberOfPages: {type: Number, required: false},
    published: {type: publishedSchema, required: false}
}, {timestamps: true})

export default model<IBook>('Book', bookSchema);
