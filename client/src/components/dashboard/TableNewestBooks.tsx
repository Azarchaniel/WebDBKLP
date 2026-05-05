import { ReactElement, useState } from "react";
import { Link } from "react-router-dom";
import { NoData } from "./NoData";
import { useTranslation } from "react-i18next";
import { TooltipedText } from "@utils";
import { Tab, Tabs } from "@components/Tabs";

interface RecentBook {
    title: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    picture?: string | null;
    author?: string;
}

interface Props {
    recentBooks: RecentBook[] | undefined;
}

const CREATED_THRESHOLD_MS = 1000;

export const TableNewestBooks = ({ recentBooks }: Props): ReactElement => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState<"added" | "updated" | "deleted">("added");

    const locale = i18n.resolvedLanguage || i18n.language || "en";

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(date);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
    };

    const books = recentBooks ?? [];

    if (books.length === 0) return <NoData />;

    const addedBooks = books.filter(b => !b.deletedAt && Math.abs(new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime()) <= CREATED_THRESHOLD_MS);
    const editedBooks = books.filter(b => !b.deletedAt && Math.abs(new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime()) > CREATED_THRESHOLD_MS);
    const deletedBooks = books.filter(b => !!b.deletedAt);

    const tabAddedLabel = t("dashboard.tabAdded");
    const tabUpdatedLabel = t("dashboard.tabUpdated");
    const tabDeletedLabel = t("dashboard.tabDeleted");

    const titleMap: Record<typeof activeTab, string> = {
        added: t("dashboard.recentlyAddedBooks"),
        updated: t("dashboard.recentlyUpdatedBooks"),
        deleted: t("dashboard.recentlyDeletedBooks"),
    };

    const renderBookList = (list: RecentBook[], dateKey: keyof RecentBook) => {
        if (list.length === 0) return <NoData />;
        return (
            <div className="dashboardCardScrollBody">
                {list.map((book) => (
                    <div key={book._id} className="dashboardBookRow">
                        {book.picture ? (
                            <img src={book.picture} alt={book.title} className="dashboardBookThumb" />
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
                            elementText={formatDate(book[dateKey] as string)}
                            tooltipText={formatTime(book[dateKey] as string)}
                            spanClass="dashboardBookDate"
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="dashboardTabbedCardContent">
            {recentBooks && recentBooks.length > 0 && <h5 className="dashboardTitle">{titleMap[activeTab]}</h5>}
            <Tabs
                onTabChange={(label) => {
                    if (label === tabUpdatedLabel) setActiveTab("updated");
                    else if (label === tabDeletedLabel) setActiveTab("deleted");
                    else setActiveTab("added");
                }}
            >
                <Tab label={tabAddedLabel}>
                    {renderBookList(addedBooks, "createdAt")}
                </Tab>
                <Tab label={tabUpdatedLabel}>
                    {renderBookList(editedBooks, "updatedAt")}
                </Tab>
                <Tab label={tabDeletedLabel}>
                    {renderBookList(deletedBooks, "deletedAt")}
                </Tab>
            </Tabs>
        </div>
    );
};

