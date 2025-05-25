import React from "react";
import {IBoardGame} from "../../type";
import {formatBoardGameRange} from "@utils";

interface Props {
    data: IBoardGame;
}

const BoardGameDetail: React.FC<Props> = React.memo(({data}) => {
    const renderAuthors = () => {
        if (!data.autor || data.autor.length === 0) return null;
        // @ts-ignore
        const autorList = data.autor.map((a: any) => a.fullName || `${a.firstName ? a.firstName + ' ' : ''}${a.lastName}`).join("; ");
        return <p>Autor: {autorList}</p>;
    };

    const renderPublished = () => {
        if (!data.published) return null;
        const {publisher, year, country} = data.published;
        if (!publisher && !year && !country) return null;
        return (
            <p>
                Vydavateľ: {publisher ?? "-"}
                {year ? `, ${year}` : ""}
                {country ? `, ${country}` : ""}
            </p>
        );
    };

    const renderPicture = () => (
        <div>
            {data.picture ? (
                <img src={data.picture} alt="cover"/>
            ) : (
                <img src="img/no_thumbnail.svg" alt="no_thumbnail"/>
            )}
        </div>
    );

    const renderUrl = () => {
        if (!data.url) return null;
        return (
            <p>
                <a href={data.url} target="_blank" rel="noopener noreferrer">
                    Odkaz na hru
                </a>
            </p>
        );
    };

    const renderParentChildren = () => {
        return (
            <>
                {Boolean(data.parent?.length) &&
                    <p>Patrí k hre: {(data.parent as IBoardGame[]).map((bg: IBoardGame) => bg.title)}</p>}
                {Boolean(data.children?.length) &&
                    <p>Má rozšírenia: {(data.children as IBoardGame[]).map((bg: IBoardGame) => bg.title)}</p>}
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
                {data.noPlayers && <p>Počet hráčov: {formatBoardGameRange(data.noPlayers)}</p>}
                {data.playTime && <p>Čas hry: {formatBoardGameRange(data.playTime, "min")}</p>}
                {data.ageRecommendation &&
                    <p>Odporúčaný vek: {formatBoardGameRange(data.ageRecommendation, "rokov")}</p>}
                {renderPublished()}
                {data.note && <p>Poznámka: {data.note}</p>}
                {renderParentChildren()}

                {renderUrl()}
            </div>
        </div>
    );
});

export default BoardGameDetail;

