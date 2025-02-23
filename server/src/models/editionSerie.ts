import {model, Schema} from "mongoose";
import {IEditionSerie} from "../types";

export const editionSerieSchema: Schema = new Schema({
    no: {type: String, required: false},
    title: {type: String}
}, {_id: false});

export default model<IEditionSerie>('EditionSerie', editionSerieSchema);