import { Schema } from "mongoose";

const { Decimal128 } = Schema.Types;

export const dimensionSchema: Schema = new Schema({
    height: { type: Decimal128 },
    width: { type: Decimal128 },
    thickness: { type: Decimal128 },
    weight: { type: Decimal128, required: false },
}, { _id: false });