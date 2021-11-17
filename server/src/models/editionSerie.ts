import {model, Schema} from "mongoose";
import {IEditionSerie} from "../types";

export const editionSerieSchema: Schema = new Schema({
    no: {type: Number, required: false},
    title: {type: String}
}, {timestamps: true});

export default model<IEditionSerie>('EditionSerie', editionSerieSchema);