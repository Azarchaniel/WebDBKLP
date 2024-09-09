import { Document } from 'mongoose'
import { IBook } from './book';
import { IUser } from './user';

export interface IQuote extends Document {
    text: string; //text or URL to pic
    fromBook: IBook;
    pageNo?: number;
    note?: string;
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    owner: IUser[];
}