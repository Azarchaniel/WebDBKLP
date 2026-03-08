import { useTranslation } from "react-i18next";
import { formatDimension, toPercentage } from "../../utils/utils";
import { NoData } from "./NoData";

export const TableCountRatio = ({ data, title }: { data: any[], title: string }) => {
	const { t } = useTranslation();
	if (!data || data?.length === 0) return <NoData />;

	const dimensionGroups = [
		"0-5",
		"5-10",
		"10-15",
		"15-20",
		"20-25",
		"25-30",
		"30-35",
		"35-40",
		"40<",
		"Bez rozmerov"
	];

	const chartBlue = "rgb(54, 162, 235)";
	const totalCount = dimensionGroups.reduce((sum, group) => {
		const match = data.find((item) => item.group === group);
		return sum + (match?.count ?? 0);
	}, 0);

	const getCountForGroup = (group: string) =>
		data.find((item) => item.group === group)?.count ?? 0;

	const getBarStyleHorizontal = (count: number) => {
		const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
		return {
			background: `linear-gradient(90deg, ${chartBlue} ${ratio}%, transparent ${ratio}%)`
		};
	};

	const getBarStyleVertical = (count: number, row: "top" | "bottom") => {
		const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
		const bottomFill = Math.min(ratio, 50) * 2;
		const topFill = Math.max(ratio - 50, 0) * 2;
		const fill = row === "bottom" ? bottomFill : topFill;
		return {
			background: `linear-gradient(to top, ${chartBlue} ${fill}%, transparent ${fill}%)`
		};
	};

	return (<div className="column">
		<table className="phone-table" border={1} cellPadding="8" cellSpacing="0" style={{ width: "100%", textAlign: "center" }}>
			<thead>
				<tr>
					<th>{title}</th>
					<th>{t("common.count")}</th>
					<th>{t("common.ratio")}</th>
				</tr>
			</thead>
			<tbody>
				{dimensionGroups.map((group) => (
					<tr key={group}>
						<td><b>{group}</b></td>
						<td style={getBarStyleHorizontal(getCountForGroup(group))}>
							{formatDimension(data?.find((sg) => sg.group === group)?.count ?? "-", t('common.locale'))}
						</td>
						<td>{toPercentage(data?.find((sg) => sg.group === group)?.ratio, t('common.locale')) ?? "-"}</td>
					</tr>
				))}
			</tbody>
		</table>

		<table className="desktop-table" border={1} cellPadding="10" cellSpacing="0" style={{ width: "100%", textAlign: "center" }}>
			<thead>
				<tr>
					<th className="firstCell">{title}</th>
					{dimensionGroups.map((column) => (
						<th key={column}>{column}</th>
					))}
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><b>{t("common.count")}</b></td>
					{dimensionGroups.map((column) => (
						<td key={column} style={getBarStyleVertical(getCountForGroup(column), "top")}>
							{formatDimension(data?.find((sg: any) => sg.group === column)?.count ?? "-", t('common.locale'))}
						</td>
					))}
				</tr>
				<tr>
					<td><b>{t("common.ratio")}</b></td>
					{dimensionGroups.map((column) => (
						<td key={column} style={getBarStyleVertical(getCountForGroup(column), "bottom")}>
							{toPercentage(data?.find((sg: any) => sg.group === column)?.ratio, t('common.locale')) ?? "-"}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	</div>)
}