import axios from 'axios';
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
 */
const mergeObjects = (baseObj: any, overrideObj: any): any => {
    const result = { ...baseObj };
    for (const key in overrideObj) {
        if (Object.prototype.hasOwnProperty.call(overrideObj, key)) {
            const overrideValue = overrideObj[key];
            if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
                result[key] = result[key] || {};
                for (const subKey in overrideValue) {
                    if (Object.prototype.hasOwnProperty.call(overrideValue, subKey) && overrideValue[subKey]) {
                        result[key][subKey] = overrideValue[subKey];
                    }
                }
            } else if (Array.isArray(overrideValue)) {
                const hasValidContent = overrideValue.some(item =>
                    typeof item === 'string' ? item.trim() !== '' : !!item
                );
                if (hasValidContent) result[key] = overrideValue;
            } else if (overrideValue) {
                result[key] = overrideValue;
            }
        }
    }
    return result;
};

const mapDBKlanguageToLangCode = (languageFromDBK: string | undefined): string | undefined => {
    switch (languageFromDBK?.toLowerCase().trim()) {
        case "slovenský": case "slovenština": return "sk";
        case "český": case "čeština": return "cz";
        case "anglický": case "angličtina": return "en";
        case "německý": case "němčina": return "de";
        case "francouzský": case "francouzština": return "fr";
        case "polský": case "polština": return "pl";
        default: return languageFromDBK;
    }
};

const trimNestedStrings = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim().replace(/\n/g, '').replace(/\s+/g, ' ');
        } else if (typeof obj[key] === 'object') {
            trimNestedStrings(obj[key]);
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
                const firstNameConditions: any[] = [{ firstName: firstName }];
                if (!firstName.includes(".")) {
                    firstNameConditions.push({
                        firstName: { $regex: `^${firstName.charAt(0)}\\.?$`, $options: 'i' }
                    });
                }
                queryOptions = [{ $and: [queryOptions[0], firstName ? { $or: firstNameConditions } : {}] }];
            }

            let foundAuthor = await Autor.findOne({ $or: queryOptions }).collation({ locale: "cs", strength: 1 });

            if (!foundAuthor) {
                foundAuthor = await Autor.create({ firstName: firstName, lastName: lastName });
            }

            foundAuthors.push({
                _id: foundAuthor._id,
                lastName: foundAuthor.lastName,
                firstName: foundAuthor.firstName,
                fullName: `${foundAuthor.lastName ?? ""}${foundAuthor.firstName ? ", " + foundAuthor.firstName : ""}`,
            });
        }

        return foundAuthors.filter((doc, index, self) =>
            index === self.findIndex(d => d.firstName === doc.firstName && d.lastName === doc.lastName)
        );
    } catch (err) {
        console.error("Cannot get author from webScrapping", err);
    }
};

// ─── DK PAGE STRUCTURE (verified April 2026) ──────────────────────────────────
//
// URL patterns per book (all share the same SLUG):
//
//   /prehled-knihy/SLUG   ← primary target
//     · title in <h1> (strip <em> suffix)
//     · author in first <a href="/autori/…">
//     · year as text node after "Vydáno:"
//     · publisher in <a href="/nakladatelstvi/…">
//     · series in <a href="/serie/…"> + nearby "N. díl" text node
//     · original title as text "Originální název: …"
//     · ISBN in antikvariát <a href="…?isbn=XX-XXX…"> — no JS needed
//     · cover in <img src="/img/books/…">
//     · "více info..." JS toggle reveals: pages, language, translator,
//       illustrator, edition
//
//   /dalsi-vydani/SLUG    ← editions page; ISBN appears as plain "ISBN: …" text
//                            used as reliable ISBN fallback
//
//   /knihy/SLUG           ← comments page (no extra book metadata)
// ─────────────────────────────────────────────────────────────────────────────

/** Strip <em>/<i> children from <h1> and return clean title text. */
const extractTitle = (page: Page): Promise<string> =>
    page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return '';
        const clone = h1.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('em, i').forEach(el => el.remove());
        return clone.textContent?.trim() ?? '';
    });

