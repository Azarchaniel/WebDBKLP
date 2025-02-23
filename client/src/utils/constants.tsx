import {ILocation} from "../type";
import {createColumnHelper} from "@tanstack/react-table";
import {formatDimension, getBookLocation} from "./utils";

export const tableHeaderColor = getComputedStyle(document.documentElement).getPropertyValue("--anchor");

export const multiselectStyle = {
    inputField: {marginLeft: "0.5rem"},
    chips: {background: "#00ADB5"},
    option: {color: "black"},
};

export const cities = [{value: "spisska", showValue: "Spišská"},
    {value: "bruchotin", showValue: "Břuchotín"}
];

const columnHelper = createColumnHelper<any>();

export const getBookTableColumns = (): any => [
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

export const chartLabels = {
    generateLabels(chart: any) {
        const data = chart.data;
        return data.labels.map((label: any, i: number) => {
            const meta = chart.getDatasetMeta(0);
            const style = meta.controller.getStyle(i);

            return {
                text: `${label} (${chart.data.datasets[0].data[i] ?? 0})`,
                fillStyle: style.backgroundColor,
                strokeStyle: style.borderColor,
                lineWidth: style.borderWidth,
                hidden: !chart.getDataVisibility(i),
                index: i
            };
        });
    }
};

export const chartColors = [
    "#073b4c", "#118ab2", "#06d6a0", "#ffd166", "#f78c6b", "#ef476f"
]

export const autorRoles = [
    {value: "autor", showValue: "Autor"},
    {value: "editor", showValue: "Editor"},
    {value: "ilustrator", showValue: "Ilustrátor"},
    {value: "musician", showValue: "Hudobník"},
    {value: "boardGameAutor", showValue: "Autor spol. hier"}
]