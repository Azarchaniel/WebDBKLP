import { Document } from 'mongoose'

export interface IQuote extends Document {
    text: string; //text or URL to pic
    fromBook: string; //id
    note?: string;
    isDeleted: boolean;
}