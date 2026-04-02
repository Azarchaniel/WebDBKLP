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
 * Extract publication year from "Vydáno: YYYY" text node.
 * The HTML renders as:  Vydáno:\n1997\n,\n<a …>Publisher</a>
 */
const extractYear = (page: Page): Promise<string | undefined> =>
    page.evaluate(() => {
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
        // Raw HTML fallback
        const m3 = document.body.innerHTML.match(/Vydáno:[\s\S]{0,60}?(\d{4})/);
        return m3 ? m3[1] : undefined;
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
 * Intercept the AJAX request fired by the "více info..." toggle, fetch that
 * URL directly, and parse the returned HTML fragment for book details.
 *
 * Strategy:
 *  1. Enable request interception on the page.
 *  2. Click the toggle — the browser fires an XHR/fetch to something like
 *     /more-book-info/152830  (we capture the exact URL at runtime).
 *  3. Parse the HTML fragment for: pages, language, translator, illustrator, edition.
 *
 * If interception fails (toggle is purely DOM, no AJAX), we fall back to
 * reading the DOM after a short wait.
 */
const expandAndScrapeViceInfo = async (page: Page): Promise<{
    numberOfPages?: string;
    language?: string;
    translator?: string[];
    illustrator?: string[];
    editionTitle?: string;
    editionNo?: string;
}> => {

    // ── Intercept any XHR/fetch triggered by the toggle click ────────────────
    let ajaxHtml: string | null = null;

    const client = await (page as any).createCDPSession();
    await client.send('Network.enable');

    const responseHandler = async (params: any) => {
        try {
            const url: string = params.response?.url ?? '';
            // DK AJAX endpoints tend to contain the book id or keywords like
            // "info", "vice", "more", "detail" — capture anything that isn't
            // a static asset.
            if (
                url.includes('databazeknih.cz') &&
                !url.match(/\.(js|css|png|jpg|gif|svg|woff|ico)(\?|$)/i) &&
                !url.includes('/search') &&
                params.response?.mimeType?.includes('html')
            ) {
                const body = await client.send('Network.getResponseBody', {
                    requestId: params.requestId,
                }).catch(() => null);
                if (body?.body && body.body.length > 20) {
                    ajaxHtml = body.base64Encoded
                        ? Buffer.from(body.body, 'base64').toString('utf8')
                        : body.body;
                }
            }
        } catch { /* ignore */ }
    };

    client.on('Network.responseReceived', responseHandler);

    // Click the toggle
    try {
        await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('a, span, div, p'));
            const target = all.find(el =>
                el.children.length === 0 &&
                (el.textContent?.trim().startsWith('více info') ?? false)
            );
            if (target) (target as HTMLElement).click();
        });
        // Wait up to 3 s for an AJAX response
        await new Promise(r => setTimeout(r, 3000));
    } catch { /* non-fatal */ }

    client.off('Network.responseReceived', responseHandler);

    // ── Parse the AJAX fragment (or fall back to the live DOM) ───────────────
    const htmlToParse: string = ajaxHtml ?? await page.content();

    return parseViceInfoHtml(htmlToParse);
};

/**
 * Parse an HTML string (either the AJAX fragment or the full page after toggle)
 * and extract the "více info" fields.
 *
 * The DK fragment uses a <table> or <dl>/<span> structure like:
 *   <span class="...">Počet stran:</span> <span>312</span>
 *   <span class="...">Jazyk:</span> <span>český</span>
 *   <span class="...">Překlad:</span> <a href="/autori/...">Name</a>
 *   <span class="...">Edice:</span> <span>Title, 2. svazek</span>
 *
 * We use cheerio-style parsing inside page.evaluate() — but since we have
 * the raw HTML string here on the Node.js side, we parse it with a lightweight
 * regex approach that matches the label:value pairs reliably.
 */
