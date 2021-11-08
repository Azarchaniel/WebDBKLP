import { Document } from 'mongoose'

export interface IUser extends Document {
    firstName?: string,
    lastName: string,
    hashedPassword?: string
}