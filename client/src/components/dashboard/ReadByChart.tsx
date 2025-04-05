import {Pie} from "react-chartjs-2";
import {chartColors, chartLabels} from "../../utils/constants";
import {IUserReadingStats} from "../../type";

interface Props {
	data: IUserReadingStats[];
}

export const ReadByChart = (props: Props) => {
	if (!props.data || Object.values(props.data).every((v: any) => v.count === 0)) return <>Žiadne dáta</>;

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
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: "left" as const,
				labels: chartLabels
			}
		},
	}

	return (
		<Pie data={data} options={chartOptions} height={"210px"} />
	)
}