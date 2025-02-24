import {model, Schema} from 'mongoose'
import {IAutor} from "../types";

const autorSchema: Schema = new Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: true },
    nationality: { type: String, required: false },
    dateOfBirth: { type: Date, required: false },
    dateOfDeath: { type: Date, required: false },
    note: { type: String, required: false },
    role: {type: [String], required: false },
    deletedAt: { type: Date}
}, {timestamps: true})

export default model<IAutor>('Autor', autorSchema);
