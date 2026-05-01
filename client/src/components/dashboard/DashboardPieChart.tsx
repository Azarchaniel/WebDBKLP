import { CHART_COLORS } from "../../utils/constants";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";
import { formatNumberLocale } from "@utils";
import { useThemeColor } from "../../utils/hooks";
import { PieChart } from "./PieChart";

export const DashboardPieChart = (props: { data: any[] }) => {
	const { t } = useTranslation();
	const chartTextColor = useThemeColor("--text", "#111827");

	if (!props.data || props.data.every(stat => stat.count === 0)) return <NoData />;

	const chartData = props.data.filter(c => c.owner !== null);
	const labels = chartData.map(c => c.owner === "" ? t("dashboard.noOwner") : c.owner);
	const values = chartData.map(c => c.count);
	const totalCount = formatNumberLocale(props.data.find(bc => bc.owner === null)?.count, t('common.locale'), 0) ?? 0;
	const title = t("dashboard.total") + ": " + totalCount;

	return (
		<div className="dashboardPieChartWrap">
			<PieChart
				labels={labels}
				values={values}
				colors={CHART_COLORS}
				locale={t('common.locale')}
				textColor={chartTextColor}
				title={title}
			/>
		</div>
	)
}