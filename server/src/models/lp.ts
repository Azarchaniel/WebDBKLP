import {model, Schema} from "mongoose";
import mongoose from "mongoose";
import {ILp} from "../types";
import {publishedSchema} from "./published";
import {normalizeSearchFields} from "../utils/utils";

//TODO: add owner, add songs: string[]
const lpSchema: Schema = new Schema({
    autor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    title: {type: String, required: true},
    subtitle: {type: String, required: false},
    published: {type: publishedSchema, required: false},
    countLp: Number,
    speed: Number,
    language: {type: [String], required: true},
    note: {type: String, required: false},
    deletedAt: {type: Date},
    normalizedSearchField: {type: JSON, required: false},
}, {timestamps: true})

lpSchema.index({
    "normalizedSearchField.autor": "text",
    "normalizedSearchField.title": "text",
    "normalizedSearchField.subtitle": "text",
    "normalizedSearchField.note": "text",
    "normalizedSearchField.published": "text"
});

lpSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
    this.set({updatedAt: new Date()});
    next();
});

lpSchema.pre(['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], async function (next) {
    // normalization for search
    try {
        const docInstance = this;

        if (docInstance instanceof mongoose.Document) {
            // For `save` middleware
            const normalizedFields = await normalizeSearchFields(docInstance, "lp");
            docInstance.normalizedSearchField = normalizedFields;
        } else {
            // @ts-ignore
            const updateQuery = this.getUpdate();

            // Fetch the current document (if needed) to normalize fields
            // @ts-ignore
            const doc = await this.model.findOne(this.getQuery());

            if (doc) {
                const normalizedFields = await normalizeSearchFields(doc, "lp");
                // @ts-ignore
                this.setUpdate({
                    ...updateQuery,
                    normalizedSearchField: normalizedFields
                });
            }
        }
    } catch (error) {
        console.error("Error in middleware when normalizing LP", error);
        next();
    }

    next();
});

export default model<ILp>('LP', lpSchema);