import puppeteer from "puppeteer/lib/esm/puppeteer/node-puppeteer-core";

const databazeKnih = async (isbn: string) => {
    const modifIsbn = isbn.replace("-","");
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    await page.goto('https://www.databazeknih.cz/search?q=' + modifIsbn);


    //https://dev.to/code_jedi/web-scraping-in-nodejs-2lkf
}

const goodReads = async (isbn: string) => {

}

export const webScrapper = async (isbn: string) => {


}