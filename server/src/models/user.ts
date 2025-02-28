import {model, Schema} from "mongoose";
import {IUser} from "../types";

const userSchema: Schema = new Schema({
    firstName: {type: String, required: false},
    lastName: {type: String},
    email: {type: String, required: true, unique: true},
    hashedPassword: {type: String}
}, {timestamps: true});

export default model<IUser>('User', userSchema);