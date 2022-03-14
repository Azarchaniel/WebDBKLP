import {IBook, IQuote, IUser} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {Multiselect} from "multiselect-react-dropdown";
import {getBooks, getUsers} from "../../API";
import ReactTooltip from "react-tooltip";

type Props = {
    saveQuote: (e: React.FormEvent, formData: IQuote | any) => void
}

const AddQuote: React.FC<Props> = ({saveQuote}: { saveQuote: any }) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [formData, setFormData] = useState<IQuote | {}>();
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
                    .filter((book: IBook) => !book.isDeleted)
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
        }).catch();
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
        //@ts-ignore
        ownerRef?.current?.resetSelectedValues();
    }

    const showAddQuote = () => {
        return (<>
            <button type="button" className="addQuote" onClick={() => setShowModal(true)} data-tip="Pridaj citát"/>

            {showModal ?
                <>
                    <div className="modalBgr"/>
                    <div className="modalBody">
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
                                <div className="col">
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
                                            setFormData({
                                                ...formData, fromBook: pickedBook
                                                    .map(v => v._id)
                                            })
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
                                <div className="col">
                                    <input type="number" id="pageNo" onChange={handleForm} placeholder="Strana"
                                           className="form-control" autoComplete="off"/>
                                </div>
                            </div>
                            <div style={{height: '5px', width: '100%'}}/>
                            <div className="row">
                                <div className="col">
                                    <Multiselect
                                        options={users}
                                        displayValue="fullName"
                                        placeholder="Vlastník"
                                        closeIcon="cancel"
                                        onSelect={(picked: IUser[]) => {
                                            setFormData({...formData, owner: picked.map(v => v._id)})
                                        }}
                                        style={{
                                            inputField: {marginLeft: "0.5rem"},
                                            searchBox: {
                                                width: "100%",
                                                paddingRight: '5px',
                                                marginRight: '-5px',
                                                borderRadius: '3px'
                                            }
                                        }}
                                        ref={ownerRef}
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
                            <div className="row">
                                {/*<SearchAutocomplete*/}
                                {/*    data={getBooks()}*/}
                                {/*    async={true}*/}
                                {/*    multiple={false}*/}
                                {/*    placeholder="Skuska autocomplete"*/}
                                {/*    searchInAttr="title"*/}
                                {/*    showTable={true}*/}
                                {/*    showAttrInDropdown="title /"*/}
                                {/*    showAttrInTableOrResult="title"*/}
                                {/*/>*/}
                            </div>

                            {showError()}
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary"
                                        onClick={cleanFields}>Vymazať polia
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Zavrieť
                                </button>
                                {/* TODO: add button Save and add another */}
                                <button type="submit"
                                        disabled={Boolean(error)}
                                        className="btn btn-success">Uložiť citát
                                </button>
                                <button type="submit"
                                        disabled={Boolean(error)}
                                        onClick={() => setShowModal(true)}
                                        className="btn btn-success">Uložiť a pridať
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