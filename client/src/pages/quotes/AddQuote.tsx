import {IBook, IQuote, IUser} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {Multiselect} from "multiselect-react-dropdown";
import {getBooks, getQuote, getUsers} from "../../API";
import ReactTooltip from "react-tooltip";
import ToggleButton from "../../components/ToggleButton";
import { getCssPropertyValue } from "../../utils/utils";

type Props = {
    saveQuote: (e: React.FormEvent, formData: IQuote | any) => void;
    id?: string | undefined;
}

const AddQuote: React.FC<Props> = ({saveQuote, id}: { saveQuote: any, id?: string | undefined }) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [isText, setIsText] = useState<boolean>(true);
    const [formData, setFormData] = useState<IQuote | any>({fromBook: null, owner: null, _id: null, text: '', note: '', pageNo: null});
    const [books, setBooks] = useState<IBook[]>();
    const [error, setError] = useState<string | undefined>('Text citátu musí obsahovať aspoň jeden znak!');
    const [users, setUsers] = useState<IUser[] | undefined>();
    const ownerRef = useRef(null);
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

        if (id) {
            setShowModal(true);
            getQuote(id).then(quote => {
                const currentQuote = quote.data.quote;
                setFormData({
                    _id: currentQuote?._id, 
                    text: currentQuote?.text || undefined, 
                    fromBook: currentQuote?.fromBook || undefined,
                    pageNo: currentQuote?.pageNo || undefined,
                    owner: currentQuote?.owner || undefined,
                    note: currentQuote?.note || undefined
                });
            })
            .catch(err => console.trace("Error while fetching Quotes", err));
        }
    }, [])

    //ERROR HANDLING
    useEffect(() => {
        const data = (formData as unknown as IQuote);
        if (!data || !Object.keys(data).length) return;

        if (!data?.text && data?.text.trim().length < 1) {
            return setError('Text citátu musí obsahovať aspoň jeden znak!')
        }
        if (!data?.fromBook) {
            return setError('Musí byť vybraná kniha!');
        }
        return setError(undefined);
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
        //@ts-ignore
        ownerRef?.current?.resetSelectedValues();
    }

    const onChange = (selected: any, type: "user" | "book") => {
        //todo: merge with "handleForm"
        type === "user" ? 
            setFormData({...formData, owner: selected}) : 
            setFormData({...formData, fromBook: selected ? selected[0]._id : null});
    }

    const showAddQuote = () => {
        return (<>
            {id ? <></> : <button type="button" className="addQuote" onClick={() => setShowModal(true)} data-tip="Pridaj citát"/>}

            {showModal ?
                <>
                    <div className="modalBgr"/>
                    <div className="modalBody">
                        <div className="modal-header" style={{marginBottom: "1rem"}}>
                            <h5 className="modal-title" id="exampleModalLabel"><b>Pridať citát</b></h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                            saveQuote(e, formData);
                            cleanFields();
                            setShowModal(false);
                        }}>
                            <input type="hidden" name="id" value={id}/>
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
                                        onSelect={(value: IBook[]) => onChange(value, "book")}
                                        onRemove={(value: IBook[]) => onChange(value, "book")}
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
                                           className="form-control" autoComplete="off" value={formData && "pageNo" in formData ? formData.pageNo : ''}/>
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
                                        onSelect={(value: IUser) => onChange(value, "user")}
                                        onRemove={(value: IUser) => onChange(value, "user")}
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
                                        selectedValues={formData.owner}
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
                            <div style={{height: '5px', width: '100%'}}/>

                            {showError()}
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary"
                                        onClick={cleanFields}>Vymazať polia
                                </button>
                                <button type="button" className="btn btn-secondary"
                                        onClick={() => {setShowModal(false); id = undefined}}>Zavrieť
                                </button>
                                <button type="submit"
                                        disabled={Boolean(error)}
                                        className="btn btn-success">Uložiť citát
                                </button>
                            </div>
                        </form>
                    </div>
                </>
                : <></>}
            <ReactTooltip place="bottom" effect="solid"/>
        </>);
    }

    return (
        <>
            {showAddQuote()}
        </>
    );
}

export default AddQuote;