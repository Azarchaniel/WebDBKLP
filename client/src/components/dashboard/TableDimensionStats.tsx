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
		height: t("dashboard.heightCm"),
		width: t("dashboard.widthCm"),
		thickness: t("fields.thicknessCm"),
		weight: t("fields.weightG"),
		sum: t("stats.sum"),
		avg: t("stats.avg"),
		min: t("stats.min"),
		max: t("stats.max"),
		mode: t("stats.mode"),
		median: t("stats.median")
	};

	const rows: any[] = Object.keys(dimensionStats);
	const columns: any[] = Object.keys(dimensionStats.height);

	return (
		<>
			<div className="phone-table">
				{columns.map((column) => (
					<div key={column} className="mobile-section">
						<div className="section-title">
							{translationMap[column]}
						</div>
						<table className="responsive-table" border={1} cellPadding="8" cellSpacing="0" style={{ width: "100%", textAlign: "center" }}>
							<tbody>
								{rows.map((row) => (
									<tr key={row}>
										<td><b>{translationMap[row]}</b></td>
										<td>{formatDimension(dimensionStats[row][column], t('common.locale'))}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				))}
			</div>

			<table className="desktop-table" border={1} cellPadding="10" cellSpacing="0" style={{ width: "100%", textAlign: "center" }}>
				<thead>
					<tr>
						<th className="firstCell" />
						{columns.map((column) => (
							<th key={column}>{translationMap[column]}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row: string) => (
						<tr key={row}>
							<td><b>{translationMap[row]}</b></td>
							{columns.map((column) => (
								<td key={column}>{formatDimension(dimensionStats[row][column], t('common.locale'))}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<div style={{ height: "1rem" }} />
		</>
	);
};