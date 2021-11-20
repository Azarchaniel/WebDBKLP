import {model, Schema} from 'mongoose'
import {TPublished} from "../types/published";

export const publishedSchema: Schema = new Schema({
    publisher: {type: String, required: false},
    year: {type: Number, required: false},
    country: {type: String, required: false}
}, { _id: false });

export default model<TPublished>('Published', publishedSchema);