const parseViceInfoHtml = (html: string): {
    numberOfPages?: string;
    language?: string;
    translator?: string[];
    illustrator?: string[];
    editionTitle?: string;
    editionNo?: string;
} => {
    const result: Record<string, any> = {};

    /**
     * Extract the text after a label in HTML.
     * Handles patterns like:
     *   >Počet stran:<  ...text or tag...  >312<
     *   >Jazyk vydání:<  ...  >český<
     */
    const afterLabel = (label: string): string | undefined => {
        // Escape regex special chars in label
        const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match the label text followed by optional tags and then a value
        const re = new RegExp(esc + ':?\\s*(?:<[^>]+>\\s*)*([^<]{1,120})', 'i');
        const m = html.match(re);
        if (!m) return undefined;
        const val = m[1].trim().replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
        return val || undefined;
    };

    /** Extract all author/contributor link texts that follow a label (must be followed by colon). */
    const autorAfterLabel = (label: string, linkPatterns: string[] = ['autori']): string[] => {
        const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Require the label to be followed immediately by a colon to avoid matching
        // the word mid-sentence (e.g. "překlad" in body text vs "Překlad:" as a label)
        const labelRe = new RegExp(esc + '\\s*:', 'i');
        const idx = html.search(labelRe);
        if (idx < 0) return [];

        // Grab a window after the label, stopping before the next "Word:" pattern
        const afterLabel = html.slice(idx + label.length + 1); // +1 for the colon
        const nextLabelMatch = afterLabel.search(/[\u00C0-\u017E\w]{4,}\s*:/);
        const window = afterLabel.slice(0, nextLabelMatch > 0 ? Math.min(nextLabelMatch, 600) : 600);

        // Build regex pattern for all link types (autori, prekladatele, ilustratori, etc.)
        const linkPattern = linkPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const linkRe = new RegExp(`href="[^"]*\\/(${linkPattern})\/[^"]*"[^>]*>([^<]+)<\\/a>`, 'gi');
        const names: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = linkRe.exec(window)) !== null) {
            const name = match[2].trim();
            if (name) names.push(name);
        }
        return names;
    };

    result.numberOfPages =
        afterLabel('Počet stran') ??
        afterLabel('Stran');

    result.language =
        afterLabel('Jazyk vydání') ??
        afterLabel('Jazyk');

    // Translator / illustrator — try different label variations and link types
    // For translators: 'Překlad' is more common in newer books, 'Překladatel' in older ones
    // Link types: '/prekladatele/' for translators, '/autori/' as fallback
    const translatorLinks = ['prekladatele', 'autori'];
    const translatorLabels = ['Překlad', 'Překladatel'];
    result.translator = translatorLabels
        .flatMap(label => autorAfterLabel(label, translatorLinks))
        .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    // For illustrators: 'Ilustrace' is more common, 'Ilustrátor' as fallback
    // Link types: '/ilustratori/' or '/ilustrator/' for illustrators, '/autori/' as fallback
    const illustratorLinks = ['ilustratori', 'ilustrator', 'autori'];
    const illustratorLabels = ['Ilustrace', 'Ilustrátor', 'Ilustrace/foto'];
    result.illustrator = illustratorLabels
        .flatMap(label => autorAfterLabel(label, illustratorLinks))
        .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    // Edition — may be "Title, 2. svazek" or just "Title"
    const editionRaw =
        afterLabel('Edice');
    if (editionRaw) {
        const m = editionRaw.match(/^(.+?),\s*(\d+)\.\s*(?:svazek|díl|část)/i)
            ?? editionRaw.match(/^(.+?),\s*(\d+)$/);
        if (m) {
            result.editionTitle = m[1].trim();
            result.editionNo = m[2];
        } else {
            result.editionTitle = editionRaw;
        }
    }

    // Strip any leftover colon-only values
    for (const k of Object.keys(result)) {
        if (result[k] === ':' || result[k] === '') delete result[k];
        if (Array.isArray(result[k]) && result[k].length === 0) delete result[k];
    }

    return result;
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

// ─── MAIN DK SCRAPER ─────────────────────────────────────────────────────────

const databazeKnih = async (isbn: string): Promise<object | boolean> => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
        timeout: 0,
    });

    try {
        console.log("DK called ", isbn);
        const page: Page = await browser.newPage();

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
            await browser.close();
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
            await browser.close();
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
        const translatorNames = new Set((extra.translator ?? []).map((t: string) => t.toLowerCase()));
        const cleanAuthors = authors
            .map(a => a.replace(' (p)', '').trim())
            .filter(a => a && !translatorNames.has(a.toLowerCase()));

        const book = {
            title,
            originalTitle,
            autor: cleanAuthors,
            translator: Array.from(translatorNames),
            ilustrator: extra.illustrator ?? [],
            published: {
                publisher: publisher?.trim(),
                year: yearOfPublish?.trim(),
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

        await browser.close();
        return book;

    } catch (error) {
        console.error("Error in databazeKnih", error);
        await browser.close();
        return {};
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