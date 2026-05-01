import { CHART_COLORS } from "../../utils/constants";
import { IUserReadingStats } from "../../type";
import { useTranslation } from "react-i18next";
import { NoData } from "./NoData";
import { useThemeColor } from "../../utils/hooks";
import { PieChart } from "./PieChart";

interface Props {
	data: IUserReadingStats[];
}

export const ReadByChart = (props: Props) => {
	const { t } = useTranslation();
	const chartTextColor = useThemeColor("--text", "#111827");

	if (!props.data || Object.values(props.data).every((v: any) => v.count === 0)) return <NoData />;

	const labels = props.data.map((c: any) => c.user);
	const values = props.data.map((c: any) => c.count);

	return (
		<div className="dashboardPieChartWrap">
			<PieChart
				labels={labels}
				values={values}
				colors={CHART_COLORS}
				locale={t('common.locale')}
				textColor={chartTextColor}
			/>
		</div>
	)
}