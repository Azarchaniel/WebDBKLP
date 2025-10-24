import puppeteer, { Page } from 'puppeteer';
import axios from "axios";
import xml2js from "xml2js";
import Autor from "../models/autor";
import mongoose from "mongoose";
import diacritics from 'diacritics';

enum GoodReadsRoles {
    AUTHOR = "",
    EDITOR = "Editor",
    ILUSTRATOR = "Illustrator",
    TRANSLATOR = "Translator",
}

export const getIdFromArray = (arrOfObj: Object[]) => {
    return arrOfObj?.map(obj => {
        if (!("_id" in obj)) {
            throw Error("Object does not have _id!");
        }
        return obj._id;
    })
}

const getContentFromElement = async (
    page: Page,
    selector: string,
    optional: boolean = false
): Promise<string | undefined> => {
    try {
        const element = await page.$(selector);
        if (!element) {
            return optional ? undefined : '';
        }
        const text = await page.evaluate(el => el?.textContent?.trim() || '', element);
        return text || undefined;
    } catch (error) {
        if (optional) return undefined;
        console.log(`Selector ${selector} not found`);
        return undefined;
    }
};

const getNumberFromString = (str: string | undefined): string => str?.match(/\d+/)?.shift() ?? "";

const mapDBKlanguageToLangCode = (languageFromDBK: string | undefined) => {
    switch (languageFromDBK) {
        case "slovenský":
            return "sk";
        case "český":
            return "cz";
        case "anglický":
            return "en";
        default:
            return languageFromDBK;
    }
}

const mapGRlanguageToCode = (languageFromDBK: string | undefined) => {
    switch (languageFromDBK) {
        case "slo":
        case "SK":
            return "sk";
        case "cze":
        case "CZ":
            return "cz";
        case "eng":
            return "en";
        default:
            return languageFromDBK;
    }
}

const trimNestedStrings = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Return if it's not an object or is null
    }

    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key]
                .trim()                // Trim leading/trailing spaces
                .replace(/\n/g, '')    // Remove newlines
                .replace(/\s+/g, ' '); // Replace multiple spaces with one
        } else if (typeof obj[key] === 'object') {
            trimNestedStrings(obj[key]); // Recursively handle nested objects
        }
    }

    return obj;
};

const filterAuthorsFromGR = (authors: any[], role: GoodReadsRoles) => {
    return authors
        .filter(author => author.role.includes(role))
        .map(author => author.name[0]);
}

const getAuthorsIDandUnique = async (authors: string[]) => {
    try {
        if (!authors) return;

        const foundAuthors = [];

        if (authors.length === 1 && authors[0].match(/\s{3,}/g)) {
            authors = authors[0]
                .split(/\s{3,}/g)
                .map(s => s.trim().replace(/\s{3,}/g, " ").replace(",", ""))
                .filter(Boolean);
        }

        for (let author of authors) {
            const splitted = author.split(" ");
            //@ts-ignore
            let { firstName, lastName } = "";

            // if name consist of only one word
            if (splitted?.length === 1) {
                lastName = splitted[0];
            } else {
                firstName = splitted.slice(0, splitted?.length - 1).join();
                lastName = splitted[splitted?.length - 1];
            }

            if (!lastName || firstName.includes("*") || firstName === "kolektiv") return;

            let queryOptions: any[] = [
                {
                    lastName: {
                        $regex: `^${lastName.replace(/ová$/i, '')}(ová)?$`,
                        $options: 'i'
                    }
                }
            ];

            if (firstName) {
                const firstNameConditions: any[] = [
                    { firstName: firstName }
                ];

                if (!firstName.includes(".")) {
                    firstNameConditions.push({
                        firstName: firstName
                            ?.split(" ")
                            .map((word: string[]) => word[0] + ". ")
                            .join("")
                            .trim()
                    });
                }

                queryOptions = [
                    {
                        $and: [
                            queryOptions[0], // Prioritize lastName condition
                            firstName ? { $or: firstNameConditions } : {} // Include firstName conditions only when lastName matches
                        ]
                    }
                ];
            }

            let foundAuthor = await Autor.findOne({ $or: queryOptions }).collation({ locale: "cs", strength: 1 });

            if (!foundAuthor) {
                foundAuthor = await Autor.create({ firstName: firstName, lastName: lastName });
            }

            //cleaning obj, so there is no hidden params from Mongo
            foundAuthors.push({
                _id: foundAuthor._id,
                lastName: foundAuthor.lastName,
                firstName: foundAuthor.firstName,
                fullName: `${foundAuthor.lastName ?? ""}${foundAuthor.firstName ? ", " + foundAuthor.firstName : ""}`,
            });
        }

        // remove duplicates
        return foundAuthors.filter((doc, index, self) =>
            index === self.findIndex(d => d.firstName === doc.firstName && d.lastName === doc.lastName)
        );
    } catch (err) {
        console.error("Cannot get author from webScrapping", err);
    }
}

