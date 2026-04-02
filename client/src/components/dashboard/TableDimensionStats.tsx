import { formatDimension } from "../../utils/utils";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";

interface Props {
	dimensionStats: any;
}

export const DashboardTableStats = ({ dimensionStats }: Props) => {
	const { t } = useTranslation();
	// if no data, then it is: { height: {}, width: {}, thickness: {}, weight: {} }
	if (!dimensionStats || Object.values(dimensionStats).every((v: any) => Object.keys(v).length === 0))
		return <NoData />;

	const translationMap: Record<string, string> = {
		height: t("dashboard.height") + " (cm)",
		width: t("dashboard.width") + " (cm)",
		thickness: t("dashboard.thickness") + " (cm)",
		weight: t("dashboard.weight") + " (g)",
		sum: t("stats.sum"),
		avg: t("stats.avg"),
		min: t("stats.min"),
		max: t("stats.max"),
		mode: t("stats.mode"),
		median: t("stats.median")
	};

	const dimensions: string[] = Object.keys(dimensionStats);
	const metrics: string[] = Object.keys(dimensionStats.height);

	return (
		<div className="dashboardCardScrollBody dashboardDimensionStats">
			<div className="phone-table dashboardStatsMobile">
				{dimensions.map((dimension) => (
					<div key={dimension} className="mobile-section">
						<div className="section-title">
							{translationMap[dimension]}
						</div>
						<table className="responsive-table dashboardStatsTable">
							<tbody>
								{metrics.map((metric) => (
									<tr key={metric}>
										<td><b>{translationMap[metric]}</b></td>
										<td>{formatDimension(dimensionStats[dimension][metric], t('common.locale')) ?? "-"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				))}
			</div>

			<table className="desktop-table dashboardStatsTable">
				<thead>
					<tr>
						<th className="firstCell" />
						{dimensions.map((dimension) => (
							<th key={dimension}>{translationMap[dimension]}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{metrics.map((metric: string) => (
						<tr key={metric}>
							<td><b>{translationMap[metric]}</b></td>
							{dimensions.map((dimension) => (
								<td key={dimension}>{formatDimension(dimensionStats[dimension][metric], t('common.locale')) ?? "-"}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};