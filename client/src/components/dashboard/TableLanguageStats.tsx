import { ILanguageStatistics } from "../../type";
import { ReactElement } from "react";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";
import { formatNumberLocale } from "@utils";

interface Props {
	languageStats: ILanguageStatistics[] | undefined;
}

export const TableLanguageStats = ({ languageStats }: Props): ReactElement => {
	const { t } = useTranslation();
	if (!languageStats || languageStats?.length === 0) return <NoData />;

	const languageNameMap: Record<string, string> = {
		sk: t("language.sk"),
		cs: t("language.cs"),
		cz: t("language.cs"),
		en: t("language.en"),
		fr: t("language.fr"),
		de: t("language.de"),
		es: t("language.es"),
		sv: t("language.sv"),
		ru: t("language.ru"),
		gd: t("language.gd"),
	};

	const chartBlue = "#00ADB5";
	const sortedStats = [...languageStats].sort((a, b) => b.count - a.count);
	const totalCount = sortedStats.reduce((sum, stat) => sum + stat.count, 0);

	const getLanguageName = (languageCode: string) =>
		languageNameMap[languageCode.toLowerCase()] ?? languageCode;

	const getBarStyle = (count: number) => {
		const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
		return {
			background: `linear-gradient(90deg, ${chartBlue} ${ratio}%, transparent ${ratio}%)`
		};
	};

	return (
		<div className="dashboardTabbedCardContent">
			<h5 className="dashboardTitle">{t("dashboard.languageStats")}</h5>
			<div className="dashboardCardScrollBody">
				{sortedStats.map((stat) => (
					<div className="flex col" style={{ marginTop: "1.25rem", marginBottom: "1.25rem" }} key={stat.language}>
						<div className="langStats">
							<span>{getLanguageName(stat.language)}</span>
							<span>{stat.count}</span>
						</div>
						<div className="langBar">
							<div className="langBarFill" style={getBarStyle(stat.count)}></div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}