/**
 * If there is no direct selector, find by text label and take the next sibling
 * @param page 
 * @param labelText 
 * @returns 
 */
const extractLabeledData = async (page: Page, labelText: string): Promise<string | null> => {
    return await page.evaluate((label) => {
        const labelElement = Array.from(document.querySelectorAll('span.category'))
            .find(span => span.textContent?.includes(label));
        if (labelElement && labelElement.nextElementSibling) {
            return labelElement.nextElementSibling.textContent?.trim() || null;
        }
        return null;
    }, labelText);
};

const DATABAZE_KNIH_TIMEOUT_MS = 8000; // 8 seconds overall per navigation / wait
const databazeKnih = async (isbn: string): Promise<object | boolean> => {
    try {
        console.info("DK called ", isbn);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'],
            timeout: 0
        });

        const page: Page = await browser.newPage();
        // Apply stricter (8s) timeouts for all waits & navigation
        page.setDefaultNavigationTimeout(DATABAZE_KNIH_TIMEOUT_MS);
        page.setDefaultTimeout(DATABAZE_KNIH_TIMEOUT_MS);

        try {
            await page.goto('https://www.databazeknih.cz/search?q=' + isbn, {
                timeout: DATABAZE_KNIH_TIMEOUT_MS,
                waitUntil: 'domcontentloaded'
            });
        } catch (navErr: any) {
            if (navErr?.name === 'TimeoutError') {
                console.error(`databazeKnih navigation timed out after ${DATABAZE_KNIH_TIMEOUT_MS}ms for ISBN ${isbn}`);
            } else {
                console.error(`databazeKnih navigation error for ISBN ${isbn}`, navErr);
            }
            await browser.close();
            return false; // early exit on navigation failure
        }

        // Check if no book was found
        const noBookFound = await getContentFromElement(page, "h1[class='oddown']", true);
        if (noBookFound) {
            console.error(`Book ${isbn} not found.`);
            await browser.close();
            return false;
        }

        // Click on the first book result - need to find the correct link
        // Usually the first result is in a link that goes to the book detail page
        try {
            await page.waitForSelector('a[href*="/knihy/"]', { timeout: 5000 });
            await page.click('a[href*="/knihy/"]');
        } catch (error) {
            await page.waitForSelector('a[href*="/prehled-knihy/"]', { timeout: 5000 });
            await page.click('a[href*="/prehled-knihy/"]');
        }

        // Alternative approach for "více info..." - look for JavaScript link or specific selectors
        try {
            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const viceInfoLink = links.find(link =>
                    link.textContent?.includes('více info') ||
                    link.textContent?.includes('více info...')
                );
                if (viceInfoLink) {
                    viceInfoLink.click();
                }
            });
            await new Promise(r => setTimeout(r, 1500));
        } catch (error) {
            console.log("JavaScript approach for 'více info...' failed");
        }

        // Extract book data - using more robust selectors
        const title = await getContentFromElement(page, "h1") ||
            await getContentFromElement(page, "h1[class='oddown_five']");

        const autor = await getContentFromElement(page, "span[class='author']") ||
            await getContentFromElement(page, "a[href*='/autori/']");

        const translator = await getContentFromElement(page, "span[itemprop='translator']");
        const ilustrator = await getContentFromElement(page, "span[itemprop='ilustrator']");

        // Year and publisher - may be in different formats
        const yearOfPublish = await getContentFromElement(page, "span[itemprop='datePublished']") ||
            await extractYearFromText(page);

        const publisher = await getContentFromElement(page, "span[itemprop='publisher']") ||
            await getContentFromElement(page, "a[href*='/nakladatelstvi/']");

        const noPages = await getContentFromElement(page, "span[itemprop='numberOfPages']");

        let isbnFound = await getContentFromElement(page, "span[itemprop='isbn']");
        if (!isbnFound) {
            // Alternative: look for ISBN in text content using regex
            isbnFound = await page.evaluate(() => {
                const bodyText = document.body.textContent || '';
                const isbnMatch = bodyText.match(/ISBN:?\s*([0-9-]{10,17})/i);
                return isbnMatch ? isbnMatch[1] : undefined;
            });
        }

        const language = await extractLabeledData(page, "Jazyk vydání:") || await getContentFromElement(page, "span[itemprop='language']");

        // Series information
        const serieTitle = await getContentFromElement(page, "a[class='odright_pet']") ||
            await getContentFromElement(page, "a[href*='/serie/']");
        const serieNo = getNumberFromString(await getContentFromElement(page, "span[class='odright_pet']"));

        // Edition information
        const editionTitle = await extractLabeledData(page, "Edice:");
        const editionNo = getNumberFromString(await getContentFromElement(page, "em[class='info st_normal']"));

        const urlDB = await page.evaluate(() => location.href);

        // Image extraction with fallbacks
        let imgHref = '';
        try {
            imgHref = await page.$eval("img[alt*='Obálka knihy ']", el => (el as HTMLImageElement).src);
        } catch {
            try {
                imgHref = await page.$eval("img[class*='cover']", el => (el as HTMLImageElement).src);
            } catch {
                console.log("Book cover image not found");
            }
        }

        await browser.close();

        const book = {
            title: title?.replace(" přehled", "").trim(),
            autor: [autor].map(autor => autor?.replace(" (p)", "").trim()).filter(Boolean),
            translator: [translator].filter(Boolean),
            ilustrator: [ilustrator].filter(Boolean),
            published: {
                publisher: publisher?.trim(),
                year: yearOfPublish?.trim(),
                country: language ? [mapDBKlanguageToLangCode(language)] : [],
            },
            numberOfPages: noPages?.trim(),
            ISBN: isbnFound?.trim(),
            language: language ? [mapDBKlanguageToLangCode(language)] : [],
            serie: {
                title: serieTitle?.trim(),
                no: serieNo,
            },
            edition: {
                title: editionTitle?.trim(),
                no: editionNo,
            },
            hrefDatabazeKnih: urlDB,
            picture: imgHref,
        };

        return book;

    } catch (error: any) {
        if (error?.name === 'TimeoutError') {
            console.error(`databazeKnih timed out (global catch) after ${DATABAZE_KNIH_TIMEOUT_MS}ms`);
            return false;
        }
        console.error("Error in databazeKnih", error);
        return {};
    }
};

