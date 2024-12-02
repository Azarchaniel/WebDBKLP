import {IAutor, IUser} from "../type";

export const shortenStringKeepWord = (text: string, maxLength: number): string => {
	if (!text) return "";
	//if the text is longer than maxLength chars, shorten it. ELSE return unchanged
	if (text.length > maxLength) {
		//shorten the string but keep the whole word
		return text.slice(0,maxLength).split(" ").slice(0, -1).join(" ") + "..."
	} else {
		return text;
	}
}

export const stringifyAutors = (
	data: any
): any => {
	const dataM = Array.isArray(data) ? data : [data];

	// Helper function to process a specific field
	const stringifyField = (entity: any, field: string, targetField: string) => {
		let people = entity[field] as IAutor[] | undefined;

		if (people) {
			people = Array.isArray(people) ? people : [people];

			entity[targetField] = people
				.map((person: IAutor) => `${person.lastName}, ${person.firstName}`)
				.join("; ");
		}
	};

	// Iterate over the entities and process relevant fields
	dataM.forEach((entity: any) => {
		stringifyField(entity, "autor", "autorsFull");
		stringifyField(entity, "editor", "editorsFull");
		stringifyField(entity, "ilustrator", "illustratorsFull");
		stringifyField(entity, "translator", "translatorsFull");
	});

	return dataM;
};

export const stringifyUsers = (data: IUser[], withSurname: boolean) => {
	let names = "";
	data.forEach((autor: IAutor, index: number) =>
		index > 0 ? names += `; ${withSurname ? autor.lastName + "," : ""} ${autor.firstName}`
			: names = `${withSurname ? autor.lastName + "," : ""} ${autor.firstName}`);
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

	const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
	const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
	const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

	return "#"+RR+GG+BB;
}

export const getCssPropertyValue = (propertyName: string) => {
	return getComputedStyle(document.body).getPropertyValue(propertyName);
}


export function checkIsbnValidity(isbn: string): boolean {
	if (!isbn) return true;
	// Remove any hyphens or spaces
	const cleanISBN = isbn.replace(/[\s-]/g, "");

	// Check if it's less than 10 characters
	if (cleanISBN.length < 10) {
		return true; // Consider valid for older Czech books
	}

	if (cleanISBN.length === 10) {
		return isValidISBN10(cleanISBN);
	} else if (cleanISBN.length === 13) {
		return isValidISBN13(cleanISBN);
	}

	return false; // Invalid if it's neither 10 nor 13 digits
}

function isValidISBN10(isbn10: string): boolean {
	if (!/^\d{9}[\dX]$/.test(isbn10)) {
		return false; // ISBN-10 should have 9 digits followed by a digit or 'X'
	}

	let sum = 0;

	for (let i = 0; i < 9; i++) {
		sum += parseInt(isbn10[i], 10) * (10 - i);
	}

	const lastChar = isbn10[9];
	sum += lastChar === "X" ? 10 : parseInt(lastChar, 10);

	return sum % 11 === 0;
}

function isValidISBN13(isbn13: string): boolean {
	if (!/^\d{13}$/.test(isbn13)) {
		return false; // ISBN-13 should be exactly 13 digits
	}

	let sum = 0;

	for (let i = 0; i < 13; i++) {
		const digit = parseInt(isbn13[i], 10);
		sum += digit * (i % 2 === 0 ? 1 : 3);
	}

	return sum % 10 === 0;
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

//TODO: isn't this the same as stringifyAutors?
export const formPersonsFullName = <T extends { firstName?: string; lastName?: string }>(
	person: T | T[] | undefined
): string | T[] | undefined => {
	if (!person) return;

	if (Array.isArray(person)) {
		return person.map(p => ({
			...p,
			fullName: `${p.lastName ?? ""}${p.firstName ? ", " + p.firstName : ""}`,
		}));
	} else {
		return `${person.lastName ?? ""}${person.firstName ? ", " + person.firstName : ""}`;
	}
};