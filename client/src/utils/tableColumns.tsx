import {ColumnDef, createColumnHelper} from "@tanstack/react-table";
import {
    IAutor,
    IBook,
    IBookColumnVisibility,
    ILangCode,
    ILocation,
    IPublished,
    IUniqueFilterValues,
    IUser
} from "../type";
import {formatDimension, getBookLocation, tableHeaderColor} from "@utils";
import React, {useState} from "react";
import {countryCode, langCode} from "./locale";
import {ShowHideRow} from "@components/books/ShowHideRow";

const createDateElement = (value: Date): React.ReactElement => {
    const date = new Date(value).toLocaleDateString("cs-CZ");
    const time = new Date(value).toLocaleTimeString("cs-CZ");
    return <span title={time} style={{pointerEvents: "auto"}}>{date}</span>
}

const columnHelper = createColumnHelper<any>();

// BOOKS
export const getBookTableColumns = (): ColumnDef<IBook, any>[] => [
    {
        accessorKey: 'autorsFull',
        header: 'Autor',
        sortUndefined: "last"
    },
    {
        accessorKey: 'editorsFull',
        header: 'Editor',
    },
    {
        accessorKey: 'translatorsFull',
        header: 'Prekladateľ',
    },
    {
        accessorKey: 'ilustratorsFull',
        header: 'Ilustrátor'
    },
    {
        accessorKey: 'title',
        header: 'Názov',
        cell: (info: any) => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
        sortUndefined: "last"
    },
    {
        accessorKey: 'subtitle',
        header: 'Podnázov'
    },
    {
        accessorKey: 'content',
        header: 'Obsah',
        cell: ({cell}: { cell: any }) => cell?.getValue()?.join(", ")
    },
    {
        accessorKey: 'ISBN',
        header: 'ISBN',
        cell: (info: any) => info?.getValue()?.toString()
    },
    {
        accessorKey: 'language',
        header: 'Jazyk',
        cell: (info: any) => {
            return langCode
                .filter((lang: ILangCode) => ((info.getValue() as string[])?.includes(lang.key))).map(lang => lang.value).join(", ")
        }
    },
    {
        accessorKey: 'numberOfPages',
        header: 'Počet strán'
    },
    columnHelper.group({
        id: "dimensions",
        header: () => "Rozmery",
        meta: {
            headerStyle: {
                backgroundColor: tableHeaderColor
            }
        },
        columns: [
            columnHelper.accessor(row => row.dimensions?.height, {
                id: "height",
                cell: info => formatDimension(info.getValue()),
                header: "Výška",
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.width, {
                id: "width",
                cell: info => formatDimension(info.getValue()),
                header: "Šírka",
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.depth, {
                id: "depth",
                cell: info => formatDimension(info.getValue()),
                header: "Hrúbka",
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.weight, {
                id: "weight",
                cell: info => formatDimension(info.getValue()),
                header: "Hmotnosť",
                sortingFn: "alphanumeric"
            }),
        ]
    }),
    {
        accessorKey: 'edition',
        header: 'Edícia',
        cell: ({cell}: {
            cell: any
        }) => `${cell.getValue()?.title ?? ""} ${cell.getValue()?.no ? "(" + cell.getValue()?.no + ")" : ""}`,
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: 'serie',
        header: 'Séria',
        cell: ({cell}: {
            cell: any
        }) => `${cell.getValue()?.title ?? ""} ${cell.getValue()?.no ? "(" + cell.getValue()?.no + ")" : ""}`,
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: 'published',
        header: 'Vydané',
        cell: ({cell}: { cell: any }) => {
            const published = cell.getValue() as IPublished;
            return `${published?.publisher} (${published?.year ?? "?"})`;
        },
        sortingFn: "datetime",
    },
    {
        accessorKey: 'exLibris',
        header: 'Ex Libris',
        cell: ({cell}: { cell: any }) => (cell.getValue() ? <span className="trueMark"/> :
            <span className="falseMark"/>),
    },
    {
        accessorKey: 'ownersFull',
        header: 'Majiteľ',
    },
    {
        accessorKey: 'readBy',
        header: 'Prečítané',
        cell: ({cell}: { cell: any }) => {
            const readBy = cell.getValue() as IUser[];
            return readBy?.map(user => user.firstName).join(', ') || '';
        },
    },
    {
        accessorKey: 'location',
        header: 'Umiestnenie',
        cell: ({cell}: { cell: any }) => getBookLocation(cell.getValue() as unknown as ILocation),
    },
    {
        accessorKey: 'note',
        header: 'Poznámka'
    },
    {
        accessorKey: 'createdAt',
        header: 'Dátum pridania',
        cell: ({cell}: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
    {
        accessorKey: 'updatedAt',
        header: 'Dátum úpravy',
        cell: ({cell}: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
    {
        //TEMP
        accessorKey: "wasChecked",
        header: "skontrolovane",
        cell: ({cell}: { cell: any }) => cell.getValue() ? "ANO" : "ne",
    }
];

// AUTORS
export const getAutorTableColumns = (): ColumnDef<IAutor, any>[] => [
    {
        accessorKey: 'firstName',
        header: 'Meno',
        sortUndefined: "last"
    },
    {
        accessorKey: 'lastName',
        header: 'Priezvisko',
        cell: (info: any) => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
    },
    {
        accessorKey: 'nationality',
        header: 'Národnosť',
        cell: ({cell}: { cell: any }) => countryCode.filter(cc => cc.key === cell.getValue()).map(cc => cc.value) ?? "-"
    },
    {
        accessorKey: 'dateOfBirth',
        header: 'Narodenie',
        sortingFn: "datetime",
        cell: ({cell}: { cell: any }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("sk-SK") : null
    },
    {
        accessorKey: 'dateOfDeath',
        header: 'Úmrtie',
        sortingFn: "datetime",
        cell: ({cell}: { cell: any }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("sk-SK") : null
    },
    {
        accessorKey: 'note',
        header: 'Poznámka'
    },
    {
        accessorKey: 'createdAt',
        header: 'Dátum pridania',
        cell: ({cell}: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
    {
        accessorKey: 'updatedAt',
        header: 'Dátum úpravy',
        cell: ({cell}: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
];

// LPs
export const getLPTableColumns = (): ColumnDef<any, any>[] => [
    {
        accessorKey: 'autorsFull',
        header: 'Autor',
        sortUndefined: "last"
    },
    {
        accessorKey: 'title',
        header: 'Názov',
        cell: (info: any) => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
        sortUndefined: "last"
    },
    {
        accessorKey: 'subtitle',
        header: 'Podnázov'
    },
    {
        accessorKey: 'language',
        header: 'Jazyk',
        cell: ({cell}: { cell: any }) => langCode
            .filter(lang => (Array.isArray(cell.getValue()) ? cell.getValue() : []).includes(lang.key))
            .map(lang => lang.value)
            .join(', ')
    },
    {
        accessorKey: 'countLp',
        header: 'Počet LP'
    },
    {
        accessorKey: 'speed',
        header: 'Rýchlosť'
    },
    {
        accessorKey: 'published',
        header: 'Vydané',
        cell: ({cell}: { cell: any }) => {
            const published = cell.getValue() as IPublished;
            return published ? `${published?.publisher ?? ""} (${published?.year ?? "-"})` : null;
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Dátum pridania',
        cell: ({cell}: { cell: any }) => {
            const value = cell.getValue() as unknown as string;
            const date = new Date(value).toLocaleDateString("cs-CZ");
            const time = new Date(value).toLocaleTimeString("cs-CZ");
            return <span title={time} style={{pointerEvents: "auto"}}>{date}</span>
        },
        sortingFn: "datetime"
    },
];

interface ShowHideColumnsProps<T> {
    columns: ColumnDef<T, any>[];
    shown: Record<string, boolean>;
    setShown: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ShowHideColumns = <T, >({columns, shown, setShown}: ShowHideColumnsProps<T>) => {
    const [dimensionsHidden, setDimensionsHidden] = useState<boolean>(shown.dimensions ?? false);

    const getColumnsForHidden = () => {
        // ignore those columns
        const columnsForHidden = columns.filter((column: ColumnDef<T, any>) => {
            return (column as any).accessorKey !== "title" &&
                /* TEMPORARY ->  */ (column as any).accessorKey !== "wasChecked" &&
                (column as any).accessorKey !== "lastName"
        });

        return columnsForHidden.map((column: any) => {
            const {header, accessorKey}: { header: string, accessorKey: keyof typeof column } = column;

            if (column.id === "dimensions") {
                return <ShowHideRow
                    key="dimensions"
                    label="Rozmery"
                    init={dimensionsHidden}
                    onChange={() => {
                        setDimensionsHidden(!dimensionsHidden);
                        setShown((prevHidden) => ({
                            ...prevHidden,
                            dimensions: !dimensionsHidden,
                            height: !dimensionsHidden,
                            width: !dimensionsHidden,
                            depth: !dimensionsHidden,
                            weight: !dimensionsHidden
                        }));
                    }}/>
            }

            return <ShowHideRow
                key={accessorKey as string}
                label={header}
                init={shown[accessorKey as string]}
                onChange={() => setShown({...shown, [accessorKey]: !shown[accessorKey as string]})}
            />
        })
    }

    return (
        <>
            {getColumnsForHidden()}
        </>
    );
};

const selectFields = ['autor', 'editor', 'translator', 'ilustrator', 'owner', 'readBy', "language"];
const inputFields = ["title", "subtitle", "content", "edition.no", "edition.title", "serie.no", "serie.title", "ISBN", "note", "published.publisher", "published.country", "location.city", "location.shelf"];
const numberFields = ["dimensions.height", "dimensions.width", "dimensions.depth", "dimensions.weight", "numberOfPages", "published.year"];
const checkboxFields = ["exLibris"];

export const mapColumnName = (columnName: string): string => {
    const mapping: Record<keyof IBookColumnVisibility, keyof IUniqueFilterValues> = {
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
        depth: "dimensions.depth",
        weight: "dimensions.weight",
        edition: "edition.title",
        serie: "serie.title",
        published: "published.publisher",
        exLibris: "exLibris",
        ownersFull: "owner",
        readBy: "readBy",
        note: "note",
        location: "location.city"
    };

    return mapping[columnName];
}

export const mapBookColumnsToFilterTypes = (columnName: string): string => {

    if (selectFields.includes(mapColumnName(columnName))) {
        return "select";
    } else if (inputFields.includes(mapColumnName(columnName))) {
        return "input";
    } else if (numberFields.includes(mapColumnName(columnName))) {
        return "number";
    } else if (checkboxFields.includes(mapColumnName(columnName))) {
        return "checkbox";
    } else {
        return "";
    }
};
