import {IBook, ILocation} from "../type";
import {ColumnDef, createColumnHelper} from "@tanstack/react-table";
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

const columnHelper = createColumnHelper<IBook>();

export const bookTableColumns: ColumnDef<IBook>[] = [
    {
        accessorKey: 'autorsFull',
        header: 'Autor'
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
        cell: info => (
            <b>
                {info.getValue() as unknown as string}
            </b>
        ),
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
                cell: info => info.getValue(),
                header: "Výška"
            }),
            columnHelper.accessor(row => row.dimensions?.width, {
                cell: info => info.getValue(),
                header: "Šírka"
            }),
            columnHelper.accessor(row => row.dimensions?.depth, {
                cell: info => info.getValue(),
                header: "Hrúbka"
            }),
            columnHelper.accessor(row => row.dimensions?.weight, {
                cell: info => info.getValue(),
                header: "Hmotnosť"
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
        cell: ({cell}) => new Date(cell.getValue() as unknown as string).toLocaleDateString("cs-CZ"), //TODO: show time on hover
    },
    {
        accessorKey: 'location',
        header: 'Umiestnenie',
        cell: ({cell}) => getBookLocation(cell.getValue() as unknown as ILocation),
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