import {IBook} from '../types';
import {model, Schema} from 'mongoose'
import {publishedSchema} from "./published";
import {editionSerieSchema} from "./editionSerie";
import * as mongoose from "mongoose";
import {locationSchema} from "./location";
import {dimensionSchema} from "./dimensions";
import {normalizeSearchFields} from '../utils/utils'; // Adjust the import path as needed


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
    normalizedSearchField: {type: JSON, required: false},
    wasChecked: {type: Boolean, required: false, default: false}, //TEMPORARY
})

bookSchema.index({
        "normalizedSearchField.autor": "text",
        "normalizedSearchField.editor": "text",
        "normalizedSearchField.ilustrator": "text",
        "normalizedSearchField.translator": "text",
        "normalizedSearchField.title": "text",
        "normalizedSearchField.subtitle": "text",
        "normalizedSearchField.content": "text",
        "normalizedSearchField.edition": "text",
        "normalizedSearchField.serie": "text",
        "normalizedSearchField.note": "text",
        "normalizedSearchField.published": "text"
});

bookSchema.pre('save', function (next) {
    if (!this.createdAt) {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();
    next();
});

bookSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    this.set({updatedAt: new Date()});
    next();
});

bookSchema.pre(['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], async function (next) {
    // normalization for search
    try {
        const docInstance = this;

        if (docInstance instanceof mongoose.Document) {
            // For `save` middleware
            const normalizedFields = await normalizeSearchFields(docInstance, "book");
            docInstance.normalizedSearchField = normalizedFields;
        } else {
            // @ts-ignore
            const updateQuery = this.getUpdate();

            // Fetch the current document (if needed) to normalize fields
            // @ts-ignore
            const doc = await this.model.findOne(this.getQuery());

            if (doc) {
                const normalizedFields = await normalizeSearchFields(doc, "book");
                // @ts-ignore
                this.setUpdate({
                    ...updateQuery,
                    normalizedSearchField: normalizedFields
                });
            }
        }
    } catch (error) {
        console.error("Error in middleware when normalizing book", error);
        next();
    }

    next();
});
export default model<IBook>('Book', bookSchema);