/**
 * Extract publication year.
 * Tries:
 *  1. "Vydáno: YYYY" text node (inline or split across siblings)
 *  2. Year digit preceding the /nakladatelstvi/ publisher link (DK sometimes
 *     renders it as a bare "2026 ," without a "Vydáno:" label)
 */
const extractYear = (page: Page): Promise<string | undefined> =>
    page.evaluate(() => {
        const YEAR_RE = /(1[89]\d\d|20[0-3]\d)/;

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Text | null;
        while ((node = walker.nextNode() as Text)) {
            const text = node.textContent ?? '';
            const m1 = text.match(/Vydáno:\s*(\d{4})/);
            if (m1) return m1[1];
            if (text.trim() === 'Vydáno:') {
                let sib = node.nextSibling;
                while (sib) {
                    const val = sib.textContent?.trim() ?? '';
                    const m2 = val.match(/^(\d{4})/);
                    if (m2) return m2[1];
                    if (val) break;
                    sib = sib.nextSibling;
                }
            }
        }

        // Fallback: scan text nodes immediately before the publisher link.
        // DK sometimes renders "2026 , <a href="/nakladatelstvi/...">Argo</a>"
        // without a "Vydáno:" label on the overview page.
        const pubLink = document.querySelector('a[href*="/nakladatelstvi/"]');
        if (pubLink) {
            let prev = pubLink.previousSibling;
            while (prev) {
                const val = (prev.textContent ?? '').trim();
                const m = val.match(YEAR_RE);
                if (m) return m[1];
                if (val.length > 20) break;
                prev = prev.previousSibling;
            }
            // Also try the parent element's full text (catches inline concat)
            const parentText = pubLink.parentElement?.textContent ?? '';
            const m3 = parentText.match(YEAR_RE);
            if (m3) return m3[1];
        }

        return undefined;
    });

/** First /nakladatelstvi/ link text = publisher name. */
const extractPublisher = (page: Page): Promise<string | undefined> =>
    page.evaluate(() =>
        document.querySelector('a[href*="/nakladatelstvi/"]')?.textContent?.trim() ?? undefined
    );

/**
 * Series title from /serie/ link; series number from "N. díl" nearby.
 *
 * Actual HTML structure:
 *   <a href="/serie/artusova-smrt-9130">Artušova smrt</a> série
 *   <a href="/knihy/…prev…"><</a>
 *   \n2. díl\n
 *   <a href="/knihy/…next…">></a>
 *
 * The "N. díl" text is a raw text node between the two /knihy/ nav links,
 * NOT inside the /serie/ link's parent element.
 */
const extractSeries = (page: Page): Promise<{ title: string; no: string }> =>
    page.evaluate(() => {
        const serieLink = document.querySelector('a[href*="/serie/"]');
        if (!serieLink) return { title: '', no: '' };
        const title = serieLink.textContent?.trim() ?? '';

        // Walk ALL text nodes in the document looking for "N. díl"
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Text | null;
        while ((node = walker.nextNode() as Text)) {
            const text = node.textContent ?? '';
            const m = text.match(/(\d+)\.\s*díl/) ?? text.match(/díl\s*(\d+)/);
            if (m) return { title, no: m[1] };
        }
        return { title, no: '' };
    });

/**
 * "Originální název: Le morte d'Arthur, 1485" — text node on the overview page.
 */
const extractOriginalTitle = (page: Page): Promise<string | undefined> =>
    page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Text | null;
        while ((node = walker.nextNode() as Text)) {
            const text = node.textContent ?? '';
            const m = text.match(/Originální název:\s*(.+)/);
            if (m) return m[1].trim();
            if (text.trim() === 'Originální název:') {
                let sib = node.nextSibling;
                while (sib) {
                    const val = sib.textContent?.trim() ?? '';
                    if (val) return val;
                    sib = sib.nextSibling;
                }
            }
        }
        return undefined;
    });

/**
 * ISBN from the antikvariát link href — present on the overview page without any JS.
 * href pattern: …?isbn=80-7217-007-4&title=…
 */
const extractIsbnFromAntikvariat = (page: Page): Promise<string | undefined> =>
    page.evaluate(() => {
        const link = document.querySelector('a[href*="restorio.cz"]') as HTMLAnchorElement | null;
        if (!link) return undefined;
        const m = link.href.match(/[?&]isbn=([^&]+)/i);
        const val = m ? decodeURIComponent(m[1]) : undefined;
        // Ignore empty or placeholder values
        return val && val.length > 3 ? val : undefined;
    });

