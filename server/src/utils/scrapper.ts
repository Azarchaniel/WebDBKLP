import axios from 'axios';
import xml2js from 'xml2js';
import Autor from '../models/autor';
import puppeteer, { Page } from 'puppeteer';

enum GoodReadsRoles {
    AUTHOR = "",
    EDITOR = "Editor",
    ILUSTRATOR = "Illustrator",
    TRANSLATOR = "Translator",
}

/**
 * Merges two objects, preferring values from the second object but only if they are truthy.
 * This preserves values from the first object when the second object has falsy values.
 * 
 * @param baseObj - The base object to merge into
 * @param overrideObj - The object with override values
 * @returns A new object with merged values
 */
const mergeObjects = (baseObj: any, overrideObj: any): any => {
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

const mapDBKlanguageToLangCode = (languageFromDBK: string | undefined): string | undefined => {
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
};

const mapGRlanguageToCode = (languageFromDBK: string | undefined): string | undefined => {
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
};

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

const filterAuthorsFromGR = (authors: any[], role: GoodReadsRoles): string[] => {
    return authors
        .filter(author => author.role.includes(role))
        .map(author => author.name[0]);
};

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
                        firstName: {
                            $regex: `^${firstName.charAt(0)}\\.?$`,
                            $options: 'i'
                        }
                    });
                }

                queryOptions = [
                    {
                        $and: [
                            queryOptions[0],
                            firstName ? { $or: firstNameConditions } : {}
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
};

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

/**
 * If there is no direct selector, find by text label and take the next sibling
 */
const extractLabeledData = async (page: Page, labelText: string): Promise<string | null> => {
    try {
        const data = await page.evaluate((label) => {
            const spans = Array.from(document.querySelectorAll('span.category'));
            const labelElement = spans.find(span => span.textContent?.includes(label));
            if (labelElement && labelElement.nextElementSibling) {
                return labelElement.nextElementSibling.textContent?.trim() || null;
            }
            return null;
        }, labelText);
        return data;
    } catch {
        return null;
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

const databazeKnih = async (isbn: string): Promise<object | boolean> => {
    try {
        console.log("DK called ", isbn);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'],
            timeout: 0
        });

        const page: Page = await browser.newPage();
        await page.goto('https://www.databazeknih.cz/search?q=' + isbn);

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
            await getContentFromElement(page, "h1[class*='od']");

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

        const urlDB = page.url();

        // Image extraction with fallbacks
        let imgHref = '';
        try {
            imgHref = await page.$eval("img[class*='kniha_img']", el => (el as HTMLImageElement).src);
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

    } catch (error) {
        console.error("Error in databazeKnih", error);
        return {};
    }
};

const fetchGoogleBook = async (isbn: string): Promise<object | boolean> => {
    try {
        console.info("Google Books API called ", isbn);

        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
            params: {
                q: `isbn:${isbn}`
            },
            timeout: 5000
        });

        if (!response.data || response.data.totalItems === 0) {
            console.error(`Book with ISBN ${isbn} not found in Google Books`);
            return false;
        }

        const bookData = response.data.items[0];
        let volumeInfo = bookData.volumeInfo;

        // Fetch detailed information using the volume ID to get additional data like dimensions
        try {
            const detailedResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes/${bookData.id}`, {
                timeout: 5000
            });
            if (detailedResponse.data && detailedResponse.data.volumeInfo) {
                // Merge detailed info with basic info
                volumeInfo = { ...volumeInfo, ...detailedResponse.data.volumeInfo };
            }
        } catch (detailError) {
            console.log(`Could not fetch detailed info for volume ${bookData.id}, using basic info`);
        }

        // Extract ISBN (prefer ISBN_13, fallback to ISBN_10)
        const isbnIdentifier = volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier
            || volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier
            || isbn;

        // Extract language code
        const languageCode = volumeInfo.language ? [volumeInfo.language] : [];

        // Extract year from publishedDate (format: YYYY-MM-DD or YYYY)
        const year = volumeInfo.publishedDate?.split('-')[0] || '';

        // Get thumbnail image URL (prefer larger thumbnail if available)
        const imageUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';

        // Extract dimensions if available
        const dimensions: any = {};
        if (volumeInfo.dimensions) {
            if (volumeInfo.dimensions.height) {
                dimensions.height = parseFloat(volumeInfo.dimensions.height);
            }
            if (volumeInfo.dimensions.width) {
                dimensions.width = parseFloat(volumeInfo.dimensions.width);
            }
            if (volumeInfo.dimensions.thickness) {
                dimensions.thickness = parseFloat(volumeInfo.dimensions.thickness);
            }
        }

        const book = {
            title: volumeInfo.title || '',
            subtitle: volumeInfo.subtitle || '',
            autor: volumeInfo.authors || [],
            published: {
                publisher: volumeInfo.publisher || '',
                year: year,
                country: languageCode,
            },
            numberOfPages: (volumeInfo.printedPageCount || volumeInfo.pageCount)?.toString() || '',
            ISBN: isbnIdentifier,
            language: languageCode,
            categories: volumeInfo.categories || [],
            ...(Object.keys(dimensions).length > 0 && { dimensions }),
            picture: imageUrl,
            hrefGoogleBooks: volumeInfo.infoLink || '',
            previewLink: volumeInfo.previewLink || '',
        };

        return book;
    } catch (error: any) {
        if (error.code === 'ECONNABORTED') {
            console.error(`Google Books API timed out for ISBN ${isbn}`);
        } else if (error.response) {
            console.error(`Google Books API error: ${error.response.status} for ISBN ${isbn}`);
        } else {
            console.error("Error in googleBook", error.message);
        }
        return false;
    }
};

export const webScrapper = async (isbn: string): Promise<any> => {
    const originalIsbn = isbn;
    isbn = isbn.replace(/[^0-9X]/gi, '');

    let dkBook: any, googleBook: any;

    // Promise.allSettled runs both in parallel but won't fail if one fails
    const results = await Promise.allSettled([databazeKnih(isbn), fetchGoogleBook(isbn)]);

    dkBook = results[0].status === 'fulfilled' ? results[0].value : null;
    googleBook = results[1].status === 'fulfilled' ? results[1].value : null;

    if (!dkBook) {
        console.error('Failed to fetch data from databazeKnih');
    }
    if (!googleBook) {
        console.error('Failed to fetch data from Google Books');
    }

    // If both sources failed, return false
    if (!dkBook && !googleBook) {
        console.error("Book not found in any source", isbn);
        return false;
    }

    // Merge the data, using whichever source(s) succeeded
    const mergedBook = dkBook && googleBook
        ? mergeObjects(googleBook, dkBook)
        : (dkBook || googleBook);
    mergedBook.ISBN = mergedBook?.ISBN?.includes('-') ? mergedBook.ISBN : originalIsbn;

    const finalBook = {
        ...mergedBook,
        autor: await getAuthorsIDandUnique(mergedBook.autor),
        translator: await getAuthorsIDandUnique(mergedBook.translator),
        ilustrator: await getAuthorsIDandUnique(mergedBook.ilustrator),
        editor: await getAuthorsIDandUnique(mergedBook.editor),
    };

    return trimNestedStrings(finalBook);
};
