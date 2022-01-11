import {IAutor, IBook, ILP} from "../type";

export const shortenStringKeepWord = (text: string, maxLength: number) => {
    //if the text is longer than 30 chars, shorten it. ELSE return unchanged
    if (text.length > maxLength) {
        //shorten the string but keep the whole word
        return text.slice(0,maxLength).split(' ').slice(0, -1).join(' ') + '...'
    } else {
        return text;
    }
}

export const getRandomColor = () => {
    const pastelArray = ['#77dd77', '#836953', '#89cff0', '#99c5c4', '#9adedb', '#aa9499', '#aaf0d1', '#b2fba5', '#b39eb5', '#bdb0d0',
        '#bee7a5', '#befd73', '#c1c6fc', '#c6a4a4', '#c8ffb0', '#cb99c9', '#cef0cc', '#cfcfc4', '#d6fffe', '#d8a1c4', '#dea5a4', '#deece1',
        '#dfd8e1', '#e5d9d3', '#e9d1bf', '#f49ac2', '#f4bfff', '#fdfd96', '#ff6961', '#ff964f', '#ff9899', '#ffb7ce', '#ca9bf7'];
    return pastelArray[Math.floor(Math.random() * pastelArray.length)];
}

export const stringifyAutors = (data: any) => {
    let dataM = Array.isArray(data) ? data : [data];
    //create string of autors; if one autor, just add him; if more, add '; ' at the beginning of every next
    dataM.forEach((entity: any) => {
        if (entity.autor) {
            entity['autorsFull'] = '';
            entity.autor.forEach((autor: IAutor, index: number) =>
                index > 0 ? entity['autorsFull'] += `; ${autor.lastName}, ${autor.firstName}`
                    : entity['autorsFull'] = `${autor.lastName}, ${autor.firstName}`)
        }
        if (entity.editor) {
            entity['editorsFull'] = '';
            entity.editor.forEach((editor: IAutor, index: number) =>
                index > 0 ? entity['editorsFull'] += `; ${editor.lastName}, ${editor.firstName}`
                    : entity['editorsFull'] = `${editor.lastName}, ${editor.firstName}`)
        }
        if (entity.ilustrator) {
            entity['illustratorsFull'] = '';
            entity.ilustrator.forEach((ilustrator: IAutor, index: number) =>
                index > 0 ? entity['ilustratorsFull'] += `; ${ilustrator.lastName}, ${ilustrator.firstName}`
                    : entity['ilustratorsFull'] = `${ilustrator.lastName}, ${ilustrator.firstName}`)
        }
        if (entity.translator) {
            entity['translatorsFull'] = '';
            entity.translator.forEach((translator: IAutor, index: number) =>
                index > 0 ? entity['translatorsFull'] += `; ${translator.lastName}, ${translator.firstName}`
                    : entity['translatorsFull'] = `${translator.lastName}, ${translator.firstName}`)
        }
    });

    return dataM;
}