import puppeteer, {Page} from 'puppeteer';
import axios from "axios";
import xml2js from "xml2js";
import Autor from "../models/autor";
import mongoose from "mongoose";

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

const getContentFromElement = async (page: Page, identificator: string, silent?: boolean): Promise<string | undefined> => {
    try {
        await page.waitForSelector(identificator, {timeout: 500});
        return await page.$eval(identificator, el => el.textContent?.trim());

    } catch (error) {
        if (!silent) console.warn(`Element not found for selector: ${identificator}`);
        return "";
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

        for (let author of authors) {
            const splitted = author.split(" ");
            //@ts-ignore
            let {firstName, lastName} = "";

            // if name consist of only one word
            if (splitted?.length === 1) {
                lastName = splitted[0];
            } else {
                firstName = splitted.slice(0, splitted?.length - 1).join();
                lastName = splitted[splitted?.length - 1];
            }

            if (!lastName) return;

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
                    {firstName: firstName}
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
                            {$or: firstNameConditions} // Include firstName conditions only when lastName matches
                        ]
                    },
                    ...queryOptions // Fall back to matching lastName alone
                ];
            }

            let foundAuthor = await Autor.findOne({$or: queryOptions}).collation({locale: "cs", strength: 1});


            if (!foundAuthor) {
                foundAuthor = await Autor.create({firstName: firstName, lastName: lastName});
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

const databazeKnih = async (isbn: string): Promise<object | boolean> => {
    try {
        console.log("DK called ", isbn);
        //TODO: giant security hole
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox'], timeout: 0});
        //const browser = await puppeteer.launch();

        const page: Page = await browser.newPage();
        await page.goto('https://www.databazeknih.cz/search?q=' + isbn);

        const noBookFound = await getContentFromElement(page, "h1[class='oddown']", true);

        if (noBookFound) {
            console.error(`Book ${isbn} not found.`);
            await browser.close();
            return false;
        }

        await page.click('a[href=""]');
        await page.waitForSelector("div[id='more_book_info']");

        const title = await getContentFromElement(page, "h1[itemprop='name']");
        const autor = await getContentFromElement(page, "span[itemprop='author']");
        const translator = await getContentFromElement(page, "span[itemprop='translator']");
        const ilustrator = await getContentFromElement(page, "span[itemprop='ilustrator']");
        const yearOfPublish = await getContentFromElement(page, "span[itemprop='datePublished']");
        const publisher = await getContentFromElement(page, "span[itemprop='publisher']");
        const noPages = await getContentFromElement(page, "span[itemprop='numberOfPages']");
        const language = await getContentFromElement(page, "span[itemprop='language']"); // TODO: normalize: slovencina
        const serieTitle = await getContentFromElement(page, "a[class='odright_pet']");
        const serieNo = getNumberFromString(await getContentFromElement(page, "span[class='odright_pet']"));
        const editionTitle = await getContentFromElement(page, "span[itemprop='bookEdition']");
        const editionNo = getNumberFromString(await getContentFromElement(page, "em[class='info st_normal']"));
        const urlDB = page.url();
        const imgHref = await page.$eval("img[class='kniha_img coverOnDetail']", el => el.src);

        await browser.close();

        return {
            title: title?.replace(" přehled", ""),
            autor: [autor].map(autor => autor?.replace(" (p)", "")),
            translator: [translator],
            ilustrator: [ilustrator],
            published: {
                publisher,
                year: yearOfPublish,
                country: [mapDBKlanguageToLangCode(language)],
            },
            numberOfPages: noPages,
            language: [mapDBKlanguageToLangCode(language)],
            serie: {
                title: serieTitle,
                no: serieNo,
            },
            edition: {
                title: editionTitle,
                no: editionNo,
            },
            hrefDatabazeKnih: urlDB,
            picture: imgHref,
        }
    } catch (error) {
        console.error("Error in databazeKnih", error);
        return {};
    }
}

const goodreads = async (isbn: string): Promise<object | boolean> => {
    if (isbn.length < 10) return false;
    try {
        console.log("GR called ", isbn);

        const url = `https://www.goodreads.com/book/isbn/${isbn}?key=${process.env.GOODREADS_API_KEY}`;
        const response = await axios.get(url);
        const parser = new xml2js.Parser();
        const json = await parser.parseStringPromise(response.data);

        const bookFetched = json.GoodreadsResponse.book[0];

        const {author} = bookFetched.authors[0];

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
    const mergedBook = {...grBook, ...dkBook, ISBN: originalIsbn}; //prefer DBK, so it is overwriting

    const finalBook = {
        ...mergedBook,
        autor: await getAuthorsIDandUnique(mergedBook.autor),
        translator: await getAuthorsIDandUnique(mergedBook.translator),
        ilustrator: await getAuthorsIDandUnique(mergedBook.ilustrator),
        editor: await getAuthorsIDandUnique(mergedBook.editor),
    };

    return trimNestedStrings(finalBook);
}

const customOrder = ['Ľuboš', 'Žaneta', 'Jakub', 'Jaroslav', 'Magdaléna', 'Csonka rodičia', 'Víša rodičia', ''];
export const sortByParam = (data: any, param: string) =>
    data.sort((a: any, b: any) => customOrder.indexOf(a[param]) - customOrder.indexOf(b[param]));

export const formatMongoDbDecimal = (num: string) => {
    return mongoose.Types.Decimal128.fromString((num).replace(",","."));
}