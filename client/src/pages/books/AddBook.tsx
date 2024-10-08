import React, {useEffect, useRef, useState} from "react";
import {IAutor, IBook, ILangCode, IUser} from "../../type";
import {toast} from "react-toastify";
import {getAutors, getInfoAboutBook, getUsers} from "../../API";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {langCode, countryCode} from "../../utils/locale";
import {Multiselect} from 'multiselect-react-dropdown';
import ChipInput from "material-ui-chip-input";

type Props = {
    saveBook: (e: React.FormEvent, formData: IBook | any) => void;
    open?: boolean;
    bookId?: string | undefined;
}

const multiselectStyle = {
    inputField: {marginLeft: "0.5rem"},
    optionContainer: {
        backgroundColor: "transparent",
    },
    chips: {background: '#00ADB5'},
    option: {color: 'black'},
    multiselectContainer: {maxWidth: '100%'},
};

const AddBook: React.FC<Props> = ({saveBook, open, bookId}) => {
    const [openedModal, setOpenedModal] = useState<boolean>(open || Boolean(bookId));
    const [formData, setFormData] = useState<Partial<IBook>>()
    const [autors, setAutors] = useState<IAutor[] | any>();
    const [users, setUsers] = useState<IUser[] | undefined>();
    const [error, setError] = useState<string | undefined>();
    const [exLibrisValue, setExLibrisValue] = useState(false);
    const autorRef = useRef(null);
    const editorRef = useRef(null);
    const translatorRef = useRef(null);
    const ilustratorRef = useRef(null);
    const langRef = useRef(null);
    const countryRef = useRef(null);
    const ownerRef = useRef(null);
    const readByRef = useRef(null);
    const cityRef = useRef(null);

    //param [] will make useEffect to go only once
    useEffect(() => {
        getAutors()
            .then(aut => {
                //constructing fullName for autocomplete
                setAutors(aut.data.autors.map((aut: IAutor) => ({
                    ...aut,
                    fullName: `${aut.lastName ?? ''}${aut.firstName ? ', ' + aut.firstName : ''}`
                })).sort((a: Partial<IAutor>, b: Partial<IAutor>) => a.fullName!.localeCompare(b.fullName!)));
            })
            .catch(err => {
                toast.error('Nepodarilo sa nacitat autorov!');
                console.error('Couldnt fetch autors', err)
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
        const data = (formData as unknown as IBook);

        //if there is no filled field, its disabled
        if (!data) return;

        if (!(data?.title && data.title.trim().length > 0)) {
            return setError('Názov knihy musí obsahovať aspoň jeden znak!');
        } else if (!isISBNvalid(formData?.ISBN)) {
            return setError("Nevalidné ISBN!");
        } else {
            setError(undefined);
        }
    }, [formData])

    useEffect(() => {
        if (formData?.ISBN && formData?.ISBN?.length > 7) {
            console.log("ISBN changed and long enough")
            getInfoAboutBook(formData.ISBN)
                .then(result => console.log("info about book", result.data))
                .catch(() => {
                    toast.error('Nepodarilo sa nacitat informacie o knihe!');
                });
        }
    }, [formData?.ISBN]);

    useEffect(() => {
        cleanFields();
    }, []);

    const changeExLibris = () => {
        setExLibrisValue(!exLibrisValue);
        setFormData({
            ...formData,
            exLibris: !exLibrisValue
        })
    }

    const handleForm = (e: any): void => {
        setFormData({
            ...formData,
            [e.currentTarget.id]: e.currentTarget.value,
        })
    }

    const showError = () => {
        if (!error) return <></>;
        return (
            <div className="errorAddBook alert alert-danger"><FontAwesomeIcon icon={faExclamationTriangle}/> {error}</div>
        );
    }

    const cleanFields = () => {
        setFormData({});
        //just trust me...
        // @ts-ignore
        autorRef?.current?.resetSelectedValues();
        // @ts-ignore
        langRef?.current?.resetSelectedValues();
        // @ts-ignore
        countryRef?.current?.resetSelectedValues();
        // @ts-ignore
        ownerRef?.current?.resetSelectedValues();
        // @ts-ignore
        readByRef?.current?.resetSelectedValues();
        // @ts-ignore
        cityRef?.current?.resetSelectedValues();
    }

    const isISBNvalid = (isbn: string | undefined) => {
        if (!isbn) return true;

        let sum,
        weight,
        digit,
        check,
        i;

        isbn = isbn.replace(/[^0-9X]/gi, '');

        if (isbn.length < 10) {
            return true; //can't validate older/shorter ISBN, so just assume they are correct
        }

        if (isbn.length === 13) {
            sum = 0;
            for (i = 0; i < 12; i++) {
                digit = parseInt(isbn[i]);
                if (i % 2 === 1) {
                    sum += 3*digit;
                } else {
                    sum += digit;
                }
            }
            check = (10 - (sum % 10)) % 10;
            return (check === parseInt(isbn[isbn.length-1]));
        }

        if (isbn.length === 10) {
            weight = 10;
            sum = 0;
            for (i = 0; i < 9; i++) {
                digit = parseInt(isbn[i]);
                sum += weight*digit;
                weight--;
            }
            check = (11 - (sum % 11)) % 11
            if (check === 10) {
                check = 'X';
            }
            return (check === isbn[isbn.length-1].toUpperCase());
        }

        return false;
    }

    const showAddBook = () => {
        return (
            <>
                <button className="addBtnTable" onClick={() => setOpenedModal(!openedModal)}/>
                {
                    openedModal ?
                        <>
                            <div className="modalBgr"/>
                            <div className="modalBody">
                                <form onSubmit={(e) => {
                                    saveBook(e, formData);
                                    cleanFields();
                                }}>
                                    <div className="container">
                                        <div className="Nazov">
                                            <input
                                                onBlur={handleForm} type='text' id='title' placeholder='*Názov'
                                                className="form-control" autoComplete="off"
                                            />
                                        </div>
                                        <div className="Podnazov">
                                            <input onBlur={handleForm} type='text' id='subtitle'
                                                   placeholder='Podnázov'
                                                   className="form-control" autoComplete="off"
                                            />
                                        </div>
                                        <div className="Autor">
                                            <Multiselect
                                                options={autors}
                                                isObject={true}
                                                displayValue="fullName"
                                                closeOnSelect={true}
                                                placeholder="Autor"
                                                closeIcon="cancel"
                                                emptyRecordMsg="Žiadny autor nenájdený"
                                                onSelect={(pickedAut: IAutor[]) => {
                                                    setFormData({...formData, autor: pickedAut})
                                                }}
                                                style={multiselectStyle}
                                                avoidHighlightFirstOption={true}
                                                ref={autorRef}
                                            />
                                        </div>
                                        <div className="Translator">
                                            <Multiselect
                                                options={autors}
                                                isObject={true}
                                                displayValue="fullName"
                                                closeOnSelect={true}
                                                placeholder="Prekladateľ"
                                                closeIcon="cancel"
                                                emptyRecordMsg="Žiadny autor nenájdený"
                                                onSelect={(pickedAut: IAutor[]) => {
                                                    setFormData({...formData, translator: pickedAut.map(v => v._id)})
                                                }}
                                                style={multiselectStyle}
                                                avoidHighlightFirstOption={true}
                                                ref={translatorRef}
                                            />
                                        </div>
                                        <div className="Editor">
                                            <Multiselect
                                                options={autors}
                                                isObject={true}
                                                displayValue="fullName"
                                                closeOnSelect={true}
                                                placeholder="Editor"
                                                closeIcon="cancel"
                                                emptyRecordMsg="Žiadny autor nenájdený"
                                                onSelect={(pickedAut: IAutor[]) => {
                                                    setFormData({...formData, editor: pickedAut.map(v => v._id)})
                                                }}
                                                style={multiselectStyle}
                                                avoidHighlightFirstOption={true}
                                                ref={editorRef}
                                            />
                                        </div>
                                        <div className="Ilustrator">
                                            <Multiselect
                                                options={autors}
                                                isObject={true}
                                                displayValue="fullName"
                                                closeOnSelect={true}
                                                placeholder="Ilustrátor"
                                                closeIcon="cancel"
                                                emptyRecordMsg="Žiadny autor nenájdený"
                                                onSelect={(pickedAut: IAutor[]) => {
                                                    setFormData({...formData, ilustrator: pickedAut.map(v => v._id)})
                                                }}
                                                style={multiselectStyle}
                                                avoidHighlightFirstOption={true}
                                                ref={ilustratorRef}
                                            />
                                        </div>
                                        <div className="Name">
                                            <input onChange={handleForm} type='text' id='edition.title'
                                                   placeholder='Názov edície'
                                                   className="form-control" autoComplete="off"
                                                   value={formData && "edition.title" in formData ?
                                                       formData["edition.title"] as string : ''}
                                            />
                                        </div>
                                        <div className="No">
                                            <input onChange={handleForm} type='text' id='serie.no'
                                                   placeholder='Číslo edície'
                                                   className="form-control" autoComplete="off"
                                                   value={formData && "serie.no" in formData ?
                                                       formData["serie.no"] as number : ''}
                                            />
                                        </div>
                                        <div className="NameS">
                                            <input onChange={handleForm} type='text' id='serie.title'
                                                   placeholder='Názov série'
                                                   className="form-control" autoComplete="off"
                                                   value={formData && "serie.title" in formData ?
                                                       formData["serie.title"] as string : ''}
                                            />
                                        </div>
                                        <div className="NoS"><input className="form-control" placeholder="Číslo série"/>
                                        </div>
                                        <div className="ISBN">
                                            <input onChange={handleForm} type='text' id='ISBN'
                                                   placeholder='ISBN'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "ISBN" in formData ? formData.ISBN : ''}
                                            /></div>
                                        <div className="Page-no">
                                            <input onChange={handleForm} type='number' id='numberOfPages'
                                                   placeholder='Počet strán'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "numberOfPages" in formData ? formData.numberOfPages : ''}
                                            />
                                        </div>
                                        <div className="Vydavatel">
                                            <input onChange={handleForm} type='text' id='published.publisher'
                                                   placeholder='Vydavateľ'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "published.publisher" in formData ? formData["published.publisher"] as string : ''}
                                            />
                                        </div>
                                        <div className="Rok">
                                            <input onChange={handleForm} type='number' id='published.year'
                                                   placeholder='Rok vydania'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "published.year" in formData ? formData["published.year"] as number : ''}
                                            />
                                        </div>
                                        <div className="Krajina">
                                            <Multiselect
                                                options={countryCode}
                                                displayValue="value"
                                                placeholder="Krajina vydania"
                                                closeIcon="cancel"
                                                onSelect={(picked: ILangCode[]) => {
                                                    setFormData({
                                                        ...formData,
                                                        published: {country: picked.map(v => v.key)[0]}
                                                    })
                                                }}
                                                style={multiselectStyle}
                                                avoidHighlightFirstOption={true}
                                                ref={countryRef}
                                            />
                                        </div>

                                        <div className="Mesto">
                                            <Multiselect
                                                options={[{value: 'spisska', showValue: "Spišská"},
                                                    {value: 'ostrava', showValue: "Ostrava"}]}
                                                displayValue="showValue"
                                                placeholder="Mesto"
                                                closeIcon="cancel"
                                                singleSelect={true}
                                                onSelect={(picked: any[]) => {
                                                    setFormData({
                                                        ...formData,
                                                        location: {
                                                            city: picked.map(v => v.value)[0]
                                                        }
                                                    })
                                                }}
                                                style={multiselectStyle}
                                                avoidHighlightFirstOption={true}
                                                ref={cityRef}
                                            />
                                        </div>
                                        <div className="Police">
                                            <input onBlur={handleForm} type='text' id='location.shelf'
                                                   placeholder='Polica'
                                                   className="form-control"
                                                   autoComplete="off"
                                            />
                                        </div>
                                        <div className="language">
                                            <Multiselect
                                                options={langCode}
                                                displayValue="value"
                                                placeholder="Jazyk"
                                                closeIcon="cancel"
                                                closeOnSelect={true}
                                                onSelect={(picked: ILangCode[]) => {
                                                    setFormData({...formData, language: picked.map(v => v.key)})
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
                                                avoidHighlightFirstOption={true}
                                                ref={langRef}
                                            />
                                        </div>

                                        <div className="Vyska">
                                            <input onChange={handleForm} type='number' id='dimensions.height'
                                                   placeholder='Výška'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "dimensions.height" in formData ? formData["dimensions.height"] as number : ''}
                                            />
                                        </div>
                                        <div className="Sirka">
                                            <input onChange={handleForm} type='number' id='dimensions.width'
                                                   placeholder='Šírka'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "dimensions.width" in formData ? formData["dimensions.width"] as number : ''}
                                            />
                                        </div>
                                        <div className="Hrubka">
                                            <input onChange={handleForm} type='number' id='dimensions.depth'
                                                   placeholder='Hrúbka'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "dimensions.depth" in formData ? formData["dimensions.depth"] as number : ''}
                                            />
                                        </div>
                                        <div className="Hmotnost">
                                            <input onChange={handleForm} type='number' id='dimensions.weight'
                                                   placeholder='Hmotnosť'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "dimensions.weight" in formData ? formData["dimensions.weight"] as number : ''}
                                            />
                                        </div>
                                        <div className="Obsah">
                                            <ChipInput
                                                className="form-control-important"
                                                disableUnderline
                                                defaultValue={[]}
                                                placeholder="Obsah"
                                                onChange={(content: string[]) => {
                                                    setFormData({...formData, content})
                                                }}
                                            />
                                        </div>
                                        <div className="Poznamka">
                                            <textarea onChange={handleForm} id='note' placeholder='Poznámka'
                                                      className="form-control"
                                                      autoComplete="off"
                                                      rows={1}
                                                      value={formData && "note" in formData ? formData.note : ''}
                                            />
                                        </div>
                                        <div className="Precitane">
                                            <Multiselect
                                                options={users}
                                                displayValue="fullName"
                                                placeholder="Prečítané"
                                                closeIcon="cancel"
                                                closeOnSelect={true}
                                                onSelect={(picked: IUser[]) => {
                                                    setFormData({...formData, readBy: picked})
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
                                                avoidHighlightFirstOption={true}
                                                ref={readByRef}
                                            />
                                        </div>

                                        <div className="Vlastnik">
                                            <Multiselect
                                                options={users}
                                                displayValue="fullName"
                                                placeholder="Vlastník"
                                                closeIcon="cancel"
                                                closeOnSelect={true}
                                                onSelect={(picked: IUser[]) => {
                                                    setFormData({...formData, owner: picked})
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
                                                avoidHighlightFirstOption={true}
                                                ref={ownerRef}
                                            />
                                        </div>
                                        <div className="Ex-Libris">
                                            <label><input type="checkbox"
                                                   id="exLibris"
                                                   className="checkBox"
                                                   checked={exLibrisValue}
                                                   onChange={changeExLibris}
                                            />Ex Libris</label>
                                        </div>
                                        <div className="pic">
                                            <input onChange={handleForm} type='text' id='picture'
                                                   placeholder='Obrázok'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "picture" in formData ? formData["picture"] : ''}
                                            />
                                        </div>
                                        <div className="DK">
                                            <input onChange={handleForm} type='text' id='hrefDatabazeKnih'
                                                   placeholder='URL Databáze knih'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "hrefDatabazeKnih" in formData ? formData["hrefDatabazeKnih"] : ''}
                                            />
                                        </div>
                                        <div className="GR">
                                            <input onChange={handleForm} type='text' id='hrefGoodReads'
                                                   placeholder='URL GoodReads'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "hrefGoodReads" in formData ? formData["hrefGoodReads"] : ''}
                                            />
                                        </div>
                                        {showError()}
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary"
                                                onClick={cleanFields}>Vymazať polia
                                        </button>
                                        <button type="button" className="btn btn-secondary"
                                                onClick={() => setOpenedModal(false)}>Zavrieť
                                        </button>
                                        <button type="submit"
                                                disabled={Boolean(error)}
                                                className="btn btn-success">Uložiť knihu
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                        : <></>
                }
            </>
        );
    }

    return (
        <>
            {showAddBook()}
        </>
    )
}

export default AddBook
