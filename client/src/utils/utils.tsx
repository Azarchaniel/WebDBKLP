import {IAutor, ILangCode, ILocation, IUser} from "../type";
import {cities} from "./constants";
import {countryCode} from "./locale";

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

//TODO: refactor these 3
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
				.map((person: IAutor) => person.fullName)
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

export const darkenLightenColor = (hex: string, percent: number): string => {
	// Remove the hash (#) if present
	hex = hex.replace(/^#/, "");

	// Parse the color into RGB components
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);

	// Adjust each color channel
	r = Math.min(255, Math.max(0, r + Math.round((percent / 100) * 255)));
	g = Math.min(255, Math.max(0, g + Math.round((percent / 100) * 255)));
	b = Math.min(255, Math.max(0, b + Math.round((percent / 100) * 255)));

	let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

	//color is too dark, dump it and create new
	const luminanceThreshold = 65; // range is 0..255, where 0 is the darkest and 255 is the lightest. Values greater than 128 are considered light
	// If the color is too dark, lighten it
	if (luminance < luminanceThreshold) {
		return darkenLightenColor(hex, 30); // Lighten by 30%
	}

	// Convert back to hex and return
	const toHex = (value: number) => value.toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const generateColors = (length: number) => {
	let colors = ["#77dd77", "#836953", "#89cff0", "#99c5c4", "#9adedb", "#aa9499", "#aaf0d1", "#b2fba5", "#b39eb5", "#bdb0d0",
		"#bee7a5", "#befd73", "#c1c6fc", "#c6a4a4", "#c8ffb0", "#cb99c9", "#cef0cc", "#cfcfc4", "#d8a1c4", "#dea5a4", "#deece1",
		"#dfd8e1", "#e5d9d3", "#e9d1bf", "#f49ac2", "#f4bfff", "#fdfd96", "#ff6961", "#ff964f", "#ff9899", "#ffb7ce", "#ca9bf7"];

	while (colors.length < length) {
		// if there are more quotes than colors, duplicate arr of colors, but randomly change shade of a color by +- 40 perc
		colors = colors.flatMap((item: string) => [item, darkenLightenColor(item, randomMinMax(30, -30, true))]);
		colors = Array.from(new Set(colors));
	}
	return Array.from(new Set(colors));
}

export const getRandomShade = (hexColor: string): string => {
	return darkenLightenColor(hexColor, randomMinMax(30, -30, true));
};

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
	if (value === undefined || value === null) return true;
	if (value === "") return true;

	const { mustBePositive = false, mustBeInteger = false } = options || {};

	value = value.toString().replace(",",".");

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

export const toPercentage = (value: number) => {
	if (!value) return;
	return ((value * 100).toFixed(1)) + "%";
}

export const randomMinMax = (min: number, max: number, integer?: boolean): number => {
	if (integer) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	return Math.random() * (max - min) + min;
}

export const getBookLocation = (location: ILocation): string => {
	if (!location || !location.city) return "";
	return `${cities.find(city => city.value === location.city)?.showValue}${location.shelf ? ', ' + location.shelf : ""}`
}

export const formatDimension = (dimension: any) => {
	if (dimension === undefined || dimension === null) return undefined;

	if (typeof dimension === 'object' && "$numberDecimal" in dimension)
		return parseFloat(dimension.$numberDecimal)
			.toLocaleString("cs-CZ",
				{minimumFractionDigits: 1, maximumFractionDigits: 1}) as unknown as number;

	return parseFloat(dimension).toLocaleString("cs-CZ", {minimumFractionDigits: 1}) as unknown as number;
}

export const getPublishedCountry = (publishedCountry: any): ILangCode | undefined => {
	return countryCode.find((country: ILangCode) => (publishedCountry as unknown as string[])?.includes(country.key));
}