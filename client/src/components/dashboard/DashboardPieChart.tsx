import "chart.js/auto"; //for react-chart
import {Pie} from "react-chartjs-2";
import {chartColors, chartLabels} from "../../utils/constants";
import {useEffect} from "react";

export const DashboardPieChart = (props: {data: any[]}) => {
	if (!props.data || props.data.every(stat => stat.count === 0)) return <>Žiadne dáta</>;

	const data = {
		labels: props.data.length ? props.data.filter(c => c.owner !== null).map(c => c.owner === "" ? "Bez majiteľa" : c.owner) : [],
		datasets: [{
			label: "Počet kníh",
			data: props.data.filter(c => c.owner).map(c => c.count),
			backgroundColor: chartColors,
			hoverOffset: 4
		}]
	};

	const chartOptions = {
		plugins: {
			legend: {
				position: "left" as const,
				title: {
					display: true,
					text: `Celkovo (${props.data.find(bc => bc.owner === null)?.count})`,
					font: {
						weight: "bold" as const
					}
				},
				labels: chartLabels
			}
		}
	}

	return (
		<Pie data={data} options={chartOptions}/>
	)
}