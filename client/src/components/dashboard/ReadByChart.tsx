import {Pie} from "react-chartjs-2";
import {chartColors, chartLabels} from "../../utils/constants";

export const ReadByChart = (props: any) => {
	const data = {
		labels: props.data.length ? props.data.map((c: any) => c.user) : [],
		datasets: [{
			label: "Precitane",
			data: props.data.map((c: any) => c.count),
			backgroundColor: chartColors,
			hoverOffset: 4
		}]
	};

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: "top" as const,
				labels: chartLabels
			}
		}
	}

	return (
		<Pie data={data} options={chartOptions}/>
	)
}