// Helper function to extract year from text content
const extractYearFromText = async (page: Page): Promise<string | null> => {
    try {
        const yearText = await page.evaluate(() => {
            const text = document.body.textContent || '';
            const yearMatch = text.match(/Vydáno:\s*(\d{4})/);
            return yearMatch ? yearMatch[1] : null;
        });
        return yearText;
    } catch {
        return null;
    }
};

/**
 * Merges two objects, preferring values from the second object but only if they are truthy.
 * This preserves values from the first object when the second object has falsy values.
 * 
 * @param baseObj - The base object to merge into
 * @param overrideObj - The object with override values
 * @returns A new object with merged values
 */
export const mergeObjects = (baseObj: any, overrideObj: any): any => {
    // Create a deep copy of the base object to avoid mutations
    const result = { ...baseObj };

    // Iterate through all properties of the override object
    for (const key in overrideObj) {
        if (Object.prototype.hasOwnProperty.call(overrideObj, key)) {
            const overrideValue = overrideObj[key];

            // If value is an object (but not null), recursively merge
            if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
                // Initialize as empty object if the property doesn't exist in result
                result[key] = result[key] || {};
                // Recursively merge nested properties, only if they have truthy values
                for (const subKey in overrideValue) {
                    if (Object.prototype.hasOwnProperty.call(overrideValue, subKey) && overrideValue[subKey]) {
                        result[key][subKey] = overrideValue[subKey];
                    }
                }
            }
            // For arrays, check if there's at least one non-empty string or truthy value
            else if (Array.isArray(overrideValue)) {
                // Only use the override array if it contains at least one meaningful value
                const hasValidContent = overrideValue.some(item => {
                    // For strings, check if they're non-empty after trimming
                    if (typeof item === 'string') {
                        return item.trim() !== '';
                    }
                    // For other types, check if they're truthy
                    return !!item;
                });

                if (hasValidContent) {
                    result[key] = overrideValue;
                }
            }
            // For primitive values, only override if truthy
            else if (overrideValue) {
                result[key] = overrideValue;
            }
        }
    }

    return result;
};

