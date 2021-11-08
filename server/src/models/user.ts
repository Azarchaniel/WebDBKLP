import {model, Schema} from "mongoose";
import {IUser} from "../types";

const userSchema: Schema = new Schema({
    firstName: {type: String, required: false},
    lastName: {type: String},
    hashedPassword: {type: String, required: false}
}, {timestamps: true});

export default model<IUser>('User', userSchema);