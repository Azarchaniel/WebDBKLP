import { Document } from 'mongoose'
import { IUser } from './user';
import {IBook} from "./book";

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