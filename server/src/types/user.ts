import { Document } from 'mongoose'
import {JwtPayload} from "jsonwebtoken";

export interface IUser extends Document {
    firstName?: string,
    lastName: string,
    email: string,
    hashedPassword: string
}

export interface CustomJwtPayload extends JwtPayload {
    userId: string;
}