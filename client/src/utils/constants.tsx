import { SortingState} from "@tanstack/react-table";

export const tableHeaderColor = getComputedStyle(document.documentElement).getPropertyValue("--anchor");

export const multiselectStyle = {
    inputField: {marginLeft: "0.5rem"},
    chips: {background: "#00ADB5"},
    option: {color: "black"},
};

export const cities = [{value: "spisska", showValue: "Spišská"},
    {value: "bruchotin", showValue: "Břuchotín"}
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
];

interface IPagination {
    page: number;
    pageSize: number;
    sorting: SortingState;
    search?: string;
}

export const DEFAULT_PAGINATION: IPagination = Object.freeze({
    page: 1,
    pageSize: 50,
    search: "",
    sorting: [{
        id: "title",
        desc: false
    }] as SortingState
});

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];