import {model, Schema} from 'mongoose'
import {IAutor} from "../types";
import mongoose from "mongoose";
import {normalizeSearchFields} from "../utils/utils";

const autorSchema: Schema = new Schema({
    firstName: {type: String, required: false},
    lastName: {type: String, required: true},
    nationality: {type: String, required: false},
    dateOfBirth: {type: Date, required: false},
    dateOfDeath: {type: Date, required: false},
    note: {type: String, required: false},
    role: {type: [String], required: false},
    deletedAt: {type: Date},
    normalizedSearchField: {type: JSON, required: false},
    fullName: {type: String, required: false}
}, {timestamps: true})

autorSchema.index({
    "normalizedSearchField.firstName": "text",
    "normalizedSearchField.lastName": "text",
});

autorSchema.pre(['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], async function (next) {
    //FIXME: is this called correctly after update? fullName wasn't changed properly
    // normalization for search
    try {
        const docInstance = this;

        if (docInstance instanceof mongoose.Document) {
            const normalizedFields = await normalizeSearchFields(docInstance, "autor");
            docInstance.normalizedSearchField = normalizedFields;

            docInstance.fullName = `${docInstance.lastName ?? ""}${docInstance.firstName ? ", " + docInstance.firstName : ""}`;
        } else {
            // @ts-ignore
            const updateQuery = this.getUpdate();

            // Fetch the current document (if needed) to normalize fields
            // @ts-ignore
            const doc = await this.model.findOne(this.getQuery());

            if (doc) {
                const normalizedFields = await normalizeSearchFields(doc, "autor");
                // @ts-ignore
                this.setUpdate({
                    ...updateQuery,
                    normalizedSearchField: normalizedFields,
                    fullName: `${doc.lastName ?? ""}${doc.firstName ? ", " + doc.firstName : ""}`,
                });
            }
        }
    } catch (error) {
        console.error("Error in middleware when normalizing autor", error);
        next();
    }

    next();
});

export default model<IAutor>('Autor', autorSchema);
