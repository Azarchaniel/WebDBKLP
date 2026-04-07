import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";
import { Tab, Tabs } from "@components/Tabs";

interface OldestBookGroup {
    year: number;
    books: { title: string; _id: string; year: number; picture?: string | null; author?: string }[];
    count: number;
}

interface Props {
    oldestBooks: OldestBookGroup[] | undefined;
}

export const TableOldestBooks = ({ oldestBooks }: Props): ReactElement => {
    const { t, i18n } = useTranslation();
    if (!oldestBooks || oldestBooks?.length === 0) return <NoData />;

    const locale = i18n.resolvedLanguage || i18n.language || "en";
    const numberFormatter = new Intl.NumberFormat(locale);
    const filteredGroups = oldestBooks
        .filter((group) => Number.isFinite(group.year))
        .sort((a, b) => a.year - b.year)
        .slice(0, 10);

    if (filteredGroups.length === 0) return <NoData />;

    return (
        <div className="dashboardTabbedCardContent">
            <h5 className="dashboardTitle">{t("dashboard.oldestBooks")}</h5>
            <Tabs className="dashboardTabbedCardTabs">
                {filteredGroups.map((group) => {
                    const yearLabel = numberFormatter.format(group.year);
                    return (
                        <Tab key={group.year} label={yearLabel}>
                            <div className="dashboardBookList">
                                {group.books.map((book) => (
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
                                        <div className="dashboardBookMeta">
                                            <Link to={`/books/${book._id}`} className="dashboardBookTitle">{book.title}</Link>
                                            {book.author && (
                                                <span className="dashboardBookAuthor">{book.author}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Tab>
                    );
                })}
            </Tabs>
        </div>
    );
};
