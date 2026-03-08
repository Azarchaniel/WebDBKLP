import { Pie } from "react-chartjs-2";
import { chartColors, chartLabels } from "../../utils/constants";
import { IUserReadingStats } from "../../type";
import { useTranslation } from "react-i18next";

interface Props {
	data: IUserReadingStats[];
}

export const ReadByChart = (props: Props) => {
	const { t } = useTranslation();
	if (!props.data || Object.values(props.data).every((v: any) => v.count === 0)) return <>{t("dashboard.noData")}</>;

	const data = {
		labels: props.data.length ? props.data.map((c: any) => c.user) : [],
		datasets: [{
			label: t("common.readBy"),
			data: props.data.map((c: any) => c.count),
			backgroundColor: chartColors,
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
				labels: chartLabels(t('common.locale'))
			}
		},
	}

	return (
		<Pie data={data} options={chartOptions} height={"210px"} />
	)
}