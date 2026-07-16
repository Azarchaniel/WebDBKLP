const selectFields = ["autor", "editor", "translator", "ilustrator", "owner", "readBy", "language"];
const inputFields = ["title", "subtitle", "content", "edition.no", "edition.title", "serie.no", "serie.title", "ISBN", "note", "published.publisher", "published.country", "location.city", "location.shelf"];
const numberFields = ["dimensions.height", "dimensions.width", "dimensions.thickness", "dimensions.weight", "numberOfPages", "published.year"];
const dateFields = ["createdAt", "updatedAt"];
const checkboxFields = ["exLibris"];

export const mapColumnName = (columnName: string): string => {
    const mapping: Record<string, string> = {
        autorsFull: "autor",
        editorsFull: "editor",
        translatorsFull: "translator",
        ilustratorsFull: "ilustrator",
        title: "title",
        subtitle: "subtitle",
        content: "content",
        ISBN: "ISBN",
        language: "language",
        numberOfPages: "numberOfPages",
        height: "dimensions.height",
        width: "dimensions.width",
        thickness: "dimensions.thickness",
        weight: "dimensions.weight",
        edition: "edition.title",
        serie: "serie.title",
        published: "published.publisher",
        "published.publisher": "published.publisher",
        "published.year": "published.year",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
        exLibris: "exLibris",
        ownersFull: "owner",
        readBy: "readBy",
        note: "note",
        location: "location.city"
    };

    return mapping[columnName] || columnName;
};

export const mapBookColumnsToFilterTypes = (columnName: string): string => {
    const mappedColumnName = mapColumnName(columnName);

    if (selectFields.includes(mappedColumnName)) {
        return "select";
    } else if (inputFields.includes(mappedColumnName)) {
        return "input";
    } else if (numberFields.includes(mappedColumnName)) {
        return "number";
    } else if (dateFields.includes(mappedColumnName)) {
        return "date";
    } else if (checkboxFields.includes(mappedColumnName)) {
        return "checkbox";
    } else {
        return "";
    }
};