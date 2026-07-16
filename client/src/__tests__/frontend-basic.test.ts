import test from "node:test";
import assert from "node:assert/strict";

(globalThis as any).document = {
    documentElement: {
        getAttribute: () => "light"
    }
};
(globalThis as any).getComputedStyle = () => ({ getPropertyValue: () => "#123456" });
Object.defineProperty(globalThis, "navigator", { value: { maxTouchPoints: 0, language: "sk" }, configurable: true });
(globalThis as any).window = {
    matchMedia: () => ({ matches: false }),
    location: { href: "" },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    localStorage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined
    }
};
(globalThis as any).localStorage = (globalThis as any).window.localStorage;

test("form helpers read and update nested single-object values", async () => {
    const { getInputParams, getNestedValues, handleInputChange } = await import("../utils/form");
    const book = { title: "Old title", published: { year: 1999 } };

    assert.equal(getNestedValues(book, ["published", "year"]), 1999);
    assert.equal(getNestedValues(book, ["missing", "field"]), "");
    assert.deepEqual(getInputParams("published.year", book, "Year"), {
        name: "published.year",
        value: 1999,
        placeholder: "Year"
    });

    const updated = handleInputChange({ name: "published.year", value: 2024 }, book) as typeof book;
    assert.deepEqual(updated, { title: "Old title", published: { year: 2024 } });
    assert.deepEqual(book, { title: "Old title", published: { year: 1999 } });
});

test("form helpers expose multiple-value placeholders for bulk edit arrays", async () => {
    const { getInputParams, handleInputChange } = await import("../utils/form");
    const books = [
        { title: "A", published: { year: 2001 } },
        { title: "B", published: { year: 2002 } }
    ];

    const mixedTitle = getInputParams("title", books, "Title");
    assert.equal(mixedTitle.name, "title");
    assert.equal(mixedTitle.value, "");
    assert.match(mixedTitle.placeholder, /^Title \(.+\)$/);

    const updated = handleInputChange({ target: { name: "published.publisher", value: "Publisher" } }, books) as typeof books;
    assert.deepEqual(updated, [
        { title: "A", published: { year: 2001, publisher: "Publisher" } },
        { title: "B", published: { year: 2002, publisher: "Publisher" } }
    ]);
});

test("display and validation helpers cover common book form behavior", async () => {
    const {
        checkIsbnValidity,
        formatBoardGameRange,
        formatDimension,
        formatNumberLocale,
        formPersonsFullName,
        getBookLocation,
        getFullName,
        shortenStringKeepWord,
        stringifyUsers,
        validateNumber
    } = await import("../utils/utils");

    assert.equal(shortenStringKeepWord("one two three", 8), "one two...");
    assert.equal(getFullName({ firstName: "Ada", lastName: "Lovelace" }), "Lovelace, Ada");
    assert.deepEqual(formPersonsFullName([{ firstName: "Ada", lastName: "Lovelace" }]), [
        { firstName: "Ada", lastName: "Lovelace", fullName: "Lovelace, Ada" }
    ]);
    assert.equal(stringifyUsers([{ _id: "1", firstName: "Ada", lastName: "Lovelace" } as any], true), "Lovelace, Ada");
    assert.equal(getBookLocation({ city: "spisska", shelf: "A1" }), "Spišská, A1");

    assert.equal(checkIsbnValidity("0-306-40615-2"), true);
    assert.equal(checkIsbnValidity("9780306406157"), true);
    assert.equal(checkIsbnValidity("9780306406158"), false);
    assert.equal(validateNumber("12,5", { mustBePositive: true }), true);
    assert.equal(validateNumber("0", { mustBePositive: true }), false);
    assert.equal(validateNumber("12.5", { mustBeInteger: true }), false);

    assert.equal(formatDimension({ $numberDecimal: "12.34" }, "en-US", 1), "12.3");
    assert.equal(formatNumberLocale(1234.5, "en-US", 1), "1,234.5");
    assert.equal(formatBoardGameRange({ from: 2, to: 4 }, "hráči"), "2 až 4 hráči");
});

test("color helpers and random ranges produce stable shapes", async () => {
    const { darkenLightenColor, generateColors, getRandomShade, randomMinMax, toPercentage } = await import("../utils/utils");

    assert.equal(darkenLightenColor("#808080", 10), "#9a9a9a");
    assert.match(getRandomShade("#808080", false), /^#[0-9a-f]{6}$/i);
    assert.equal(generateColors(35, true).length >= 35, true);
    assert.equal(toPercentage(0.1234, "en-US"), "12.3%");

    for (let i = 0; i < 20; i++) {
        const value = randomMinMax(2, 4, true);
        assert.equal(Number.isInteger(value), true);
        assert.equal(value >= 2 && value <= 4, true);
    }
});

test("book table filter mapping follows visible column names", async () => {
    const { mapBookColumnsToFilterTypes, mapColumnName } = await import("../utils/tableFilters");

    assert.equal(mapColumnName("autorsFull"), "autor");
    assert.equal(mapColumnName("height"), "dimensions.height");
    assert.equal(mapColumnName("unknownColumn"), "unknownColumn");

    assert.equal(mapBookColumnsToFilterTypes("autorsFull"), "select");
    assert.equal(mapBookColumnsToFilterTypes("title"), "input");
    assert.equal(mapBookColumnsToFilterTypes("height"), "number");
    assert.equal(mapBookColumnsToFilterTypes("createdAt"), "date");
    assert.equal(mapBookColumnsToFilterTypes("exLibris"), "checkbox");
    assert.equal(mapBookColumnsToFilterTypes("unknownColumn"), "");
});