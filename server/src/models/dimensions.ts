import {model, Schema} from "mongoose";
import {IDimension} from "../types";

const { Decimal128 } = Schema.Types;

export const dimensionSchema: Schema = new Schema({
    height: {type: Decimal128},
    width: {type: Decimal128},
    depth: {type: Decimal128},
    weight: {type: Decimal128, required: false},
}, { _id: false });

export default model<IDimension>('Dimension', dimensionSchema);