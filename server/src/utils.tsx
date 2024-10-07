import puppeteer from 'puppeteer';

const databazeKnih = async (isbn: string) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.databazeknih.cz/search?q=' + isbn);
    await page.setViewport({width: 1080, height: 1024});

    const titleEl = await page.locator("h1[itemprop='name']").waitHandle();
    const title = await titleEl?.evaluate(el => el.textContent);
    console.log(title);

    //https://dev.to/code_jedi/web-scraping-in-nodejs-2lkf
    browser.close();
}

const goodreads = async (isbn: string) => {

}

export const webScrapper = async (isbn: string) => {
    console.log("web scrapper called", isbn);
    isbn = isbn.replace(/[^0-9X]/gi, '');

    if (isbn.slice(3,5) === "80") {
        //call Databaze knih, because non CZ SK books won't be there
        await databazeKnih(isbn);
    }
}