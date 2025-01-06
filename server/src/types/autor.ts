import { Document } from 'mongoose'

export interface IAutor extends Document {
    _id: string;
    firstName?: string;
    lastName: string;
    nationality?: string;
    dateOfBirth?: Date;
    dateOfDeath?: Date;
    note?: string;
    fullName?: string;
    deletedAt?: Date;
}
