import { Pie } from "react-chartjs-2";
import { CHART_COLORS, CHART_LABELS } from "../../utils/constants";
import { IUserReadingStats } from "../../type";
import { useTranslation } from "react-i18next";
import { NoData } from "./NoData";

interface Props {
	data: IUserReadingStats[];
}

export const ReadByChart = (props: Props) => {
	const { t } = useTranslation();
	if (!props.data || Object.values(props.data).every((v: any) => v.count === 0)) return <NoData />;

	const data = {
		labels: props.data.length ? props.data.map((c: any) => c.user) : [],
		datasets: [{
			label: t("common.readBy"),
			data: props.data.map((c: any) => c.count),
			backgroundColor: CHART_COLORS,
			hoverOffset: 4
		}]
	};

	const chartOptions = {
		animation: false,
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: "left" as const,
				labels: CHART_LABELS(t('common.locale'))
			}
		},
	}

	return (
		<div style={{ position: "relative", height: "210px", marginTop: "0.5rem" }}>
			<Pie data={data} options={chartOptions} />
		</div>
	)
}