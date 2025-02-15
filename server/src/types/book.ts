import { Document } from 'mongoose'
import {TPublished} from "./published";
import {ILocation} from "./location";
import {IDimension} from "./dimension";
import {IEditionSerie} from "./editionSerie";

export interface IBook extends Document {
    autor?: string[]; //IDs
    editor?: string[];
    ilustrator?: string[];
    translator?: string[];
    title: string;
    subtitle?: string;
    content?: string[];
    edition?: IEditionSerie;
    serie?: IEditionSerie;
    ISBN?: string;
    published?: TPublished;
    language: string[];
    note?: string;
    dimensions?: IDimension;
    numberOfPages?: number;
    exLibris?: boolean;
    location?: ILocation;
    owner?: string;
    createdAt?: Date;
    updateAt?: Date;
    deletedAt?: Date;
    readBy: string[];
    picture?: string;
    hrefGoodReads?: string;
    hrefDatabazeKnih?: string;
    //binding?: string;
    wasChecked?: boolean; //TEMPORARY
}
//vazba: vazana, brozovana, sesit, kruzkovana, leporelo