/**
 * Click the "více info…" toggle and extract the revealed fields directly from
 * the live DOM using page.evaluate().
 *
 * Uses a text-walker instead of querySelectorAll so it works regardless of
 * which HTML element DK uses for labels (span, td, div, p, li …).
 *
 * Also extracts year from "Vydáno:" which DK sometimes places inside this
 * hidden section rather than on the visible overview.
 */
const expandAndScrapeViceInfo = async (page: Page): Promise<{
    yearOfPublish?: string;
    numberOfPages?: string;
    language?: string;
    translator?: string[];
    illustrator?: string[];
    editionTitle?: string;
    editionNo?: string;
}> => {
    // Click the toggle and wait for JS to reveal the content
    try {
        await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('a, span, div, p, button'));
            const target = all.find(el =>
                el.children.length === 0 &&
                (el.textContent?.trim().toLowerCase().startsWith('více info') ?? false)
            );
            if (target) (target as HTMLElement).click();
        });
        await new Promise(r => setTimeout(r, 2500));
    } catch { /* non-fatal */ }

    return page.evaluate(() => {
        /**
         * Walk every text node and find the one that IS the label text.
         * Then resolve the associated value via:
         *   1. Inline "Label: value"   — captured from the same text node
         *   2. Next sibling text node  — adjacent text in the same parent
         *   3. Parent's next element sibling  (<span>L</span><span>V</span>)
         *   4. Grandparent's next element sibling  (<td>L</td><td>V</td>)
         */
        const valueAfterLabel = (labels: string[]): string | undefined => {
            for (const label of labels) {
                const labelEsc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const inlineRe = new RegExp('^' + labelEsc + ':?\\s+(.+)$', 'i');

                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                let node: Text | null;
                while ((node = walker.nextNode() as Text)) {
                    const text = (node.textContent ?? '').trim();

                    // Case 1: label and value in one text node ("Vydáno: 2026")
                    const inline = text.match(inlineRe);
                    if (inline) return inline[1].trim();

                    // Cases 2-4: text node IS the bare label
                    if (text !== label + ':' && text !== label) continue;

                    const parent = node.parentElement;
                    if (!parent) continue;

                    // Case 2: next sibling text node
                    let sib: Node | null = node.nextSibling;
                    while (sib) {
                        const val = (sib.textContent ?? '').trim();
                        if (val) return val;
                        sib = sib.nextSibling;
                    }

                    // Case 3: parent element's next element sibling
                    const parentSibEl = parent.nextElementSibling;
                    if (parentSibEl) {
                        const val = parentSibEl.textContent?.trim();
                        if (val && val !== text) return val;
                    }

                    // Case 4: grandparent's next element sibling
                    const grandSibEl = parent.parentElement?.nextElementSibling ?? null;
                    if (grandSibEl) {
                        const val = grandSibEl.textContent?.trim();
                        if (val && val !== text) return val;
                    }
                }
            }
            return undefined;
        };

        /**
         * Find <a> links whose href matches one of pathSegments, located in
         * the element immediately after the matching label text.
         */
        const linksAfterLabel = (labels: string[], pathSegments: string[]): string[] => {
            for (const label of labels) {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                let node: Text | null;
                while ((node = walker.nextNode() as Text)) {
                    const text = (node.textContent ?? '').trim();
                    if (text !== label + ':' && text !== label) continue;

                    const parent = node.parentElement;
                    if (!parent) continue;

                    const containers: (Element | null)[] = [
                        parent.nextElementSibling,
                        parent.parentElement?.nextElementSibling ?? null,
                    ];

                    const names: string[] = [];
                    for (const container of containers) {
                        if (!container) continue;
                        const links = container.tagName === 'A'
                            ? [container as HTMLAnchorElement]
                            : Array.from(container.querySelectorAll('a'));
                        for (const link of links) {
                            const href = (link as HTMLAnchorElement).href ?? '';
                            if (pathSegments.some(seg => href.includes('/' + seg + '/'))) {
                                const name = link.textContent?.trim() ?? '';
                                if (name) names.push(name);
                            }
                        }
                    }
                    if (names.length) return names;
                }
            }
            return [];
        };

        const result: Record<string, any> = {};

        // Year — "Vydáno:" may be inside this hidden section on some books
        const yearRaw = valueAfterLabel(['Vydáno']);
        if (yearRaw) {
            const m = yearRaw.match(/(1[89]\d\d|20[0-3]\d)/);
            if (m) result.yearOfPublish = m[1];
        }

        result.numberOfPages = valueAfterLabel(['Počet stran', 'Stran']);
        result.language = valueAfterLabel(['Jazyk vydání', 'Jazyk']);
        result.translator = linksAfterLabel(
            ['Překlad', 'Překladatel'],
            ['prekladatele', 'autori']
        );
        result.illustrator = linksAfterLabel(
            ['Ilustrace', 'Ilustrátor', 'Ilustrace/foto'],
            ['ilustratori', 'ilustrator', 'autori']
        );

        const editionRaw = valueAfterLabel(['Edice']);
        if (editionRaw) {
            const m = editionRaw.match(/^(.+?),\s*(\d+)\.\s*(?:svazek|díl|část)/i)
                ?? editionRaw.match(/^(.+?)\s*\((\d+)\.\)$/)
                ?? editionRaw.match(/^(.+?),\s*(\d+)$/);
            if (m) {
                result.editionTitle = m[1].trim();
                result.editionNo = m[2];
            } else {
                result.editionTitle = editionRaw;
            }
        }

        // Strip empty/null entries
        for (const k of Object.keys(result)) {
            if (result[k] === undefined || result[k] === null) delete result[k];
            if (Array.isArray(result[k]) && result[k].length === 0) delete result[k];
        }
        return result;
    });
};

