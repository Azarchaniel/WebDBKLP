import {IBook, IQuote, IUser} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {getBooks, getUsers} from "../../API";
import {toast} from "react-toastify";
import {showError} from "../Modal";
import {Multiselect} from "multiselect-react-dropdown";
import ToggleButton from "../ToggleButton";
import {getCssPropertyValue} from "../../utils/utils";

interface BodyProps {
    data: IQuote | Object;
    onChange: (data: IQuote | Object) => void;
    error: (err: string | undefined) => void;
    editedQuote?: IQuote;
}

interface ButtonsProps {
    saveQuote: () => void;
    cleanFields: () => void;
    error?: string | undefined;
}

export const QuotesModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [isText, setIsText] = useState<boolean>(true);
    const [formData, setFormData] = useState<IQuote | any>({
        fromBook: null,
        owner: null,
        _id: null,
        text: '',
        note: '',
        pageNo: null
    });
    const [books, setBooks] = useState<IBook[]>();
    const [users, setUsers] = useState<IUser[] | undefined>();
    const ownerRef = useRef(null);
    const bookRef = useRef(null);

    useEffect(() => {
        onChange(formData)
    }, [formData]);

    /*useEffect(() => {
        setFormData(data);
    }, [data]);*/

    useEffect(() => {
        console.log(data)
    }, []);

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
                    .filter((book: IBook) => !book.deletedAt)
                    .sort((a: Partial<IBook>, b: Partial<IBook>) => a.title!.localeCompare(b.title!)));
            })
            .catch(err => {
                toast.error('Nepodarilo sa nacitat knihy!');
                console.error('Couldnt fetch books', err)
            });

        getUsers().then(user => {
            setUsers(user.data.users.map((user: IUser) => ({
                ...user,
                fullName: `${user.lastName}, ${user.firstName}`
            })).sort((a: any, b: any) => a.fullName!.localeCompare(b.fullName!)));
        }).catch(err => console.trace("Error while fetching Users", err));

        // if (id) {
        //     setShowModal(true);
        //     getQuote(id).then(quote => {
        //         const currentQuote = quote.data.quote;
        //         setFormData({
        //             _id: currentQuote?._id,
        //             text: currentQuote?.text || undefined,
        //             fromBook: currentQuote?.fromBook || undefined,
        //             pageNo: currentQuote?.pageNo || undefined,
        //             owner: currentQuote?.owner || undefined,
        //             note: currentQuote?.note || undefined
        //         });
        //     })
        //         .catch(err => console.trace("Error while fetching Quotes", err));
        // }
    }, [])

    //ERROR HANDLING
    useEffect(() => {
        const data = (formData as unknown as IQuote);
        if (!data || !Object.keys(data).length) return;

        if (!data?.text && data?.text.trim().length < 1) {
            return error('Text citátu musí obsahovať aspoň jeden znak!')
        }
        console.log(data)
        if (!data?.fromBook) {
            return error('Musí byť vybraná kniha!');
        }
        return error('');
    }, [formData])

    const handleForm = (e: any): void => {
        console.log(e)
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

    const onChangeBookUser = (selected: any, type: "user" | "book") => {
        //todo: merge with "handleForm"
        type === "user" ?
            setFormData({...formData, owner: selected}) :
            setFormData({...formData, fromBook: selected ? selected[0]._id : null});
    }

    return (<form>
        <div className="row">
            <div className="col-12">
                {isText ? <textarea onChange={handleForm} id='text' placeholder='*Text'
                                    className="form-control" autoComplete="off"
                                    value={formData && "text" in formData ? formData?.text : ''}/> :
                    <label className="btn btn-dark">
                        <i className="fa fa-image"/> Nahraj obrázky
                        <input type="file" style={{display: "none"}} name="image" accept="image/*"/>
                    </label>
                }
            </div>
        </div>
        <div style={{height: '5px', width: '100%'}}/>
        <div className="row">
            <div className="col-3">
                <ToggleButton labelLeft="Text" labelRight="Obrázok"
                              state={() => setIsText(!isText)}/>
            </div>
            <div className="col-6">
                <Multiselect
                    selectionLimit={1} /* searching doesnt work on single select */
                    options={books}
                    isObject={true}
                    displayValue="title"
                    closeOnSelect={true}
                    placeholder="*Z knihy"
                    closeIcon="cancel"
                    emptyRecordMsg="Žiadne knihy nenájdené"
                    onSelect={(book: IBook) => onChangeBookUser(book, "book")}
                    onRemove={(book: IBook) => onChangeBookUser(book, "book")}
                    style={{
                        inputField: {marginLeft: "0.5rem"},
                        optionContainer: {backgroundColor: "transparent"},
                        option: {color: 'black'},
                        multiselectContainer: {maxWidth: '100%'},
                        chips: {backgroundColor: getCssPropertyValue("--anchor")}
                    }}
                    ref={bookRef}
                    selectedValues={books?.filter((book: IBook) => formData?.fromBook?._id === book?._id)}
                />
            </div>
            <div className="col-3">
                <input type="number" id="pageNo" onChange={handleForm} placeholder="Strana"
                       className="form-control" autoComplete="off"
                       value={formData && "pageNo" in formData ? formData.pageNo : ''}/>
            </div>
        </div>
        <div style={{height: '5px', width: '100%'}}/>
        <div className="row">
            <div className="col">
                <Multiselect
                    options={users}
                    placeholder="Vlastník"
                    displayValue="firstName"
                    emptyRecordMsg="Žiadni užívatelia nenájdení"
                    closeIcon="cancel"
                    onSelect={(user: IUser) => onChangeBookUser(user, "user")}
                    onRemove={(user: IUser) => onChangeBookUser(user, "user")}
                    style={{
                        inputField: {marginLeft: "0.5rem"},
                        searchBox: {
                            width: "100%",
                            paddingRight: '5px',
                            marginRight: '-5px',
                            borderRadius: '3px'
                        },
                        option: {color: "black"},
                        chips: {backgroundColor: getCssPropertyValue("--anchor")}
                    }}
                    ref={ownerRef}
                    selectedValues={formData?.owner}
                />
            </div>
        </div>
        <div style={{height: '5px', width: '100%'}}/>
        <div className="row">
            <div className="col">
                <textarea onChange={handleForm} id="note" placeholder="Poznámka"
                          className="form-control" autoComplete="off"
                          value={formData && "note" in formData ? formData.note : ''}/>

            </div>
        </div>
    </form>)
}

export const QuotesModalButtons = ({saveQuote, cleanFields, error}: ButtonsProps) => {
    return (<div className="column">
        <div>{showError(error)}</div>

        <div className="buttons">
            <button type="button" className="btn btn-secondary"
                    onClick={cleanFields}>Vymazať polia
            </button>
            <button type="submit"
                    disabled={Boolean(error)}
                    onClick={saveQuote}
                    className="btn btn-success">Uložiť citát
            </button>
        </div>
    </div>)
}