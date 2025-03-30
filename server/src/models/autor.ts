import {model, Schema} from 'mongoose'
import {IAutor} from "../types";
import {
    applyFullNameMiddleware,
    applyNormalizeSearchMiddleware,
    baseSchema,
} from "./baseSchema";

const autorSchema: Schema = new Schema({
    firstName: {type: String, required: false},
    lastName: {type: String, required: true},
    nationality: {type: String, required: false},
    dateOfBirth: {type: Date, required: false},
    dateOfDeath: {type: Date, required: false},
    note: {type: String, required: false},
    role: {type: [String], required: false},
}, {timestamps: true})

autorSchema.add(baseSchema);

autorSchema.index({
    "normalizedSearchField.firstName": "text",
    "normalizedSearchField.lastName": "text",
});

applyNormalizeSearchMiddleware(autorSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], "autor");
applyFullNameMiddleware(autorSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete']);

export default model<IAutor>('Autor', autorSchema);