import { Pie } from "react-chartjs-2";
import { CHART_COLORS, CHART_LABELS } from "../../utils/constants";
import { IUserReadingStats } from "../../type";
import { useTranslation } from "react-i18next";
import { NoData } from "./NoData";
import { useThemeColor } from "../../utils/hooks";
import { useRef, useEffect } from "react";

interface Props {
	data: IUserReadingStats[];
}

export const ReadByChart = (props: Props) => {
	const { t } = useTranslation();
	const chartTextColor = useThemeColor("--text", "#111827");
	const chartRef = useRef<any>(null);

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
				position: "bottom" as const,
				// the title is here beacuase without it the legend labels are not colored properly
				title: {
					display: true,
					text: "",
					color: chartTextColor,
					font: {
						size: 0,
					}
				},
				maxHeight: 110,
				labels: CHART_LABELS(t('common.locale'), chartTextColor)
			},
		},
	}

	return (
		<div style={{ position: "relative", height: "210px", marginTop: "0.5rem" }}>
			<Pie ref={chartRef} data={data} options={chartOptions} />
		</div>
	)
}