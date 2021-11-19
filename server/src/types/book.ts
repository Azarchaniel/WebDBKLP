import { Document } from 'mongoose'
import {TPublished} from "./published";
import {TLocation} from "./location";
import {TDimension} from "./dimension";
import {TEditionSerie} from "./editionSerie";

export interface IBook extends Document {
    autor?: string[]; //IDs
    editor?: string[];
    ilustrator?: string[];
    translator?: string[];
    title: string;
    subtitle?: string;
    content?: string[];
    edition?: TEditionSerie;
    serie?: TEditionSerie;
    ISBN?: string;
    published?: TPublished;
    language: string[];
    note?: string;
    dimensions?: TDimension;
    numberOfPages?: number;
    exLibris: boolean;
    location: TLocation;
    owner: string;
    isDeleted: boolean;
    readBy: string[];
}
