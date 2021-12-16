import {model, Schema} from "mongoose";
import {IQuote} from "../types";
import mongoose from "mongoose";

const quoteSchema: Schema = new Schema({
    text: String,
    fromBook: {type: [mongoose.Schema.Types.ObjectId], ref: 'Book', required: false},
    note: {type: String, required: false},
    isDeleted: { type: Boolean, defaut: false }
}, {timestamps: true})

export default model<IQuote>('Quote', quoteSchema);