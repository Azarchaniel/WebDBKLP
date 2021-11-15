import {model, Schema} from "mongoose";
import {IQuote} from "../types";

const quoteSchema: Schema = new Schema({
    text: String,
    fromBook: String,
    isDeleted: { type: Boolean, defaut: false }
}, {timestamps: true})

export default model<IQuote>('Quote', quoteSchema);