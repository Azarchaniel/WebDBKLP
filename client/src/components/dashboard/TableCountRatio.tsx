import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDimension, toPercentage } from "../../utils/utils";
import { NoData } from "./NoData";

export const TableCountRatio = ({ data, title }: { data: any[], title: string }) => {
	const { t } = useTranslation();
	const [hoveredRow, setHoveredRow] = useState<string | null>(null);
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

	const totalCount = dimensionGroups.reduce((sum, group) => {
		const match = data.find((item) => item.group === group);
		return sum + (match?.count ?? 0);
	}, 0);

	const getCountForGroup = (group: string) =>
		data.find((item) => item.group === group)?.count ?? 0;

	const getBarStyleForColumns = (count: number, isEven: boolean, isHovered: boolean = false) => {
		const barPercentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
		// Split the bar across two 50% columns
		const countFill = Math.min(barPercentage * 2, 100);
		const ratioFill = Math.max(0, (barPercentage - 50) * 2);

		// Determine background color based on row state
		let bgColor = "#ffffff";  // default/odd rows
		if (isHovered) {
			bgColor = "#f1f6ff";  // hover state
		} else if (isEven) {
			bgColor = "#fbfcff";  // even rows
		}

		return { countFill, ratioFill, bgColor };
	};

	return (<div className="column dashboardCardScrollBody dashboardRatioStats">
		<table className="phone-table dashboardRatioTable dashboardRatioTable--mobile">
			<thead>
				<tr>
					<th>{title}</th>
					<th>{t("common.count")}</th>
					<th>{t("common.ratio")}</th>
				</tr>
			</thead>
			<tbody>
				{dimensionGroups.map((group, index) => {
					const isEven = (index + 1) % 2 === 0;
					const isHovered = hoveredRow === group;
					const { countFill, ratioFill, bgColor } = getBarStyleForColumns(getCountForGroup(group), isEven, isHovered);
					const firstCellStyle = {
						background: bgColor
					};
					const countBarStyle = {
						background: `linear-gradient(90deg, #00ADB5 ${countFill}%, ${bgColor} ${countFill}%)`
					};
					const ratioBarStyle = {
						background: `linear-gradient(90deg, #00ADB5 ${ratioFill}%, ${bgColor} ${ratioFill}%)`
					};
					return (
						<tr key={group} onMouseEnter={() => setHoveredRow(group)} onMouseLeave={() => setHoveredRow(null)}>
							<td style={firstCellStyle}><b>{group}</b></td>
							<td style={countBarStyle}>
								{formatDimension(data?.find((sg) => sg.group === group)?.count, t('common.locale'), 0) ?? "-"}
							</td>
							<td style={ratioBarStyle}>
								{toPercentage(data?.find((sg) => sg.group === group)?.ratio, t('common.locale')) ?? "-"}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>

		<table className="desktop-table dashboardRatioTable dashboardRatioTable--desktop">
			<thead>
				<tr>
					<th className="firstCell">{title}</th>
					<th>{t("common.count")}</th>
					<th>{t("common.ratio")}</th>
				</tr>
			</thead>
			<tbody>
				{dimensionGroups.map((group, index) => {
					const isEven = (index + 1) % 2 === 0;
					const isHovered = hoveredRow === group;
					const { countFill, ratioFill, bgColor } = getBarStyleForColumns(getCountForGroup(group), isEven, isHovered);
					const firstCellStyle = {
						background: bgColor
					};
					const countBarStyle = {
						background: `linear-gradient(90deg, #00ADB5 ${countFill}%, ${bgColor} ${countFill}%)`
					};
					const ratioBarStyle = {
						background: `linear-gradient(90deg, #00ADB5 ${ratioFill}%, ${bgColor} ${ratioFill}%)`
					};
					return (
						<tr key={group} onMouseEnter={() => setHoveredRow(group)} onMouseLeave={() => setHoveredRow(null)}>
							<td style={firstCellStyle}><b>{group}</b></td>
							<td style={countBarStyle}>
								{formatDimension(data?.find((sg: any) => sg.group === group)?.count, t('common.locale'), 0) ?? "-"}
							</td>
							<td style={ratioBarStyle}>
								{toPercentage(data?.find((sg: any) => sg.group === group)?.ratio, t('common.locale')) ?? "-"}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	</div>)
}