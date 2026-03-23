import "chart.js/auto"; //for react-chart
import { Pie } from "react-chartjs-2";
import { CHART_COLORS, CHART_LABELS } from "../../utils/constants";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";
import { formatNumberLocale } from "@utils";

export const DashboardPieChart = (props: { data: any[] }) => {
	if (!props.data || props.data.every(stat => stat.count === 0)) return <NoData />;
	const { t } = useTranslation();

	const data = {
		labels: props.data.length ? props.data.filter(c => c.owner !== null).map(c => c.owner === "" ? t("dashboard.noOwner") : c.owner) : [],
		datasets: [{
			label: t("dashboard.bookCount"),
			data: props.data.filter(c => c.owner).map(c => c.count),
			backgroundColor: CHART_COLORS,
			hoverOffset: 4
		}]
	};

	const count = formatNumberLocale(props.data.find(bc => bc.owner === null)?.count, t('common.locale'), 0) ?? 0;

	const chartOptions = {
		animation: false,
		responsive: true,
		maintainAspectRatio: false,
		layout: {
			padding: 8
		},
		plugins: {
			legend: {
				position: "bottom" as const,
				title: {
					display: true,
					text: t("dashboard.total") + ": " + count,
					font: {
						weight: "bold" as const
					}
				},
				maxHeight: 110,
				labels: CHART_LABELS(t('common.locale'))
			},
			tooltip: {
				callbacks: {
					label: function (context: any) {
						const value = context.parsed;
						const label = context.label || '';
						const formattedValue = formatNumberLocale(value, t('common.locale'), 0);
						return `${label}: ${formattedValue}`;
					}
				}
			}
		}
	}

	return (
		<div className="dashboardPieChartWrap">
			<div className="dashboardPieChartCanvas">
				<Pie data={data} options={chartOptions} />
			</div>
		</div>
	)
}