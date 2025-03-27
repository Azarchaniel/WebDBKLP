import { Document } from 'mongoose'
import {IEditionSerie} from "./editionSerie";
import {TPublished} from "./published";

export interface ILp extends Document {
    autor?: string[];
    title: string;
    subtitle?: string;
    edition?: IEditionSerie;
    countLp: number;
    speed: number;
    published: TPublished;
    language: string;
    note: string;
    deletedAt?: Date;
    normalizedSearchField?: {[key: string]: string};
}