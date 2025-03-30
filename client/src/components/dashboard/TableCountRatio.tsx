import {toPercentage} from "../../utils/utils";
import {Bar} from "react-chartjs-2";

export const TableCountRatio = ({data, title}: { data: any[], title: string }) => {
	if (!data || data?.length === 0) return <>Žiadne dáta</>;

	const dimensionGroups = [
		"0-5",
		"5-10",
		"10-15",
		"15-20",
		"20-25",
		"25-30",
		"30-35",
		"35-40",
		"40<",
		"Bez rozmerov"
	];

	const dataChart = {
		labels: dimensionGroups,
		datasets: [{
			data: dimensionGroups.map(group => {
				const match = data.find(item => item.group === group);
				return match ? match.count : 0;
			})
		}],
	};

	const optionsChart = {
		plugins: {
			legend: {
				display: false
			}
		}
	};

	return (<div className="column">
		<table border={1} cellPadding="10" cellSpacing="0" style={{width: "100%", textAlign: "center"}}>
			<thead>
			<tr>
				<th className="firstCell">{title}</th>
				{dimensionGroups.map((column) => (
					<th key={column}>{column}</th>
				))}
			</tr>
			</thead>
			<tbody>
			<tr>
				<td><b>Počet</b></td>
				{dimensionGroups.map((column) => (
					<td key={column}>{data?.find((sg: any) => sg.group === column)?.count ?? "-"}</td>
				))}
			</tr>
			<tr>
				<td><b>Pomer</b></td>
				{dimensionGroups.map((column) => (
					<td key={column}>{toPercentage(data?.find((sg: any) => sg.group === column)?.ratio) ?? "-"}</td>
				))}
			</tr>
			</tbody>
		</table>
		<div style={{height: "1rem"}}/>
		<Bar data={dataChart} options={optionsChart} height="70%"/>
	</div>)
}