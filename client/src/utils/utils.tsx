import {IAutor, IUser} from "../type";

export const shortenStringKeepWord = (text: string, maxLength: number): string => {
    if (!text) return "";
    //if the text is longer than maxLength chars, shorten it. ELSE return unchanged
    if (text.length > maxLength) {
        //shorten the string but keep the whole word
        return text.slice(0,maxLength).split(' ').slice(0, -1).join(' ') + '...'
    } else {
        return text;
    }
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

export const stringifyUsers = (data: IUser[], withSurname: boolean) => {
    let names = '';
    data.forEach((autor: IAutor, index: number) =>
        index > 0 ? names += `; ${withSurname ? autor.lastName + ',' : ''} ${autor.firstName}`
            : names = `${withSurname ? autor.lastName + ',' : ''} ${autor.firstName}`);
    return names;
}

export const darkenLightenColor = (color: string, percent: number) => {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = R * (100 + percent) / 100;
    G = G * (100 + percent) / 100;
    B = B * (100 + percent) / 100;

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    let RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

export const getCssPropertyValue = (propertyName: string) => {
    return getComputedStyle(document.body).getPropertyValue(propertyName);
}

export const checkIsbnValidity = (isbn: string | undefined)  => {
    if (!isbn) return true;
    if (/[^0-9X]/gi.test(isbn)) return false; //contains invalid chars

    let sum,
        weight,
        digit,
        check,
        i;

    isbn = isbn.replace(/[^0-9X]/gi, '');

    if (isbn.length < 10 && isbn.length > 1) {
        return true; //can't validate older/shorter ISBN, so just assume they are correct
    }

    if (isbn.length === 13) {
        sum = 0;
        for (i = 0; i < 12; i++) {
            digit = parseInt(isbn[i]);
            if (i % 2 === 1) {
                sum += 3*digit;
            } else {
                sum += digit;
            }
        }
        check = (10 - (sum % 10)) % 10;
        return (check === parseInt(isbn[isbn.length-1]));
    }

    if (isbn.length === 10) {
        weight = 10;
        sum = 0;
        for (i = 0; i < 9; i++) {
            digit = parseInt(isbn[i]);
            sum += weight*digit;
            weight--;
        }
        check = (11 - (sum % 11)) % 11
        if (check === 10) {
            check = 'X';
        }
        return (check === isbn[isbn.length-1].toUpperCase());
    }

    return false;
}

type ValidationOptions = {
    mustBePositive?: boolean; // Optional: Ensure the number is greater than 0
    mustBeInteger?: boolean; // Optional: Ensure the number is an integer
};

export const validateNumber = (value: any, options?: ValidationOptions): boolean => {
    if (!value) return true;
    const { mustBePositive = false, mustBeInteger = false } = options || {};

    // Check if the value is a number
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
        return false;
    }

    // Check if the value is positive
    if (mustBePositive && numberValue <= 0) {
        return false;
    }

    // Check if the value is an integer
    if (mustBeInteger && !Number.isInteger(numberValue)) {
        return false;
    }

    return true;
};

export const isNumberOrEmpty = (num: any) => {
    return (!isNaN(num) || num === "" || num === undefined);
}

export const formPersonsFullName = <T extends { firstName?: string; lastName?: string }>(
    person: T | T[] | undefined
): string | T[] | undefined => {
    if (!person) return;

    if (Array.isArray(person)) {
        return person.map(p => ({
            ...p,
            fullName: `${p.lastName ?? ''}${p.firstName ? ', ' + p.firstName : ''}`,
        }));
    } else {
        return `${person.lastName ?? ''}${person.firstName ? ', ' + person.firstName : ''}`;
    }
};