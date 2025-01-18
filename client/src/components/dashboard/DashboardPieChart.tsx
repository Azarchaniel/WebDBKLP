import "chart.js/auto"; //for react-chart
import {Pie} from "react-chartjs-2";

export const DashboardPieChart = (props: {data: any[]}) => {
	const data = {
		labels: props.data.length ? props.data.filter(c => c.owner).map(c => c.owner?.firstName || "Bez majiteľa") : [],
		datasets: [{
			label: "Počet kníh",
			data: props.data.filter(c => c.owner).map(c => c.count),
			backgroundColor: [
				"white", "lightpurple", "black", "gray", "red", "pink"
			],
			hoverOffset: 4
		}]
	};

	const chartOptions = {
		plugins: {
			legend: {
				position: "left" as const,
				title: {
					display: true,
					text: `Celkovo (${props.data.find(bc => !bc.owner)?.count})`,
					font: {
						weight: "bold" as const
					}
				},
				labels: {
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
				}
			}
		}
	}

	return (
		<Pie data={data} options={chartOptions}/>
	)
}