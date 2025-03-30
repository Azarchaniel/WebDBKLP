import {model, Schema} from "mongoose";
import {IQuote} from "../types";
import mongoose from "mongoose";
import {applyNormalizeSearchMiddleware, baseSchema} from "./baseSchema";

const quoteSchema: Schema = new Schema({
    text: String,
    fromBook: {type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: false},
    pageNo: {type: Number, required: false},
    note: {type: String, required: false},
    owner: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: false},
}, {timestamps: true})

quoteSchema.add(baseSchema);

applyNormalizeSearchMiddleware(quoteSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], "quote");

export default model<IQuote>('Quote', quoteSchema);