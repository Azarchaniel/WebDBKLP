import {model, Schema} from "mongoose";
import {TEditionSerie} from "../types";

export const editionSerieSchema: Schema = new Schema({
    no: {type: Number, required: false},
    title: {type: String}
}, {timestamps: true});

export default model<TEditionSerie>('EditionSerie', editionSerieSchema);