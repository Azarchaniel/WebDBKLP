import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { TFunction } from "i18next";
import {
    IAutor,
    IBook,
    IBookColumnVisibility,
    ILangCode,
    ILocation,
    IPublished,
    IUniqueFilterValues,
    IUser, TRange
} from "../type";
import { autorRoles, formatBoardGameRange, formatDimension, getBookLocation, tableHeaderColor } from "@utils";
import React, { useState } from "react";
import { countryCode, langCode } from "./locale";
import { ShowHideRow } from "@components/books/ShowHideRow";

const createDateElement = (value: Date): React.ReactElement => {
    const date = new Date(value).toLocaleDateString("cs-CZ");
    const time = new Date(value).toLocaleTimeString("cs-CZ");
    return <span title={time} style={{ pointerEvents: "auto" }}>{date}</span>
}

const columnHelper = createColumnHelper<any>();

// BOOKS
export const getBookTableColumns = (t: TFunction): ColumnDef<IBook, any>[] => [
    {
        accessorKey: 'autorsFull',
        header: t("table.books.author"),
        sortUndefined: "last"
    },
    {
        accessorKey: 'editorsFull',
        header: t("table.books.editor"),
    },
    {
        accessorKey: 'translatorsFull',
        header: t("table.books.translator"),
    },
    {
        accessorKey: 'ilustratorsFull',
        header: t("table.books.illustrator")
    },
    {
        accessorKey: 'title',
        header: t("table.books.title"),
        cell: (info: any) => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
        sortUndefined: "last"
    },
    {
        accessorKey: 'subtitle',
        header: t("table.books.subtitle")
    },
    {
        accessorKey: 'content',
        header: t("table.books.content"),
        cell: ({ cell }: { cell: any }) => cell?.getValue()?.join(", ")
    },
    {
        accessorKey: 'ISBN',
        header: t("table.books.isbn"),
        cell: (info: any) => info?.getValue()?.toString()
    },
    {
        accessorKey: 'language',
        header: t("table.books.language"),
        cell: (info: any) => {
            return langCode
                .filter((lang: ILangCode) => ((info.getValue() as string[])?.includes(lang.key))).map(lang => lang.value).join(", ")
        }
    },
    {
        accessorKey: 'numberOfPages',
        header: t("table.books.pages")
    },
    columnHelper.group({
        id: "dimensions",
        header: () => t("table.books.dimensions"),
        meta: {
            headerStyle: {
                backgroundColor: tableHeaderColor
            }
        },
        columns: [
            columnHelper.accessor(row => row.dimensions?.height, {
                id: "height",
                cell: info => formatDimension(info.getValue()),
                header: t("table.books.height"),
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.width, {
                id: "width",
                cell: info => formatDimension(info.getValue()),
                header: t("table.books.width"),
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.thickness, {
                id: "thickness",
                cell: info => formatDimension(info.getValue()),
                header: t("table.books.thickness"),
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.weight, {
                id: "weight",
                cell: info => formatDimension(info.getValue()),
                header: t("table.books.weight"),
                sortingFn: "alphanumeric"
            }),
        ]
    }),
    {
        accessorKey: 'edition',
        header: t("table.books.edition"),
        cell: ({ cell }: {
            cell: any
        }) => `${cell.getValue()?.title ?? ""} ${cell.getValue()?.no ? "(" + cell.getValue()?.no + ")" : ""}`,
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: 'serie',
        header: t("table.books.serie"),
        cell: ({ cell }: {
            cell: any
        }) => `${cell.getValue()?.title ?? ""} ${cell.getValue()?.no ? "(" + cell.getValue()?.no + ")" : ""}`,
        sortingFn: "alphanumeric",
    },
    {
        accessorKey: 'published',
        header: t("table.books.published"),
        cell: ({ cell }: { cell: any }) => {
            const published = cell.getValue() as IPublished;
            return published ? `${published?.publisher} (${published?.year ?? "?"})` : "";
        },
        sortingFn: "datetime",
    },
    {
        accessorKey: 'exLibris',
        header: t("table.books.exLibris"),
        cell: ({ cell }: { cell: any }) => (cell.getValue() ? <span className="trueMark" /> :
            <span className="falseMark" />),
    },
    {
        accessorKey: 'ownersFull',
        header: t("table.books.owner"),
    },
    {
        accessorKey: 'readBy',
        header: t("table.books.readBy"),
        cell: ({ cell }: { cell: any }) => {
            const readBy = cell.getValue() as IUser[];
            return readBy?.map(user => user.firstName).join(', ') || '';
        },
    },
    {
        accessorKey: 'location',
        header: t("table.books.location"),
        cell: ({ cell }: { cell: any }) => getBookLocation(cell.getValue() as unknown as ILocation),
    },
    {
        accessorKey: 'note',
        header: t("table.books.note")
    },
    {
        accessorKey: 'createdAt',
        header: t("table.books.createdAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
    {
        accessorKey: 'updatedAt',
        header: t("table.books.updatedAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    }
];

// AUTORS
export const getAutorTableColumns = (t: TFunction): ColumnDef<IAutor, any>[] => [
    {
        accessorKey: 'firstName',
        header: t("table.autors.firstName"),
        sortUndefined: "last"
    },
    {
        accessorKey: 'lastName',
        header: t("table.autors.lastName"),
        cell: (info: any) => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
    },
    {
        accessorKey: 'nationality',
        header: t("table.autors.nationality"),
        cell: ({ cell }: { cell: any }) => countryCode.filter(cc => cc.key === cell.getValue()).map(cc => cc.value) ?? "-"
    },
    {
        accessorKey: 'dateOfBirth',
        header: t("table.autors.birth"),
        sortingFn: "datetime",
        cell: ({ cell }: { cell: any }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("sk-SK") : null
    },
    {
        accessorKey: 'dateOfDeath',
        header: t("table.autors.death"),
        sortingFn: "datetime",
        cell: ({ cell }: { cell: any }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("sk-SK") : null
    },
    {
        accessorKey: 'note',
        header: t("table.autors.note")
    },
    {
        accessorKey: 'role',
        header: t("table.autors.role"),
        cell: ({ cell }: { cell: any }) => {
            const roles = cell.getValue() as string[];
            if (!roles || roles.length === 0) return "-";
            return roles.map((role: string) => t(autorRoles.find(r => r.value === role)?.showValue || "")).join(', ');
        }
    },
    {
        accessorKey: 'createdAt',
        header: t("table.autors.createdAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
    {
        accessorKey: 'updatedAt',
        header: t("table.autors.updatedAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
];

// LPs
export const getLPTableColumns = (t: TFunction): ColumnDef<any, any>[] => [
    {
        accessorKey: 'autorsFull',
        header: t("table.lp.author"),
        sortUndefined: "last"
    },
    {
        accessorKey: 'title',
        header: t("table.lp.title"),
        cell: (info: any) => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
        sortUndefined: "last"
    },
    {
        accessorKey: 'subtitle',
        header: t("table.lp.subtitle")
    },
    {
        accessorKey: 'language',
        header: t("table.lp.language"),
        cell: ({ cell }: { cell: any }) => langCode
            .filter(lang => (Array.isArray(cell.getValue()) ? cell.getValue() : []).includes(lang.key))
            .map(lang => lang.value)
            .join(', ')
    },
    {
        accessorKey: 'countLp',
        header: t("table.lp.countLp")
    },
    {
        accessorKey: 'speed',
        header: t("table.lp.speed")
    },
    {
        accessorKey: 'published',
        header: t("table.lp.published"),
        cell: ({ cell }: { cell: any }) => {
            const published = cell.getValue() as IPublished;
            return published ? `${published?.publisher ?? ""} (${published?.year ?? "-"})` : null;
        },
    },
    {
        accessorKey: 'createdAt',
        header: t("table.lp.createdAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
    {
        accessorKey: 'updatedAt',
        header: t("table.lp.updatedAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime"
    },
];

// BOARD GAMES
export const getBoardGameTableColumns = (t: TFunction): ColumnDef<any, any>[] => [
    {
        accessorKey: 'autorsFull',
        header: t("table.boardGames.author"),
    },
    {
        accessorKey: 'title',
        header: t("table.boardGames.title"),
        cell: (info: any) => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
        sortUndefined: "last"
    },
    {
        accessorKey: 'noPlayers',
        header: t("table.boardGames.players"),
        cell: ({ cell }: { cell: any }) => {
            const value = cell.getValue() as TRange;
            return value ? formatBoardGameRange(value, t("units.players")) : "";
        },
    },
    {
        accessorKey: 'playTime',
        header: t("table.boardGames.playTime"),
        cell: ({ cell }: { cell: any }) => {
            const value = cell.getValue() as TRange;
            return value ? formatBoardGameRange(value, t("units.minutes")) : "";
        },
    },
    {
        accessorKey: 'ageRecommendation',
        header: t("table.boardGames.ageRecommendation"),
        cell: ({ cell }: { cell: any }) => {
            const value = cell.getValue() as TRange;
            return value ? formatBoardGameRange(value, t("units.years")) : "";
        },
    },
    {
        accessorKey: 'published',
        header: t("table.boardGames.published"),
        cell: ({ cell }: { cell: any }) => {
            const published = cell.getValue() as IPublished;
            return published ? `${published?.publisher ?? "?"} (${published?.year ?? "?"})` : "";
        },
        sortingFn: "datetime",
    },
    {
        accessorKey: 'createdAt',
        header: t("table.boardGames.createdAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime",
    },
    {
        accessorKey: 'updatedAt',
        header: t("table.boardGames.updatedAt"),
        cell: ({ cell }: { cell: any }) => createDateElement(cell.getValue() as unknown as Date),
        sortingFn: "datetime",
    },
];

interface ShowHideColumnsProps<T> {
    columns: ColumnDef<T, any>[];
    shown: Record<string, boolean>;
    setShown: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    dimensionsLabel?: string;
}

export const ShowHideColumns = <T,>({ columns, shown, setShown, dimensionsLabel }: ShowHideColumnsProps<T>) => {
    const [dimensionsHidden, setDimensionsHidden] = useState<boolean>(shown.dimensions ?? false);

    const getColumnsForHidden = () => {
        // ignore those columns
        const columnsForHidden = columns.filter((column: ColumnDef<T, any>) => {
            return (column as any).accessorKey !== "title" &&
                (column as any).accessorKey !== "lastName"
        });

        return columnsForHidden.map((column: any) => {
            const { header, accessorKey }: { header: string, accessorKey: keyof typeof column } = column;

            if (column.id === "dimensions") {
                return <ShowHideRow
                    key="dimensions"
                    label={dimensionsLabel || ""}
                    init={dimensionsHidden}
                    onChange={() => {
                        setDimensionsHidden(!dimensionsHidden);
                        setShown((prevHidden) => ({
                            ...prevHidden,
                            dimensions: !dimensionsHidden,
                            height: !dimensionsHidden,
                            width: !dimensionsHidden,
                            thickness: !dimensionsHidden,
                            weight: !dimensionsHidden
                        }));
                    }} />
            }

            return <ShowHideRow
                key={accessorKey as string}
                label={header}
                init={shown[accessorKey as string]}
                onChange={() => setShown({ ...shown, [accessorKey]: !shown[accessorKey as string] })}
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
const numberFields = ["dimensions.height", "dimensions.width", "dimensions.thickness", "dimensions.weight", "numberOfPages", "published.year"];
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
        thickness: "dimensions.thickness",
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