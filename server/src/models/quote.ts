import {model, Schema} from "mongoose";
import {IQuote} from "../types";
import mongoose from "mongoose";

const quoteSchema: Schema = new Schema({
    text: String,
    fromBook: {type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: false},
    pageNo: {type: Number, required: false},
    note: {type: String, required: false},
    owner: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false},
    deletedAt: {type: Date}
}, {timestamps: true})

export default model<IQuote>('Quote', quoteSchema);