/**
 * Fallback: navigate to /dalsi-vydani/ and read "ISBN: …" as plain text.
 * The editions page always renders this without JS.
 */
const fetchIsbnFromEditionsPage = async (page: Page, slug: string): Promise<string | undefined> => {
    try {
        await page.goto(
            `https://www.databazeknih.cz/dalsi-vydani/${slug}`,
            { waitUntil: 'domcontentloaded', timeout: 15000 }
        );

        return page.evaluate(() => {
            // Scan text nodes for "ISBN: …"
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let node: Text | null;
            while ((node = walker.nextNode() as Text)) {
                const text = node.textContent ?? '';
                const m = text.match(/ISBN:\s*([\dX][\d\-X]{7,16})/i);
                if (m) return m[1].trim();
                if (text.trim() === 'ISBN:') {
                    let sib = node.nextSibling;
                    while (sib) {
                        const val = sib.textContent?.trim() ?? '';
                        if (/^[\dX][\d\-X]{7,16}$/i.test(val)) return val;
                        if (val) break;
                        sib = sib.nextSibling;
                    }
                }
            }
            // Also check antikvariát link
            const link = document.querySelector('a[href*="restorio.cz"]') as HTMLAnchorElement | null;
            if (link) {
                const m2 = link.href.match(/[?&]isbn=([^&]+)/i);
                if (m2?.[1] && m2[1].length > 3) return decodeURIComponent(m2[1]);
            }
            return undefined;
        });
    } catch {
        return undefined;
    }
};

// ─── BROWSER SINGLETON ───────────────────────────────────────────────────────
// Reuse one Chromium process across all scrape calls — each puppeteer.launch()
// costs ~200 MB. With this pattern only one instance ever exists at a time.

let _browserInstance: import('puppeteer').Browser | null = null;
let _browserInitPromise: Promise<import('puppeteer').Browser> | null = null;

const getBrowser = async (): Promise<import('puppeteer').Browser> => {
    if (_browserInstance?.isConnected()) return _browserInstance;
    if (!_browserInitPromise) {
        _browserInitPromise = puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--disable-extensions',
                '--disable-background-networking',
            ],
            timeout: 0,
        }).then(browser => {
            _browserInstance = browser;
            _browserInitPromise = null;
            browser.once('disconnected', () => {
                _browserInstance = null;
            });
            return browser;
        }).catch(err => {
            _browserInitPromise = null;
            throw err;
        });
    }
    return _browserInitPromise;
};

