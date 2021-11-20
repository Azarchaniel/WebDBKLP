import {IBook, IQuote} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {Multiselect} from "multiselect-react-dropdown";
import {getBooks} from "../../API";

type Props = {
    saveQuote: (e: React.FormEvent, formData: IQuote | any) => void
}

const AddQuote: React.FC<Props> = ({saveQuote}: {saveQuote: any}) => {
    const [formData, setFormData] = useState<IQuote | {}>();
    const [books, setBooks] = useState<IBook | {}>();
    const [error, setError] = useState<string | undefined>(undefined);
    const bookRef = useRef(null);

    useEffect(() => {
        getBooks()
            .then(books => {
                setBooks(books.data.books.map((book: IBook) => ({
                    ...book,
                    showName: `${book.title} 
                        ${book.autor && book.autor[0] && book.autor[0].firstName ? '/ ' + book.autor[0].firstName : ''} 
                        ${book.autor && book.autor[0] && book.autor[0].lastName ? book.autor[0].lastName : ''} 
                        ${book.published && book.published?.year ? '/ ' + book.published?.year : ''}`
                }))
                    .filter((book:IBook) => !book.isDeleted)
                    .sort((a: Partial<IBook>, b: Partial<IBook>) => a.title!.localeCompare(b.title!)));
            })
            .catch(err => {
                toast.error('Nepodarilo sa nacitat knihy!');
                console.error('Couldnt fetch books', err)
            });
    }, [formData])

    useEffect(() => {
        //shortcut
        const data = (formData as unknown as IQuote);

        //if there is no filled field, its disabled
        if (!data) return;

        if (data?.text && data.text.trim().length > 0) {
            setError(undefined);
        } else {
            setError('Text citátu musí obsahovať aspoň jeden znak!')
        }
    }, [formData])

    const handleForm = (e: any): void => {
        try {
            setFormData({
                ...formData,
                [e?.currentTarget.id]: e?.currentTarget.value
            })
        } catch (err) {
            toast.error('Chyba pri zadávaní do formuláru!')
            console.error('AddQuote(handleForm)', err)
        }
    }

    const showError = () => {
        if (!error) return <></>;
        return (
            <div className="alert alert-danger"><FontAwesomeIcon icon={faExclamationTriangle}/> {error}</div>
        );
    }

    const cleanFields = () => {
        setFormData({});
        //@ts-ignore
        bookRef?.current?.resetSelectedValues();
    }

    const showAddQuote = () => {
        return (<>
            <button type="button" className="btn btn-dark" data-toggle="modal" data-target="#quoteModal">
                Pridaj citát
            </button>

            <div className="modal fade" id="quoteModal" tabIndex={-1} role="dialog"
                 aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel"><b>Pridať citát</b></h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => {
                                saveQuote(e, formData);
                                cleanFields();
                            }}>
                                <div className="row">
                                    <div className="col">
                                        <textarea onChange={handleForm} id='text' placeholder='*Text'
                                               className="form-control" autoComplete="off"
                                               value={formData && "text" in formData ? formData.text : ''}/>
                                    </div>
                                </div>
                                <div style={{height: '5px', width: '100%'}}/>
                                <div className="row">
                                    <Multiselect
                                        options={books}
                                        isObject={true}
                                        displayValue="showName"
                                        closeOnSelect={true}
                                        placeholder="Z knihy"
                                        closeIcon="cancel"
                                        emptyRecordMsg="Žiadne knihy nenájdené"
                                        selectionLimit={1}
                                        onSelect={(pickedBook: IBook[]) => {
                                            setFormData({...formData, fromBook: pickedBook
                                                    .map(v => v._id)})
                                        }}
                                        style={{
                                            inputField: {marginLeft: "0.5rem"},
                                            optionContainer: {
                                                backgroundColor: "transparent",
                                            },
                                            option: {},
                                            multiselectContainer: {maxWidth: '100%'},
                                        }}
                                        ref={bookRef}
                                    />
                                </div>
                                <div style={{height: '5px', width: '100%'}}/>
                                {showError()}
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary"
                                            onClick={cleanFields}>Vymazať polia
                                    </button>
                                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Zavrieť
                                    </button>
                                    {/* TODO: add button Save and add another */}
                                    <button type="submit"
                                            disabled={Boolean(error)}
                                            className="btn btn-success">Uložiť citát
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>);
    }

    return (
        <>
            {showAddQuote()}
        </>
    );
}

export default AddQuote;