import {model, Schema} from 'mongoose'
import {ILocation} from "../types";

export const locationSchema: Schema = new Schema({
    city: {type: String, required: false},
    shelf: {type: String, required: false}
}, { _id: false });

export default model<ILocation>('Location', locationSchema);