// ─── MAIN DK SCRAPER ─────────────────────────────────────────────────────────

const databazeKnih = async (isbn: string): Promise<object | boolean> => {
    let page: Page | null = null;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();
        console.log("DK called ", isbn);

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Step 1: search by ISBN
        await page.goto('https://www.databazeknih.cz/search?q=' + isbn, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        const noBookFound = await page.$("h1[class='oddown']");
        if (noBookFound) {
            console.error(`Book ${isbn} not found on DK.`);
            return false;
        }

        // Step 2: extract the book URL from the search results and navigate directly.
        // We avoid page.click() entirely — it requires the element to be visible and
        // in the viewport, which is fragile. page.goto() with the extracted href is reliable.
        const bookUrl: string | null = await page.evaluate(() => {
            // Prefer /prehled-knihy/ links; fall back to /knihy/ links.
            const prehled = document.querySelector('a[href*="/prehled-knihy/"]') as HTMLAnchorElement | null;
            if (prehled) return prehled.href;
            const knihy = document.querySelector('a[href*="/knihy/"]') as HTMLAnchorElement | null;
            return knihy ? knihy.href : null;
        });

        if (!bookUrl) {
            console.error("No book result links found for ISBN", isbn);
            return false;
        }

        // Always land on the /prehled-knihy/ overview — convert /knihy/ URLs if needed, strip hash
        const overviewUrl = (bookUrl.includes('/knihy/') && !bookUrl.includes('/prehled-knihy/')
            ? bookUrl.replace('/knihy/', '/prehled-knihy/')
            : bookUrl).split('#')[0];

        await page.goto(overviewUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const slugMatch = overviewUrl.match(/\/prehled-knihy\/([^/?#]+)/);
        const slug = slugMatch ? slugMatch[1] : '';

        // Step 3: scrape the overview page
        const title = await extractTitle(page);
        const yearOfPublish = await extractYear(page);
        const publisher = await extractPublisher(page);
        const series = await extractSeries(page);
        const originalTitle = await extractOriginalTitle(page);

        // Authors: first /autori/ link on the page is the primary author.
        // After expanding "více info...", translator links also appear under /autori/,
        // so we grab only the author(s) visible BEFORE the toggle fires.
        const authors: string[] = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a[href*="/autori/"]'))
                .slice(0, 3) // generous upper bound — translator deduplicated later
                .map(el => el.textContent?.trim() ?? '')
                .filter(Boolean)
        );

        // ISBN from antikvariát link href — fastest, no extra request
        let isbnFound = await extractIsbnFromAntikvariat(page);

        // Cover image
        let imgHref = '';
        try {
            imgHref = await page.$eval(
                'img[src*="/img/books/"]',
                el => (el as HTMLImageElement).src
            );
        } catch {
            console.log("Book cover image not found");
        }

        // Step 4: expand "více info..." and extract hidden fields
        const extra = await expandAndScrapeViceInfo(page);

        // Step 5: ISBN fallback — check /dalsi-vydani/ page
        if (!isbnFound && slug) {
            isbnFound = await fetchIsbnFromEditionsPage(page, slug);
        }

        // Step 6: assemble result
        const langCode = extra.language
            ? [mapDBKlanguageToLangCode(extra.language)]
            : [];


        // Remove translator names from the authors list
        const extraTranslators = extra.translator ?? [];
        const translatorNamesLower = new Set(extraTranslators.map((t: string) => t.toLowerCase()));
        const cleanAuthors = authors
            .map(a => a.replace(' (p)', '').trim())
            .filter(a => a && !translatorNamesLower.has(a.toLowerCase()));

        const book = {
            title,
            originalTitle,
            autor: cleanAuthors,
            translator: extraTranslators,
            ilustrator: extra.illustrator ?? [],
            published: {
                publisher: publisher?.trim(),
                year: (yearOfPublish ?? extra.yearOfPublish)?.trim(),
                country: langCode,
            },
            numberOfPages: extra.numberOfPages?.trim(),
            ISBN: isbnFound?.trim(),
            language: langCode,
            serie: {
                title: series.title,
                no: series.no,
            },
            edition: {
                title: extra.editionTitle?.trim(),
                no: extra.editionNo ?? '',
            },
            hrefDatabazeKnih: overviewUrl.split('#')[0],
            picture: imgHref,
        };

        return book;

    } catch (error) {
        console.error("Error in databazeKnih", error);
        return false;
    } finally {
        await page?.close().catch(() => { });
    }
};

// ─── GOOGLE BOOKS ─────────────────────────────────────────────────

const fetchGoogleBook = async (isbn: string, attempt = 1): Promise<object | boolean> => {
    try {
        console.info("Google Books API called ", isbn);
        const googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY;
        if (!googleBooksApiKey) {
            console.warn('GOOGLE_BOOKS_API_KEY is missing at runtime; request will be sent without key.');
        }
        const searchParams = new URLSearchParams({
            q: `isbn:${isbn}`,
            ...(googleBooksApiKey ? { key: googleBooksApiKey } : {}),
        });

        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
            params: { q: `isbn:${isbn}`, ...(googleBooksApiKey ? { key: googleBooksApiKey } : {}) },
            timeout: 5000,
        });

        if (!response.data || response.data.totalItems === 0) {
            console.error(`Book with ISBN ${isbn} not found in Google Books`);
            return false;
        }

        const bookData = response.data.items[0];
        let volumeInfo = bookData.volumeInfo;

        try {
            const detailedResponse = await axios.get(
                `https://www.googleapis.com/books/v1/volumes/${bookData.id}`,
                {
                    params: { ...(googleBooksApiKey ? { key: googleBooksApiKey } : {}) },
                    timeout: 5000,
                }
            );
            if (detailedResponse.data?.volumeInfo) {
                volumeInfo = { ...volumeInfo, ...detailedResponse.data.volumeInfo };
            }
        } catch {
            console.log(`Could not fetch detailed info for volume ${bookData.id}`);
        }

        const isbnIdentifier =
            volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier
            ?? volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier
            ?? isbn;

        const languageCode = volumeInfo.language ? [volumeInfo.language] : [];
        const year = volumeInfo.publishedDate?.split('-')[0] || '';
        const imageUrl = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';

        const dimensions: any = {};
        if (volumeInfo.dimensions) {
            if (volumeInfo.dimensions.height) dimensions.height = parseFloat(volumeInfo.dimensions.height);
            if (volumeInfo.dimensions.width) dimensions.width = parseFloat(volumeInfo.dimensions.width);
            if (volumeInfo.dimensions.thickness) dimensions.thickness = parseFloat(volumeInfo.dimensions.thickness);
        }

        const book = {
            title: volumeInfo.title || '',
            subtitle: volumeInfo.subtitle || '',
            autor: volumeInfo.authors || [],
            published: {
                publisher: volumeInfo.publisher || '',
                year,
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
        } else if (error.response?.status === 429 && attempt < 4) {
            const retryAfterHeader = Number(error.response?.headers?.['retry-after']);
            const delayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
                ? retryAfterHeader * 1000
                : attempt * 2000;
            console.warn(`Google Books API rate limited for ISBN ${isbn}, retrying in ${delayMs}ms (attempt ${attempt}/3)`);
            await new Promise(r => setTimeout(r, delayMs));
            return fetchGoogleBook(isbn, attempt + 1);
        } else if (error.response) {
            console.error(`Google Books API error: ${error.response.status} for ISBN ${isbn}`);
        } else {
            console.error("Error in googleBook", error.message);
        }
        return false;
    }
};

// ─── PUBLIC ENTRY POINT ───────────────────────────────────────────────────────

export const webScrapper = async (isbn: string): Promise<any> => {
    const originalIsbn = isbn;
    const googleIsbn = originalIsbn;
    isbn = isbn.replace(/[^0-9X]/gi, '');

    const results = await Promise.allSettled([databazeKnih(isbn), fetchGoogleBook(googleIsbn)]);

    const dkBook = results[0].status === 'fulfilled' ? results[0].value : null;
    const googleBook = results[1].status === 'fulfilled' ? results[1].value : null;

    if (!dkBook) console.error('Failed to fetch data from databazeKnih');
    if (!googleBook) console.error('Failed to fetch data from Google Books');

    if (!dkBook && !googleBook) {
        console.error("Book not found in any source", isbn);
        return false;
    }

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