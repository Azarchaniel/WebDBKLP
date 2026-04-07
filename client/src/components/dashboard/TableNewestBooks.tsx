import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";
import { TooltipedText } from "@utils";

interface NewestBook {
    title: string;
    _id: string;
    createdAt: string;
    picture?: string | null;
    author?: string;
}

interface Props {
    newestBooks: NewestBook[] | undefined;
}

export const TableNewestBooks = ({ newestBooks }: Props): ReactElement => {
    const { t, i18n } = useTranslation();
    if (!newestBooks || newestBooks?.length === 0) return <NoData />;

    const locale = i18n.resolvedLanguage || i18n.language || "en";

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(date);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
    };

    return (
        <div className="dashboardTabbedCardContent">
            <h5 className="dashboardTitle">{t("dashboard.newestBooks")}</h5>
            <div className="dashboardCardScrollBody">
                {newestBooks.map((book) => (
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

                        <TooltipedText
                            elementText={formatDate(book.createdAt)}
                            tooltipText={formatTime(book.createdAt)}
                            spanClass="dashboardBookDate"
                        />

                    </div>
                ))}
            </div>
        </div>
    );
};
