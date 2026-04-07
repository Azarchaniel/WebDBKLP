import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";
import { Tab, Tabs } from "@components/Tabs";

interface BiggestBook {
    title: string;
    _id: string;
    value: number | null;
    height?: number | null;
    width?: number | null;
    picture?: string | null;
    author?: string;
}

interface Props {
    biggestBooks: Record<string, BiggestBook[]> | undefined;
}

export const TableBiggestBooks = ({ biggestBooks }: Props): ReactElement => {
    const { t, i18n } = useTranslation();

    if (!biggestBooks || Object.keys(biggestBooks).length === 0) return <NoData />;

    const locale = i18n.resolvedLanguage || i18n.language || "en";
    const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });

    const dimensions = [
        { key: 'height', label: t("dashboard.height") + " (cm)" },
        { key: 'width', label: t("dashboard.width") + " (cm)" },
        { key: 'thickness', label: t("dashboard.thickness") + " (cm)" },
        { key: 'weight', label: t("dashboard.weight") + " (g)" },
        { key: 'square', label: t("dashboard.square") }
    ];

    const filteredDimensions = dimensions.filter(d => biggestBooks[d.key]?.length > 0);

    if (filteredDimensions.length === 0) return <NoData />;

    return (
        <div className="dashboardTabbedCardContent">
            <h5 className="dashboardTitle">{t("dashboard.biggestBooks")}</h5>
            <Tabs className="dashboardTabbedCardTabs">
                {filteredDimensions.map((dim) => (
                    <Tab key={dim.key} label={dim.label}>
                        <div className="dashboardBookList">
                            {biggestBooks[dim.key]?.map((book) => (
                                <div key={book._id} className="dashboardBookRow">
                                    {book.picture ? (
                                        <img
                                            src={book.picture}
                                            alt={book.title}
                                            className="dashboardBookThumb"
                                        />
                                    ) : (
                                        <div className="dashboardBookThumbPlaceholder" />
                                    )}
                                    <div className="dashboardBookMeta dashboardBookMetaGrow">
                                        <Link to={`/books/${book._id}`} className="dashboardBookTitle">
                                            {book.title}
                                        </Link>
                                        {book.author && <span className="dashboardBookAuthor">{book.author}</span>}
                                    </div>
                                    <span className="dashboardBookValue">
                                        {dim.key === "square"
                                            ? (book.height != null && book.width != null
                                                ? `${numberFormatter.format(Number(book.height))} × ${numberFormatter.format(Number(book.width))} cm`
                                                : "N/A")
                                            : (book.value != null ? numberFormatter.format(Number(book.value)) + (dim.key === "weight" ? " g" : " cm") : "N/A")
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Tab>
                ))}
            </Tabs>
        </div>
    );
};
