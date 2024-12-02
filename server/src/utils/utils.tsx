import puppeteer, {Page} from 'puppeteer';

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

const trimNestedStrings = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Return if it's not an object or is null
    }

    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim(); // Trim the string
        } else if (typeof obj[key] === 'object') {
            trimNestedStrings(obj[key]); // Recursively handle nested objects
        }
    }

    return obj;
}


const databazeKnih = async (isbn: string): Promise<object | boolean> => {
    console.log("databazeKnih");

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

        let book = {
            title,
            autor,
            translator,
            ilustrator,
            published: {
                publisher,
                year: yearOfPublish,
                country: mapDBKlanguageToLangCode(language),
            },
            numberOfPages: noPages,
            language: mapDBKlanguageToLangCode(language),
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

        book = trimNestedStrings(book);

        return book;
    } catch (error) {
        console.error("Error in databazeKnih", error);
        return false;
    }
}

const goodreads = async (isbn: string): Promise<object> => {
    return {};
}

export const webScrapper = async (isbn: string): Promise<any> => {
    console.log("web scrapper called", isbn);
    isbn = isbn.replace(/[^0-9X]/gi, '');

    let dkBook: any, grBook: any;

    if (isbn.slice(3, 5) === "80") {
        //call Databaze knih, because non CZ SK books won't be there
        dkBook = await databazeKnih(isbn);
        grBook = await goodreads(isbn);
    } else {
        grBook = await goodreads(isbn);
    }

    return {...dkBook, ...grBook};
}