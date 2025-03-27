import {ColumnDef, createColumnHelper} from "@tanstack/react-table";
import {IAutor, IBook, ILocation, IPublished, IUser} from "../type";
import {formatDimension, getBookLocation} from "./utils";
import React from "react";
import {tableHeaderColor} from "./constants";
import {countryCode, langCode} from "./locale";

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
    },
    {
        accessorKey: 'ISBN',
        header: 'ISBN',
        cell: (info: any) => info?.getValue()?.toString()
    },
    {
        accessorKey: 'language',
        header: 'Jazyk'
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
        cell: ({ cell }: { cell: any }) => `${cell.getValue()?.title ?? ""} ${cell.getValue()?.no ? "(" + cell.getValue()?.no + ")" : ""}`,
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: 'serie',
        header: 'Séria',
        cell: ({ cell }: { cell: any }) => `${cell.getValue()?.title ?? ""} ${cell.getValue()?.no ? "(" + cell.getValue()?.no + ")" : ""}`,
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: 'published',
        header: 'Vydané',
        cell: ({ cell }: { cell: any }) => {
            const published = cell.getValue() as IPublished;
            return `${published?.publisher} (${published?.year ?? "?"})`;
        },
        sortingFn: "datetime",
    },
    {
        accessorKey: 'exLibris',
        header: 'Ex Libris',
        cell: ({ cell }: { cell: any }) => (cell.getValue() ? <span className="trueMark"/> : <span className="falseMark"/>),
    },
    {
        accessorKey: 'readBy',
        header: 'Prečítané',
        cell: ({ cell }: { cell: any }) => {
            const readBy = cell.getValue() as IUser[];
            return readBy?.map(user => user.firstName).join(', ') || '';
        },
    },
    {
        accessorKey: 'note',
        header: 'Poznámka'
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
    {
        accessorKey: 'location',
        header: 'Umiestnenie',
        cell: ({cell}: { cell: any }) => getBookLocation(cell.getValue() as unknown as ILocation),
    },
    {
        accessorKey: 'ownersFull',
        header: 'Majiteľ',
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
        cell: ({ cell }: { cell: any }) => countryCode.filter(cc => cc.key === cell.getValue()).map(cc => cc.value) ?? "-"
    },
    {
        accessorKey: 'dateOfBirth',
        header: 'Narodenie',
        sortingFn: "datetime",
        cell: ({ cell }: { cell: any }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("sk-SK") : null
    },
    {
        accessorKey: 'dateOfDeath',
        header: 'Úmrtie',
        sortingFn: "datetime",
        cell: ({ cell }: { cell: any }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("sk-SK") : null
    },
    {
        accessorKey: 'note',
        header: 'Poznámka'
    }
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
        cell: ({ cell }: { cell: any }) => langCode
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
        cell: ({ cell }: { cell: any }) => {
            const published = cell.getValue() as IPublished;
            return published  ? `${published?.publisher ?? ""} (${published?.year ?? "-"})` : null;
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