const goodreads = async (isbn: string): Promise<object | boolean> => {
    if (isbn.length < 10) return false;
    try {
        console.info("GR called ", isbn);

        const url = `https://www.goodreads.com/book/isbn/${isbn}?key=cvAALPZ596Xc4Fnrv6pnw`;
        const response = await axios.get(url);
        const parser = new xml2js.Parser();
        const json = await parser.parseStringPromise(response.data);

        const bookFetched = json.GoodreadsResponse.book[0];

        const { author } = bookFetched.authors[0];

        return {
            title: bookFetched.title[0],
            autor: filterAuthorsFromGR(author, GoodReadsRoles.AUTHOR),
            translator: filterAuthorsFromGR(author, GoodReadsRoles.TRANSLATOR),
            ilustrator: filterAuthorsFromGR(author, GoodReadsRoles.ILUSTRATOR),
            editor: filterAuthorsFromGR(author, GoodReadsRoles.EDITOR),
            published: {
                publisher: bookFetched.publisher[0],
                year: bookFetched.publication_year[0],
                country: [mapGRlanguageToCode(bookFetched.country_code[0])],
            },
            ISBN: bookFetched.isbn13 ?? bookFetched.isbn,
            numberOfPages: bookFetched.num_pages[0],
            language: [mapGRlanguageToCode(bookFetched.language_code[0])],
            hrefGoodReads: bookFetched.url[0],
            picture: bookFetched.image_url[0],
        };
    } catch (error: any) {
        console.error("Error in goodReads", error.status, error.code);
        return {};
    }
}

export const webScrapper = async (isbn: string): Promise<any> => {
    const originalIsbn = isbn;
    isbn = isbn.replace(/[^0-9X]/gi, '');

    let dkBook: any, grBook: any;

    if ((isbn.slice(3, 5) === "80" || isbn.slice(0, 2) === "80") || isbn.length < 10) {
        const results = await Promise.allSettled([databazeKnih(isbn), goodreads(isbn)]); //Promise.allSettled, so it runs at the same time but wont fail if one fail

        dkBook = results[0].status === 'fulfilled' ? results[0].value : null;
        grBook = results[1].status === 'fulfilled' ? results[1].value : null;

        if (!dkBook) {
            console.error('Failed to fetch data from databazeKnih');
        }
        if (!grBook) {
            console.error('Failed to fetch data from goodreads');
        }
    } else {
        grBook = await goodreads(isbn);
    }

    if (!dkBook || !grBook) {
        console.error("Book not found", isbn);
        return false;
    }

    //TODO: if grBook is different than dkBook, send warning or do something
    const mergedBook = mergeObjects(grBook, dkBook);
    mergedBook.ISBN = mergedBook?.ISBN?.includes("-") ? mergedBook.ISBN : originalIsbn;

    const finalBook = {
        ...mergedBook,
        autor: await getAuthorsIDandUnique(mergedBook.autor),
        translator: await getAuthorsIDandUnique(mergedBook.translator),
        ilustrator: await getAuthorsIDandUnique(mergedBook.ilustrator),
        editor: await getAuthorsIDandUnique(mergedBook.editor),
    };

    return trimNestedStrings(finalBook);
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
