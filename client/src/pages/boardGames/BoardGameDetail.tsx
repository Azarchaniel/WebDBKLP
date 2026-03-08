import React from "react";
import { IBoardGame } from "../../type";
import { formatBoardGameRange } from "@utils";
import { useTranslation } from "react-i18next";

interface Props {
    data: IBoardGame;
}

const BoardGameDetail: React.FC<Props> = React.memo(({ data }) => {
    const { t } = useTranslation();
    const renderAuthors = () => {
        if (!data.autor || data.autor.length === 0) return null;
        // @ts-ignore
        const autorList = data.autor.map((a: any) => a.fullName || `${a.firstName ? a.firstName + ' ' : ''}${a.lastName}`).join("; ");
        return <p>{t("common.author")}: {autorList}</p>;
    };

    const renderPublished = () => {
        if (!data.published) return null;
        const { publisher, year, country } = data.published;
        if (!publisher && !year && !country) return null;
        return (
            <p>
                {t("common.publisher")}: {publisher ?? "-"}
                {year ? `, ${year}` : ""}
                {country ? `, ${country}` : ""}
            </p>
        );
    };

    const renderPicture = () => (
        <div>
            {data.picture ? (
                <img src={data.picture} alt={t("bookDetail.coverAlt")} />
            ) : (
                <img src="img/no_thumbnail.svg" alt={t("bookDetail.noCoverAlt")} />
            )}
        </div>
    );

    const renderUrl = () => {
        if (!data.url) return null;
        return (
            <p>
                <a href={data.url} target="_blank" rel="noopener noreferrer">
                    {t("boardGames.link")}
                </a>
            </p>
        );
    };

    const renderParentChildren = () => {
        return (
            <>
                {Boolean(data.parent?.length) &&
                    <p>{t("boardGames.belongsTo")}: {(data.parent as IBoardGame[]).map((bg: IBoardGame) => bg.title).join(", ")}</p>}
                {Boolean(data.children?.length) &&
                    <p>{t("boardGames.hasExpansions")}: {(data.children as IBoardGame[]).map((bg: IBoardGame) => bg.title).join(", ")}</p>}
            </>
        );
    };

    return (
        <div className="boardGameDetail">
            <div>
                {renderPicture()}
            </div>
            <div>
                <h1>{data.title}</h1>
                {renderAuthors()}
                {data.noPlayers && <p>{t("table.boardGames.players")}: {formatBoardGameRange(data.noPlayers, t("units.players"))}</p>}
                {data.playTime && <p>{t("table.boardGames.playTime")}: {formatBoardGameRange(data.playTime, t("units.minutes"))}</p>}
                {data.ageRecommendation &&
                    <p>{t("table.boardGames.ageRecommendation")}: {formatBoardGameRange(data.ageRecommendation, t("units.years"))}</p>}
                {renderPublished()}
                {data.note && <p>{t("common.note")}: {data.note}</p>}
                {renderParentChildren()}

                {renderUrl()}
            </div>
        </div>
    );
});

export default BoardGameDetail;

