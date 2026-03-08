import React from "react";
import { IAutor, IBook, ILangCode, IUser } from "../../type";
import { formatDimension, getPublishedCountry, langCode, cities } from "@utils";
import { useTranslation } from "react-i18next";

interface IExtendedBook extends IBook {
    autorsFull?: string | null;
    editorsFull?: string | null;
    illustratorsFull?: string | null;
    translatorsFull?: string | null;
}

interface Props {
    data: IExtendedBook;
}

const BookDetail: React.FC<Props> = React.memo(({ data }) => {
    const { t } = useTranslation();
    // Helper functions
    const renderContributorRow = (
        contributors: keyof IExtendedBook,
        contributorsText: keyof IExtendedBook,
        labelKey: string
    ) => {
        if (!data[contributors] || !data[contributorsText]) return null;

        const count = (data[contributors] as IAutor[]).length;
        const label = t(labelKey, { count });

        return <p>{`${label}: ${data[contributorsText]}`}</p>;
    };

    const renderDimensions = () => {
        if (!data.dimensions) return null;

        const { dimensions } = data;

        return (
            <>
                <p>{t("bookDetail.dimensions")}: </p>
                <table className="bookDimensions">
                    <tbody>
                        <tr>
                            <td>{t("bookDetail.height")}: {formatDimension(dimensions.height, t('common.locale')) ?? "-"} cm</td>
                            <td>{t("bookDetail.width")}: {formatDimension(dimensions.width, t('common.locale')) ?? "-"} cm</td>
                        </tr>
                        <tr>
                            <td>{t("bookDetail.thickness")}: {formatDimension(dimensions.thickness, t('common.locale')) ?? "-"} cm</td>
                            <td>
                                {dimensions.weight && `${t("bookDetail.weight")}: ${formatDimension(dimensions.weight, t('common.locale')) ?? "-"} g`}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p />
            </>
        );
    };

    const renderLanguage = () => {
        if (!data.language || data.language.length === 0) return null;

        const languageText = Array.isArray(data.language)
            ? langCode
                .filter((lang: ILangCode) =>
                    (data.language as unknown as string[])?.includes(lang.key)
                )
                .map(l => l.value)
                .join(", ")
            : data.language;

        return <p>{t("bookDetail.language")}: {languageText}</p>;
    };

    const renderPublisherInfo = () => {
        const { publisher, year, country } = data.published ?? {};

        if (!publisher && !year && !country) return null;

        const publisherText = `${publisher ?? "-"}`;
        const yearText = year ? `, ${year}` : "";
        const countryText = country ? `, ${getPublishedCountry(country)?.value ?? ""}` : "";

        return <p>{t("bookDetail.publisher")}: {publisherText}{yearText}{countryText}</p>;
    };

    const renderLocation = () => {
        if (!data.location) return null;

        const cityName = cities
            .filter(c => c.value === data.location?.city)
            .map(c => c.showValue)
            .join(", ");
        const shelf = data.location.shelf ?? "";

        return <p>{t("bookDetail.location")}: {`${cityName} ${shelf}`}</p>;
    };

    const renderPeopleList = (people: IUser[] | undefined, label: string) => {
        if (!people || people.length === 0) return null;

        const namesList = people.map(person => person.firstName).join(", ");

        return <p>{label}: {namesList}</p>;
    };

    const renderExternalLinks = () => {
        if (!data.hrefDatabazeKnih && !data.hrefGoodReads) return null;

        return (
            <p className="detailHrefs">
                {data.hrefDatabazeKnih && (
                    <a href={data.hrefDatabazeKnih} target="_blank" rel="noopener noreferrer">
                        <img
                            src="img/DBKicon.png"
                            width="32"
                            alt="DBK"
                            style={{ marginLeft: "0.3rem" }}
                        />
                    </a>
                )}
                {data.hrefGoodReads && (
                    <a href={data.hrefGoodReads} target="_blank" rel="noopener noreferrer">
                        <img
                            src="https://www.goodreads.com/favicon.ico"
                            width="32"
                            alt="GR"
                            style={{ marginLeft: "0.3rem" }}
                        />
                    </a>
                )}
            </p>
        );
    };

    const renderBookCover = () => {
        return (
            <div>
                {data.picture ? (
                    <img src={data.picture} alt={t("bookDetail.coverAlt")} />
                ) : (
                    <img
                        src="img/no_thumbnail.svg"
                        alt={t("bookDetail.noCoverAlt")}
                    />
                )}
            </div>
        );
    };

    // Main render
    return (
        <div className="bookDetailRow">
            <div>
                {renderBookCover()}
                {renderExternalLinks()}
            </div>

            <div>
                <h1>{data.title}</h1>
                {data.subtitle && <h4>{data.subtitle}</h4>}

                <h3>{renderContributorRow("autor", "autorsFull", "bookDetail.authors")}</h3>
                {renderContributorRow("editor", "editorsFull", "bookDetail.editors")}
                {renderContributorRow("ilustrator", "illustratorsFull", "bookDetail.illustrators")}
                {renderContributorRow("translator", "translatorsFull", "bookDetail.translators")}

                {renderLanguage()}
                {data.ISBN && <p>ISBN: {data.ISBN}</p>}
                {data.numberOfPages && <p>{t("bookDetail.pages")}: {data.numberOfPages}</p>}
                {renderPublisherInfo()}
                {renderLocation()}
                {renderPeopleList(data.owner, t("bookDetail.owner"))}
                {renderPeopleList(data.readBy, t("bookDetail.readBy"))}
                {renderDimensions()}
                {data.note && <p>{t("bookDetail.note")}: {data.note}</p>}

                <p>
                    {t("common.exLibris")}: {data.exLibris ?
                        <span className="trueMark" /> :
                        <span className="falseMark" />
                    }
                </p>
            </div>
        </div>
    );
});

export default BookDetail;