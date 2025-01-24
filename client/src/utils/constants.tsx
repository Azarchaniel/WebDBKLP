import {IBookHidden} from "../type";

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

export const bookTableColumns = (hidden: IBookHidden) => [
	{
		title: "Autor",
		field: "autorsFull",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
	},
	{
		title: "Editor",
		field: "editorsFull",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.editor
	},
	{
		title: "Prekladateľ",
		field: "translatorsFull",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.translator
	},
	{
		title: "Ilustrátor",
		field: "ilustratorsFull",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.ilustrator
	},
	{
		title: "Názov",
		field: "title",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		cellStyle: {
			fontWeight: "bold"
		}
	},
	{
		title: "Podnázov",
		field: "subtitle",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.subtitle
	},
	{
		title: "Podtitul",
		field: "content",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.content
	},
	{
		title: "ISBN",
		field: "ISBN",
		headerStyle: {
			backgroundColor: tableHeaderColor
		}
	},
	{
		title: "Jazyk",
		field: "language",
		headerStyle: {
			backgroundColor: tableHeaderColor
		}
	},
	{
		title: "Počet strán",
		field: "numberOfPages",
		headerStyle: {
			backgroundColor: tableHeaderColor
		}
	},
	{
		title: "Rozmery",
		field: "dimensions",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.dimensions
	},
	{
		title: "Poznámka",
		field: "note",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
	},
	{
		title: "Dátum pridania",
		field: "createdAt",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.createdAt,
	},
	{
		title: "umiestnenie",
		field: "location",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.location
	},
	{
		title: "Majiteľ",
		field: "ownersFull",
		headerStyle: {
			backgroundColor: tableHeaderColor
		},
		hidden: hidden.owner
	},
]

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
	"#073b4c","#118ab2","#06d6a0","#ffd166","#f78c6b","#ef476f"
]