import axios from 'axios';
import xml2js from 'xml2js';
import Autor from '../models/autor';
import { chromium } from 'playwright';

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

const DATABAZE_KNIH_TIMEOUT_MS = 8000; // 8 seconds

/**
 * Helper to get text content from a Playwright locator with timeout
 * Uses shorter timeout (500ms) since elements should be present after page load
 */
const getTextContent = async (page: any, selector: string, timeout: number = 500): Promise<string | null> => {
    return await page.locator(selector).first().textContent({ timeout }).catch(() => null);
};

/**
 * Helper to try multiple selectors and return the first successful text content
 * Only tries next selector if current one doesn't exist (faster than waiting for timeout)
 */
const getTextContentWithFallback = async (page: any, selectors: string[], timeout: number = 500): Promise<string | null> => {
    for (const selector of selectors) {
        // First check if element exists (fast)
        const count = await page.locator(selector).count();
        if (count > 0) {
            const text = await getTextContent(page, selector, timeout);
            if (text) return text;
        }
    }
    return null;
};

const fetchDatabazeKnih = async (isbn: string): Promise<object | boolean> => {
    let browser;
    try {
        console.info("DK called ", isbn);

        browser = await chromium.launch({
            headless: true,
            timeout: DATABAZE_KNIH_TIMEOUT_MS
        });

        const context = await browser.newContext();
        const page = await context.newPage();
        page.setDefaultTimeout(DATABAZE_KNIH_TIMEOUT_MS);
        page.setDefaultNavigationTimeout(DATABAZE_KNIH_TIMEOUT_MS);

        // Navigate to search page
        try {
            await page.goto(`https://www.databazeknih.cz/search?q=${isbn}`, {
                waitUntil: 'domcontentloaded',
                timeout: DATABAZE_KNIH_TIMEOUT_MS
            });
        } catch (navErr: any) {
            if (navErr?.name === 'TimeoutError') {
                console.error(`databazeKnih navigation timed out after ${DATABAZE_KNIH_TIMEOUT_MS}ms for ISBN ${isbn}`);
            } else {
                console.error(`databazeKnih navigation error for ISBN ${isbn}`, navErr);
            }
            await browser.close();
            return false;
        }

        // Check if no book was found
        const noBookFound = await page.locator('h1.oddown').first().textContent({ timeout: 3000 }).catch(() => null);
        if (noBookFound) {
            console.error(`Book ${isbn} not found.`);
            await browser.close();
            return false;
        }

        // Try to click "více info..." if it exists
        try {
            const viceInfoLink = page.locator('a:has-text("více info")').first();
            const viceInfoCount = await viceInfoLink.count();
            if (viceInfoCount > 0) {
                await viceInfoLink.click();
                await page.waitForTimeout(1500);
            }
        } catch (error) {
            console.log(`JavaScript approach for 'více info...' failed`);
        }

        // Extract book data using Playwright locators with helper functions
        const titleRaw = await getTextContentWithFallback(page, ['h1', 'h1.oddown_five']);
        const title = titleRaw?.replace(' přehled', '').trim() || '';

        const autor = await getTextContentWithFallback(page, ['span.author', 'a[href*="/autori/"]']);

        const translator = await getTextContent(page, 'span[itemprop="translator"]');
        const ilustrator = await getTextContent(page, 'span[itemprop="ilustrator"]');

        // Batch extract data using a single evaluate call for performance
        const extractedData = await page.evaluate(() => {
            // Extract year from body text
            const text = document.body.textContent || '';
            const yearMatch = text.match(/Vydáno:\s*(\d{4})/);
            const bodyYear = yearMatch ? yearMatch[1] : null;

            // Extract ISBN from body text
            const isbnMatch = text.match(/ISBN:?\s*([0-9-]{10,17})/i);
            const bodyIsbn = isbnMatch ? isbnMatch[1] : null;

            // Extract language from labeled data
            const langLabel = Array.from(document.querySelectorAll('span.category'))
                .find(span => span.textContent?.includes('Jazyk vydání:'));
            const labeledLanguage = langLabel && langLabel.nextElementSibling
                ? langLabel.nextElementSibling.textContent?.trim() || null
                : null;

            // Extract edition from labeled data
            const editionLabel = Array.from(document.querySelectorAll('span.category'))
                .find(span => span.textContent?.includes('Edice:'));
            const labeledEdition = editionLabel && editionLabel.nextElementSibling
                ? editionLabel.nextElementSibling.textContent?.trim() || null
                : null;

            return {
                bodyYear,
                bodyIsbn,
                labeledLanguage,
                labeledEdition
            };
        }).catch(() => ({ bodyYear: null, bodyIsbn: null, labeledLanguage: null, labeledEdition: null }));

        // Year and publisher
        const yearOfPublish = await getTextContent(page, 'span[itemprop="datePublished"]') || extractedData.bodyYear;
        const publisher = await getTextContentWithFallback(page, ['span[itemprop="publisher"]', 'a[href*="/nakladatelstvi/"]']);
        const noPages = await getTextContent(page, 'span[itemprop="numberOfPages"]');

        // ISBN
        const isbnFound = await getTextContent(page, 'span[itemprop="isbn"]') || extractedData.bodyIsbn;

        // Language
        const language = await getTextContent(page, 'span[itemprop="language"]') || extractedData.labeledLanguage;

        // Series information
        const serieTitle = await getTextContentWithFallback(page, ['a.odright_pet', 'a[href*="/serie/"]']);
        const serieNoText = await getTextContent(page, 'span.odright_pet');
        const serieNo = serieNoText?.match(/\d+/)?.shift() ?? "";

        // Edition information
        const editionTitle = extractedData.labeledEdition;
        const editionNoText = await getTextContent(page, 'em.info.st_normal');
        const editionNo = editionNoText?.match(/\d+/)?.shift() ?? "";

        const urlDB = page.url();

        // Image extraction with fallbacks
        let imgHref = '';
        try {
            const imgLocator = page.locator('img[alt*="Obálka knihy "]').first();
            if (await imgLocator.count() > 0) {
                imgHref = await imgLocator.getAttribute('src') || '';
            }
        } catch {
            try {
                const coverLocator = page.locator('img[class*="cover"]').first();
                if (await coverLocator.count() > 0) {
                    imgHref = await coverLocator.getAttribute('src') || '';
                }
            } catch {
                console.log("Book cover image not found");
            }
        }

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
        return false;
    } finally {
        if (browser) {
            await browser.close().catch((err) => console.error('Error closing browser:', err));
        }
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
                dimensions.depth = parseFloat(volumeInfo.dimensions.thickness);
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
    const results = await Promise.allSettled([fetchDatabazeKnih(isbn), fetchGoogleBook(isbn)]);

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
