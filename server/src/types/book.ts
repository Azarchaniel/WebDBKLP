import { Document } from 'mongoose'
import {Published} from "./published";
import {IAutor} from "./autor";

export interface IBook extends Document {
    autor?: string[]; //IDs
    editor?: string[];
    ilustrator?: string[];
    translator?: string[];
    title: string;
    subtitle?: string;
    content?: string[];
    // edition?: Edition;
    // serie?: Edition;
    ISBN?: string;
    published?: Published;
    language: string[];
    //readBy: [ref(ownerId)]
    note?: string;
    // dimensions?: Dimensions;
    numberOfPages?: number;
    exLibris: boolean;	//default: true
    // location: Location;
    // owner: ref(OwnerId);
    isDeleted: boolean;
}
