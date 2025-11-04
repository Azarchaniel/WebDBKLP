import mongoose from "mongoose";
import diacritics from 'diacritics';
import Autor from "../models/autor";
export { webScrapper } from './scrapper';

export const getIdFromArray = (arrOfObj: Object[]) => {
    return arrOfObj?.map(obj => {
        if (!("_id" in obj)) {
            throw Error("Object does not have _id!");
        }
        return obj._id;
    })
}

const customOrder = ['Ľuboš', 'Žaneta', 'Jakub', 'Jaroslav', 'Magdaléna', 'Csonka rodičia', 'Víša', ''];
export const sortByParam = (data: any, param: string) =>
    data.sort((a: any, b: any) => customOrder.indexOf(a[param]) - customOrder.indexOf(b[param]));

export const formatMongoDbDecimal = (num: unknown) => {
    if (!num) return;
    if (typeof num !== "string") return num;
    return mongoose.Types.Decimal128.fromString((num).replace(",", "."));
}

/**
 * Helper to normalize a given field value into a string.
 * Removes diacritics and non-alphanumeric characters.
 * @param value - The value to normalize. Can be string, array, or object.
 * @returns A promise that resolves to a normalized string.
 */
async function normalizeFieldValue(value: any): Promise<string> {
    if (!value) return '';

    if (Array.isArray(value)) {
        const normalizedValues = await Promise.all(
            value.map(async (item) => {
                const autor = await Autor.findById(item);
                if (autor) {
                    return diacritics.remove(`${autor.firstName ?? ''} ${autor.lastName ?? ''}`);
                }
                return typeof item === 'string' ? diacritics.remove(item) : '';
            })
        );
        return diacritics
            .remove(normalizedValues.filter(Boolean).join(', ') ?? '')
            .replace(/[^a-zA-Z0-9\s]/g, ''); // Remove non-alphanumeric characters
    }

    if (typeof value === 'object') {
        const { title, publisher }: any = value;
        return diacritics
            .remove(title ?? publisher ?? '')
            .replace(/[^a-zA-Z0-9\s]/g, ''); // Remove non-alphanumeric characters
    }

    // For single string values
    return diacritics
        .remove(value ?? '')
        .replace(/[^a-zA-Z0-9\s]/g, ''); // Remove non-alphanumeric characters
}

/**
 * Safely sets a value into a nested object based on a nested path.
 * @param obj - The object to modify.
 * @param path - An array of keys representing the path, e.g., ["serie", "title"].
 * @param value - The value to set.
 */
function setNestedValue(obj: Record<string, any>, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key]) {
            current[key] = {}; // Create the object if it doesn't exist
        }
        current = current[key];
    }
    current[path[path.length - 1]] = value;
}

/**
 * Normalizes specified fields into a nested JSON object where keys are field names, and values are normalized strings.
 * Only fields with non-empty normalized values are included.
 * @param doc - Document containing the fields to normalize.
 * @param model - choose what model are being normalized.
 * @returns A promise that resolves to a nested object with normalized search fields.
 */
export async function normalizeSearchFields(doc: any, model: string): Promise<Record<string, any>> {
    const normalizedFields: Record<string, any> = {};

    let fieldsToNormalize: Record<string, any> = {};
    switch (model) {
        case "book":
            fieldsToNormalize = {
                autor: doc.autor,
                editor: doc.editor,
                ilustrator: doc.ilustrator,
                translator: doc.translator,
                title: doc.title,
                subtitle: doc.subtitle,
                edition: doc.edition,
                serie: doc.serie,
                note: doc.note,
                published: doc.published,
                ISBN: doc.ISBN,
            };
            break
        case "autor":
            fieldsToNormalize = {
                firstName: doc.firstName,
                lastName: doc.lastName,
            };
            break;
        case "lp":
            fieldsToNormalize = {
                title: doc.title,
                subtitle: doc.subtitle,
                note: doc.note,
                published: doc.published,
            };
            break;
        case "boardGame":
            fieldsToNormalize = {
                title: doc.title,
                published: doc.published,
                autor: doc.autor
            };
            break;
        default:
            console.error("Unknown model")
    }

    // Normalize fields and add them as nested properties
    for (const [key, value] of Object.entries(fieldsToNormalize)) {
        if (key === "ISBN") {
            normalizedFields["ISBN"] = (value as string)?.replace(/-/g, "");
            break;
        }

        const normalizedValue = await normalizeFieldValue(value);
        if (normalizedValue) {
            // Handle nested paths (e.g., "edition.title") by splitting by "."
            const path = key.split('.');
            setNestedValue(normalizedFields, path, normalizedValue);
        }
    }

    // Handle `content` field separately
    const content = doc.content?.length > 0 ? diacritics.remove(doc.content.join(', ')) : '';
    if (content) {
        normalizedFields['content'] = content;
    }

    return normalizedFields;
}

/**
 * Creates a MongoDB $lookup stage for aggregation pipelines with collection name validation.
 * @param from - The name of the foreign collection to join with.
 * @param localField - Field in the current collection to match with the foreign collection.
 * @param as - Name of the output array field for joined documents.
 * @returns A $lookup stage object or throws an error if collection doesn't exist.
 */
export const createLookupStage = (from: string, localField: string, as: string) => {
    // Normalize collection name to lowercase (MongoDB collection names are case-sensitive)
    const normalizedFrom = from.toLowerCase();

    // Check if collection exists in the database
    if (!mongoose.connection.collections[normalizedFrom]) {
        console.warn(`Warning: Collection "${from}" might not exist or is not properly formatted.`);
    }

    return {
        $lookup: { from: normalizedFrom, localField, foreignField: "_id", as }
    };
};

export const stringifyName = (doc: any) => {
    if (doc.firstName && doc.lastName) {
        return `${doc.lastName}, ${doc.firstName}`;
    } else if (doc.firstName) {
        return doc.firstName;
    } else if (doc.lastName) {
        return doc.lastName;
    }
    return "";
};
