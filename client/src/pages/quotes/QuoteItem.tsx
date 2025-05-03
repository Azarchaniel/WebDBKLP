import React, {useState} from "react";
import {IQuote} from "../../type";
import AddQuote from "./AddQuote";
import {formPersonsFullName, stringifyUsers} from "@utils";
import {Wysiwyg} from "@components/Wysiwyg";
import {useAuth} from "@utils/context";

interface QuoteProps {
    quote: IQuote;
    bcgrClr: string;
    deleteQuote: (_id: string) => void;
    saveQuote: (formData: IQuote) => void;
    saveResultSuccess?: boolean;
}

const Quote: React.FC<QuoteProps> = ({quote, bcgrClr, deleteQuote, saveQuote, saveResultSuccess}) => {
    const {isLoggedIn} = useAuth();
    const [isEditing, setIsEditing] = useState<boolean>(false);

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
        setIsEditing(true);
    };

    const handleCloseEdit = (): void => {
        setIsEditing(false);
    };

    return (
        <div className="Quote" style={{backgroundColor: bcgrClr}}>
            <div className="text">
                {renderBookTitle()}

                {quote.fromBook?.autor && (
                    <p>
                        <span className="quoteOwner">{renderAuthorName()}</span>
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
						<span className="quoteOwner">
						  Pridal: {stringifyUsers(quote.owner, false)}
						</span>
                    </p>
                )}

                {quote.note && (
                    <p>
                        <span className="quoteOwner">Poznámka: {quote.note}</span>
                    </p>
                )}
            </div>

            {isLoggedIn && (
                <div className="card-btn-wrapper">
                    <i className="fas fa-pen" onClick={handleEdit}/>
                    &nbsp;&nbsp;&nbsp;
                    <i
                        className="fas fa-trash"
                        onClick={() => deleteQuote(quote._id)}
                    />
                </div>
            )}

            {isEditing && (
                <AddQuote
                    key={quote._id}
                    saveQuote={saveQuote}
                    quote={quote}
                    onClose={handleCloseEdit}
                    saveResultSuccess={saveResultSuccess}
                />
            )}
        </div>
    );
};

export default Quote;