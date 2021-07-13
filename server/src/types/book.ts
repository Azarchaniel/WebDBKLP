import { Document } from 'mongoose'
import {Published} from "./published";
import {IAutor} from "./autor";

export interface IBook extends Document {
    autor?: IAutor[];
    // editor?: Editor[];
    // ilustrator?: Ilustrator[];
    // translator?: Translator[];
    title: string;
    subtitle?: string;
    // content?: string[];
    // edition?: Edition;
    // serie?: Edition;
    ISBN?: string;
    published?: Published;
    language: string[];
    //readBy: [ref(ownerId)]
    note?: string;
    // dimensions?: Dimensions;
    numberOfPages?: number;
    // exLibris: boolean;	//default: true
    // location: Location;
    // owner: ref(OwnerId);
}
