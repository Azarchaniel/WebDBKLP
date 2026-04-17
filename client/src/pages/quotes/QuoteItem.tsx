import React, { useState } from "react";
import { IQuote } from "../../type";
import { formPersonsFullName, stringifyUsers } from "@utils";
import { Wysiwyg } from "@components/Wysiwyg";
import { useAuth } from "@utils/context";
import { useQuoteModal } from "@components/quotes/useQuoteModal";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface QuoteProps {
    quote: IQuote;
    bcgrClr: string;
    deleteQuote: (_id: string) => void;
    saveQuote: (formData: IQuote) => void;
    saveResultSuccess?: boolean;
}

const Quote: React.FC<QuoteProps> = ({ quote, bcgrClr, deleteQuote, saveQuote, saveResultSuccess }) => {
    const { t } = useTranslation();
    const { isLoggedIn, isGuest } = useAuth();
    const { openQuoteModal } = useQuoteModal();

    const makeImgClickable = (text: string): string => {
        if (!text || text.substring(0, 4) !== "<img") {
            return text;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const imgElement = doc.querySelector("img");

            if (imgElement) {
                //open img on new tab, where it can be natively zoomable
                const imgSrc = imgElement.getAttribute("src");
                imgElement.setAttribute("onclick", `window.open('${imgSrc}', '_blank')`);
                imgElement.style.cursor = "pointer";
                return imgElement.outerHTML;
            }
        } catch (error) {
            console.error("Error processing image:", error);
        }

        return text;
    };

    const renderAuthorName = (): string => {
        if (!quote.fromBook?.autor?.[0]) {
            return "";
        }

        const authorName = formPersonsFullName(quote.fromBook.autor[0]);
        return authorName ? String(authorName) : "";
    };

    const renderBookTitle = (): React.ReactNode => {
        if (!quote.fromBook?.title) {
            return null;
        }

        const pageInfo = quote.pageNo ? `, s. ${quote.pageNo}` : "";
        return <h4>{quote.fromBook.title}{pageInfo}</h4>;
    };

    const handleEdit = (): void => {
        openQuoteModal(quote, saveQuote, saveResultSuccess);
    };

    return (
        <div className="Quote" style={{ backgroundColor: bcgrClr }}>
            <div className="text">
                {renderBookTitle()}

                {quote.fromBook?.autor?.[0]?._id && (
                    <p>
                        <Link to={`/autors/${quote.fromBook.autor[0]._id}`} className="secondaryText">{renderAuthorName()}</Link>
                    </p>
                )}

                <Wysiwyg
                    value={makeImgClickable(quote?.text || "")}
                    onChange={() => {
                    }}
                    name="text"
                    disabled={true}
                    hidetoolbar="true"
                />

                {quote.owner && (
                    <p>
                        <span className="secondaryText">
                            {t("quotes.added")}{stringifyUsers(quote.owner, false)}
                        </span>
                    </p>
                )}

                {quote.note && (
                    <p>
                        <span className="secondaryText">{t("quotes.note")}{quote.note}</span>
                    </p>
                )}
            </div>

            {isLoggedIn && !isGuest && (
                <div className="card-btn-wrapper">
                    <i className="fas fa-pen" onClick={handleEdit} data-tooltip-id="global-tooltip" data-tooltip-content={t("quotes.edit")} />
                    &nbsp;&nbsp;&nbsp;
                    <i
                        className="fas fa-trash"
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content={t("quotes.delete")}
                        onClick={() => deleteQuote(quote._id)}
                    />
                </div>
            )}
        </div>
    );
};

export default Quote;