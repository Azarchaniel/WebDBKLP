import { Document } from 'mongoose'
import { IUser } from './user';

export interface IQuote extends Document {
    text: string; //text or URL to pic
    fromBook: string;
    pageNo?: number;
    note?: string;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    owner: IUser[];
}