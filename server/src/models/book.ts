import {IBook} from '../types';
import {model, Schema} from 'mongoose'
import {publishedSchema} from "./published";
import {editionSerieSchema} from "./editionSerie";
import * as mongoose from "mongoose";
import {locationSchema} from "./location";
import {dimensionSchema} from "./dimensions";

const bookSchema: Schema = new Schema({
    autor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    editor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    ilustrator: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    translator: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    title: {type: String, required: true},
    subtitle: {type: String, required: false},
    content: {type: [String], required: false},
    edition: {type: editionSerieSchema, required: false},
    serie: {type: editionSerieSchema, required: false},
    ISBN: {type: String, required: false},
    language: {type: [String], required: false},
    note: {type: String, required: false},
    numberOfPages: {type: Number, required: false},
    dimensions: {type: dimensionSchema, required: false},
    exLibris: {type: Boolean, required: false},
    published: {type: publishedSchema, required: false},
    location: {type: locationSchema, required: false},
    owner: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false},
    readBy: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false},
    picture: {type: String, required: false},
    hrefGoodReads: {type: String, required: false},
    hrefDatabazeKnih: {type: String, required: false},
    createdAt: {type: Date, required: false}, //because I had to edit createdAt at first import, I had to change it to be set manually
    updatedAt: {type: Date, required: false},
    deletedAt: {type: Date, required: false},
    wasChecked: {type: Boolean, required: false, default: false}, //TEMPORARY
})

bookSchema.pre('save', function (next) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();
    //console.log("middleware for create", this.createdAt, this.updatedAt, this._id);
    next();
});

bookSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    this.set({ updatedAt: new Date() });
    //console.log("middleware for update");
    next();
});


export default model<IBook>('Book', bookSchema);
