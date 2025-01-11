import {model, Schema} from "mongoose";
import {IDimension} from "../types";

export const dimensionSchema: Schema = new Schema({
    height: {type: Number},
    width: {type: Number},
    depth: {type: Number},
    weight: {type: Number, required: false},
});

export default model<IDimension>('Dimension', dimensionSchema);