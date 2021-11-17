import React, {useEffect, useRef, useState} from "react";
import {IAutor, IBook, ILangCode} from "../type";
import {toast} from "react-toastify";
import {getAutors} from "../API";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {langCode, countryCode} from "../utils/locale";
//@ts-ignore
import {Multiselect} from 'multiselect-react-dropdown';

type Props = {
    saveBook: (e: React.FormEvent, formData: IBook | any) => void
}

const AddBook: React.FC<Props> = ({saveBook}) => {
    const [formData, setFormData] = useState<IBook | {}>()
    const [autors, setAutors] = useState<IAutor[] | any>();
    const [error, setError] = useState<string | undefined>('Názov knihy musí obsahovať aspoň jeden znak!');
    const [exLibrisValue, setExLibrisValue] = useState(false);
    const autorRef = useRef(null);
    const langRef = useRef(null);
    const countryRef = useRef(null);

    //param [] will make useEffect to go only once
    useEffect(() => {
        getAutors()
            .then(aut => {
                //constructing fullName for autocomplete
                setAutors(aut.data.autors.map((aut: IAutor) => ({
                    ...aut,
                    fullName: `${aut.lastName}, ${aut.firstName}`
                })).sort((a: Partial<IAutor>, b: Partial<IAutor>) => a.fullName!.localeCompare(b.fullName!)));
            })
            .catch(err => {
                toast.error('Nepodarilo sa nacitat autorov!');
                console.error('Couldnt fetch autors', err)
            });
    }, [formData])

    useEffect(() => {
        //shortcut
        const data = (formData as unknown as IBook);

        //if there is no filled field, its disabled
        if (!data) return;

        if (data?.title && data.title.trim().length > 0) {
            setError(undefined);
        } else {
            setError('Názov knihy musí obsahovať aspoň jeden znak!')
        }

        /*if (data?.numberOfPages && typeof data?.numberOfPages === 'number') {
            setError(undefined);
        } else {
            setError('Počet strán musí byť číslo!');
        }*/
    }, [formData])

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
            <div className="alert alert-danger"><FontAwesomeIcon icon={faExclamationTriangle}/> {error}</div>
        );
    }

    const cleanFields = () => {
        setFormData({});
        //@ts-ignore
        autorRef?.current?.resetSelectedValues();
        //@ts-ignore
        langRef?.current?.resetSelectedValues();
        //@ts-ignore
        countryRef?.current?.resetSelectedValues();
    }

    const showAddBook = () => {
        return (
            <>
                <button type="button" className="btn btn-dark" data-toggle="modal" data-target="#bookModal">
                    Pridaj knihu
                </button>

                <div className="modal fade" id="bookModal" tabIndex={-1} role="dialog"
                     aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel"><b>Pridať knihu</b></h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={(e) => {
                                    saveBook(e, formData)
                                }}>
                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='title' placeholder='*Názov'
                                                   className="form-control" autoComplete="off"
                                                   value={formData && "title" in formData ? formData.title : ''}/>
                                        </div>
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='subtitle'
                                                   placeholder='Podnázov'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "subtitle" in formData ? formData.subtitle : ''}
                                            />
                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <Multiselect
                                            options={autors}
                                            isObject={true}
                                            displayValue="fullName"
                                            closeOnSelect={true}
                                            placeholder="Autor"
                                            closeIcon="cancel"
                                            emptyRecordMsg="Žiadny autor nenájdený"
                                            onSelect={(pickedAut: IAutor[]) => {
                                                setFormData({...formData, autor: pickedAut.map(v => v._id)})
                                            }}
                                            style={{
                                                inputField: {marginLeft: "0.5rem"},
                                                optionContainer: {
                                                    backgroundColor: "transparent",
                                                },
                                                option: {},
                                                multiselectContainer: {maxWidth: '100%'},
                                            }}
                                            ref={autorRef}
                                        />
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>

                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='ISBN' placeholder='ISBN'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "ISBN" in formData ? formData.ISBN : ''}
                                            />
                                        </div>
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='published.publisher'
                                                   placeholder='Vydavateľ'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "published.publisher" in formData ? formData["published.publisher"] : ''}
                                            />
                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='number' id='numberOfPages'
                                                   placeholder='Počet strán'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "numberOfPages" in formData ? formData.numberOfPages : ''}
                                            />
                                        </div>
                                        <div className="col">
                                            <input onChange={handleForm} type='number' id='published.year'
                                                   placeholder='Rok vydania'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "published.year" in formData ? formData["published.year"] : ''}
                                            />

                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <div className="col">
                                            <Multiselect
                                                options={langCode}
                                                displayValue="value"
                                                placeholder="Jazyk"
                                                closeIcon="cancel"
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
                                                ref={langRef}
                                            />

                                        </div>
                                        <div className="col">
                                            <Multiselect
                                                options={countryCode}
                                                displayValue="value"
                                                placeholder="Krajina vydania"
                                                closeIcon="cancel"
                                                onSelect={(picked: ILangCode[]) => {
                                                    setFormData({
                                                        ...formData,
                                                        "published.country": picked.map(v => v.key)
                                                    })
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
                                                ref={countryRef}
                                            />

                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='note' placeholder='Poznámka'
                                                   className="form-control"
                                                   autoComplete="off"
                                                   value={formData && "note" in formData ? formData.note : ''}
                                            />
                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <div className="col">
                                            <input type="checkbox"
                                                   id="exLibris"
                                                   className="checkBox"
                                                   checked={exLibrisValue}
                                                   onChange={changeExLibris}
                                            />Ex Libris
                                        </div>
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
                                                className="btn btn-success">Uložiť knihu
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
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
