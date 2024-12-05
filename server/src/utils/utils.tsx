import puppeteer, {Page} from 'puppeteer';
import axios from "axios";
import xml2js from "xml2js";

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


const databazeKnih = async (isbn: string): Promise<object | boolean> => {
    try {
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
        const autor = await getContentFromElement(page, "h2[class='jmenaautoru']");
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
        const imgHref = await page.$eval("img[class='kniha_img']", el => el.src);

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
        return false;
    }
}

const goodreads = async (isbn: string): Promise<object | boolean> => {
    if (isbn.length < 10) return false;
    try {
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
            picture: bookFetched.image_url,
        };
    } catch (error) {
        console.error("Error in goodReads", error);
        return false;
    }
}

export const webScrapper = async (isbn: string): Promise<any> => {
    const originalIsbn = isbn;
    isbn = isbn.replace(/[^0-9X]/gi, '');

    let dkBook: any, grBook: any;

    if (isbn.slice(3, 5) === "80" || isbn.length < 10) {
        [dkBook, grBook] = await Promise.all([databazeKnih(isbn), goodreads(isbn)]); //Promise.all, so it runs at the same time
    } else {
        grBook = await goodreads(isbn);
    }

    //TODO: if grBook is different than dkBook, send warning or do something
    //TODO: add logic, if author is known, change the name to ID; if not known, create
    const finalBook = {...grBook, ...dkBook, ISBN: originalIsbn}; //prefer DBK, so it is overwriting
    console.log(finalBook)
    return trimNestedStrings(finalBook);
}