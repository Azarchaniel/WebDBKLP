import React, {useEffect, useState} from "react";
import {IBook, ILangCode} from "../type";
import {IAutor} from "../../../server/src/types";
import {toast} from "react-toastify";
import {getAutors} from "../API";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {langCode} from "../utils/locale";
//@ts-ignore
import {Multiselect} from 'multiselect-react-dropdown';

type Props = {
    saveBook: (e: React.FormEvent, formData: IBook | any) => void
}

const AddBook: React.FC<Props> = ({saveBook}) => {
    const [formData, setFormData] = useState<IBook | {}>()
    const [autors, setAutors] = useState<IAutor[] | any>();
    const [error, setError] = useState<string | undefined>('Názov knihy musí obsahovať aspoň jeden znak!');

    //param [] will make useEffect to go only once
    useEffect(() => {
        getAutors()
            .then(aut => {
                //constructing fullName for autocomplete
                setAutors(aut.data.autors.map((aut: IAutor) => ({
                    ...aut,
                    fullName: `${aut.lastName}, ${aut.firstName}`
                })));
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

        if (data?.title && data.title.trim().length > 1) {
            setError(undefined);
        } else {
            setError('Názov knihy musí obsahovať aspoň jeden znak!')
        }

    }, [formData])

    useEffect(() => {
        setFormData({});
    }, []);

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
                                                   className="form-control" autoComplete="off"/>
                                        </div>
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='subtitle'
                                                   placeholder='Podnázov'
                                                   className="form-control"
                                                   autoComplete="off"/>
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
                                            onChange={handleForm}
                                            onSelect={(pickedAut: IAutor[]) => {
                                                setFormData({...formData, autor: pickedAut.map(v => v._id)})
                                            }}
                                            style={{
                                                inputField: {marginLeft: "0.5rem"},
                                                searchBox: {borderRadius: '3px', maxWidth: '94%', marginLeft: '15px'},
                                                optionContainer: {maxWidth: '94%', marginLeft: '15px'}
                                            }}
                                        />
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>

                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='ISBN' placeholder='ISBN'
                                                   className="form-control"
                                                   autoComplete="off"/>
                                        </div>
                                        <div className="col">
                                            <Multiselect
                                                options={langCode}
                                                displayValue="value"
                                                placeholder="Jazyk"
                                                closeIcon="cancel"
                                                onChange={handleForm}
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
                                            />
                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='number' id='numberOfPages' placeholder='Počet strán'
                                                   className="form-control"
                                                   autoComplete="off"/>
                                        </div>
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='published.publisher' placeholder='Vydavateľ'
                                                   className="form-control"
                                                   autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='published.country' placeholder='Krajina vydania'
                                                   className="form-control"
                                                   autoComplete="off"
                                            />
                                        </div>
                                        <div className="col">
                                            <input onChange={handleForm} type='number' id='published.year' placeholder='Rok vydania'
                                                   className="form-control"
                                                   autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    <div className="row">
                                        <div className="col">
                                            <input onChange={handleForm} type='text' id='note' placeholder='Poznámka'
                                                   className="form-control"
                                                   autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                    <div style={{height: '5px', width: '100%'}}/>
                                    {showError()}
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" data-dismiss="modal">Zavrieť
                                        </button>
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
