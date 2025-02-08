import {ILocation} from "../type";
import {createColumnHelper} from "@tanstack/react-table";
import {getBookLocation} from "./utils";

export const tableHeaderColor = getComputedStyle(document.documentElement).getPropertyValue("--anchor");

export const multiselectStyle = {
    inputField: {marginLeft: "0.5rem"},
    optionContainer: {
        backgroundColor: "transparent",
    },
    chips: {background: "#00ADB5"},
    option: {color: "black"},
    multiselectContainer: {maxWidth: "100%"},
};

export const cities = [{value: "spisska", showValue: "Spišská"},
    {value: "bruchotin", showValue: "Břuchotín"}];

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
        header: 'ISBN'
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
                cell: info => info.getValue(),
                header: "Výška",
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.width, {
                id: "width",
                cell: info => info.getValue(),
                header: "Šírka",
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.depth, {
                id: "depth",
                cell: info => info.getValue(),
                header: "Hrúbka",
                sortingFn: "alphanumeric"
            }),
            columnHelper.accessor(row => row.dimensions?.weight, {
                id: "weight",
                cell: info => info.getValue(),
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
        cell: ({cell}: { cell: any }) => new Date(cell.getValue() as unknown as string).toLocaleDateString("cs-CZ"), //TODO: show time on hover
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
    }
];

export const chartLabels = {
    generateLabels(chart: any) {
        const data = chart.data;
        return data.labels.map((label: any, i: number) => {
            const meta = chart.getDatasetMeta(0);
            const style = meta.controller.getStyle(i);

            return {
                text: `${label} (${chart.data.datasets[0].data[i]})`,
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