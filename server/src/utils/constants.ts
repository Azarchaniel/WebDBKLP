import {IPopulateOptions} from "../types";

export const optionFetchAllExceptDeleted = {deletedAt: undefined};

export enum AutorRole {
    AUTOR = "autor",
    ILUSTRATOR = "ilustrator",
    EDITOR = "editor",
    TRANSLATOR = "translator",
    BOARD_GAME_AUTOR = "boardGameAutor",
    MUSICIAN = "musician"
}

export const populateOptionsBook: IPopulateOptions[] = [
    {path: 'autor', model: 'Autor'},
    {path: 'editor', model: 'Autor'},
    {path: 'ilustrator', model: 'Autor'},
    {path: 'translator', model: 'Autor'},
    {path: 'owner', model: 'User'},
    {path: 'readBy', model: 'User'}
];
