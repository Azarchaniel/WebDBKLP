import { Document } from 'mongoose'
import {TPublished} from "./published";
import {ILocation} from "./location";
import {IDimension} from "./dimension";
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
    dimensions?: IDimension;
    numberOfPages?: number;
    exLibris: boolean;
    location: ILocation;
    owner: string;
    isDeleted: boolean;
    readBy: string[];
    picture?: string;
}
