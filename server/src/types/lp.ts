import { Document } from 'mongoose'
import {TEditionSerie} from "./editionSerie";
import {TPublished} from "./published";

export interface ILp extends Document {
    autor?: string[];
    title: string;
    subtitle?: string;
    edition?: TEditionSerie;
    countLp: number;
    speed: number;
    published: TPublished;
    language: string;
    note: string;
    isDeleted: boolean;
}