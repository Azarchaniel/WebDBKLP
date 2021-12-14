import {model, Schema} from 'mongoose'
import {TLocation} from "../types";

export const locationSchema: Schema = new Schema({
    publisher: {type: String, required: false},
    year: {type: Number, required: false},
    country: {type: String, required: false}
}, { _id: false });

export default model<TLocation>('Location', locationSchema);
