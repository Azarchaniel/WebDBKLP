import React from "react";
import { Link } from "react-router-dom";
import { IAutor, IBook, ILangCode, IUser } from "../../type";
import { formatDimension, getPublishedCountry, langCode, CITIES, formatNumberLocale } from "@utils";
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
    ): string | undefined => {
        if (!data[contributors] || !data[contributorsText]) return;

        const count = (data[contributors] as IAutor[]).length;
        const label = t(labelKey, { count });

        return `${label}: ${data[contributorsText]}`;
    };

    const renderContributorLinks = (
        contributors: keyof IExtendedBook,
        labelKey: string
    ): React.ReactNode => {
        const items = data[contributors] as IAutor[];
        if (!items || items.length === 0) return null;

        const count = items.length;
        const label = t(labelKey, { count });

        return (
            <tr>
                <td><b>{label}: </b></td>
                <td>
                    {items.map((autor, i) => (
                        <React.Fragment key={autor._id}>
                            {i > 0 && ", "}
                            <Link to={`/autors/${autor._id}`}>
                                {autor.fullName ?? `${autor.firstName ?? ""} ${autor.lastName}`.trim()}
                            </Link>
                        </React.Fragment>
                    ))}
                </td>
            </tr>
        );
    };

    const renderDimensions = () => {
        if (!data.dimensions || Object.values(data.dimensions).every((v: any) => !v)) return null;

        const { dimensions } = data;

        return (
            <tr>
                <td><b>{t("bookDetail.dimensions")}:</b></td>
                <td style={{ display: "flex", flexDirection: "column", height: "auto" }}>
                    <span>{t("bookDetail.height")}: {formatDimension(dimensions.height, t('common.locale')) ?? "-"} cm</span>
                    <span>{t("bookDetail.width")}: {formatDimension(dimensions.width, t('common.locale')) ?? "-"} cm</span>
                    <span>{t("bookDetail.thickness")}: {formatDimension(dimensions.thickness, t('common.locale')) ?? "-"} cm</span>
                    {dimensions.weight && <span>{t("bookDetail.weight")}: {formatDimension(dimensions.weight, t('common.locale')) ?? "-"} g</span>}
                </td>
            </tr>
        );
    };

    const renderLanguage = (): string | undefined => {
        if (!data.language || data.language.length === 0) return;

        const languageText = Array.isArray(data.language)
            ? langCode
                .filter((lang: ILangCode) =>
                    (data.language as unknown as string[])?.includes(lang.key)
                )
                .map(l => l.value)
                .join(", ")
            : data.language;

        return `${t("bookDetail.language")}: ${languageText}`;
    };

    const renderPublisherInfo = (): string | undefined => {
        const { publisher, year, country } = data.published ?? {};

        if (!publisher && !year && !country) return;

        const publisherText = `${publisher ?? "-"}`;
        const yearText = year ? `, ${year}` : "";
        const countryText = country ? `, ${getPublishedCountry(country)?.value ?? ""}` : "";

        return `${t("bookDetail.publisher")}: ${publisherText}${yearText}${countryText}`;
    };

    const renderLocation = (): string | undefined => {
        if (!data.location) return;

        const cityName = CITIES
            .filter(c => c.value === data.location?.city)
            .map(c => c.showValue)
            .join(", ");
        const shelf = data.location.shelf ?? "";

        return `${t("bookDetail.location")}: ${cityName} ${shelf}`;
    };

    const renderPeopleList = (people: IUser[] | undefined, label: string): string | undefined => {
        if (!people || people.length === 0) return;

        const namesList = people.map(person => person.firstName).join(", ");

        return `${label}: ${namesList}`;
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

    const renderTableRow = (content: string | undefined) => {
        if (!content) return null;
        const [label, value] = content.split(":").map(s => s.trim());
        return <tr><td><b>{label}: </b></td><td>{value}</td></tr>;
    }

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

                <table>
                    <tbody>
                        {renderContributorLinks("autor", "bookDetail.authors")}
                        {renderContributorLinks("editor", "bookDetail.editors")}
                        {renderContributorLinks("ilustrator", "bookDetail.illustrators")}
                        {renderContributorLinks("translator", "bookDetail.translators")}
                        {renderTableRow(renderLanguage())}
                        {renderTableRow(`ISBN: ${data.ISBN}`)}
                        {data.numberOfPages && renderTableRow(`${t("bookDetail.pages")}: ${formatNumberLocale(data.numberOfPages, t('common.locale'), 0)}`)}
                        {renderTableRow(renderPublisherInfo())}
                        {renderTableRow(renderLocation())}
                        {renderTableRow(renderPeopleList(data.owner, t("bookDetail.owner")))}
                        {renderTableRow(renderPeopleList(data.readBy, t("bookDetail.readBy")))}
                        {renderDimensions()}
                        {data.note && renderTableRow(`${t("bookDetail.note")}: ${data.note}`)}

                        {renderTableRow(`Ex Libris: ${data.exLibris ? "✔" : "✘"}`)}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default BookDetail;