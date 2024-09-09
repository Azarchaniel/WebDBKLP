import {IAutor, ILangCode, ILP} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {Multiselect} from "multiselect-react-dropdown";
import {getAutors} from "../../API";
import {countryCode, langCode} from "../../utils/locale";

type Props = {
    saveLp: (e: React.FormEvent, formData: ILP | any) => void
}

const AddLp: React.FC<Props> = ({saveLp}: { saveLp: any }) => {
    const [formData, setFormData] = useState<ILP | {}>();
    const [autors, setAutors] = useState<IAutor[] | any>();
    const [error, setError] = useState<string | undefined>(undefined);
    const autorRef = useRef(null);
    const langRef = useRef(null);
    const countryRef = useRef(null);

    useEffect(() => {
        //shortcut
        const data = (formData as unknown as ILP);

        //if there is no filled field, its disabled
        if (!data) return;

        if (data?.title && data.title.trim().length > 0) {
            setError(undefined);
        } else {
            setError('Názov LP musí obsahovať aspoň jeden znak!')
        }
    }, [formData])

    useEffect(() => {
        getAutors()
            .then(aut => {
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

    const handleForm = (e: any): void => {
        try {
            setFormData({
                ...formData,
                [e?.currentTarget.id]: e?.currentTarget.value
            })
        } catch (err) {
            toast.error('Chyba pri zadávaní do formuláru!')
            console.error('AddLp(handleForm)', err)
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
        autorRef?.current?.resetSelectedValues();
        // @ts-ignore
        langRef?.current?.resetSelectedValues();
        // @ts-ignore
        countryRef?.current?.resetSelectedValues();
    }

    const showAddLp = () => {
        return (<>
            <button type="button" className="addBtnTable" data-toggle="modal" data-target="#quoteModal"/>

            <div className="modal fade" id="quoteModal" tabIndex={-1} role="dialog"
                 aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel"><b>Pridať LP</b></h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => {
                                saveLp(e, formData);
                                cleanFields();
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
                                        emptyRecordMsg="Žiadny autori nenájdení"
                                        selectionLimit={1}
                                        onSelect={(pickedAut: IAutor[]) => {
                                            setFormData({
                                                ...formData, autor: pickedAut
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
                                        ref={autorRef}
                                    />
                                </div>
                                <div style={{height: '5px', width: '100%'}}/>
                                <div className="row">
                                    <div className="col">
                                        <input onChange={handleForm} type='text' id='edition.title'
                                               placeholder='Názov edície'
                                               className="form-control" autoComplete="off"
                                               value={formData && "edition.title" in formData ? formData["edition.title"] as string : ''}
                                        />
                                    </div>
                                    <div className="col">
                                        <input onChange={handleForm} type='number' id='edition.no'
                                               placeholder='Číslo edice'
                                               className="form-control"
                                               autoComplete="off"
                                               min="0"
                                               value={formData && "edition.no" in formData ? formData["edition.no"] as number : ''}
                                        />
                                    </div>
                                </div>
                                <div style={{height: '5px', width: '100%'}}/>
                                <div className="row">
                                    <div className="col">
                                        <input onChange={handleForm} type='number' id='speed' placeholder='Počet otáčok'
                                               className="form-control" autoComplete="off" min="0"
                                               value={formData && "speed" in formData ? formData.speed : ''}
                                        />
                                    </div>
                                    <div className="col">
                                        <input onChange={handleForm} type='number' id='countLp' placeholder='Počet platní'
                                               className="form-control" autoComplete="off" min="0"
                                               value={formData && "countLp" in formData ? formData.countLp : ''}
                                        />
                                    </div>
                                </div>
                                <div style={{height: '5px', width: '100%'}}/>
                                <div className="row">
                                    <div className="col">
                                        <input onChange={handleForm} type='number' id='published.year'
                                               placeholder='Rok vydania'
                                               className="form-control"
                                               autoComplete="off"
                                               value={formData && "published.year" in formData ? formData["published.year"] as number : ''}
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
                                        <input onChange={handleForm} type='text' id='published.publisher'
                                               placeholder='Vydavateľ'
                                               className="form-control"
                                               autoComplete="off"
                                               value={formData && "published.publisher" in formData ? formData["published.publisher"] as string : ''}
                                        />
                                    </div>
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
                                </div>
                                <div style={{height: '5px', width: '100%'}}/>
                                {showError()}
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary"
                                            onClick={cleanFields}>Vymazať polia
                                    </button>
                                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Zavrieť
                                    </button>
                                    <button type="submit"
                                            disabled={Boolean(error)}
                                            className="btn btn-success">Uložiť LP
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
            {showAddLp()}
        </>
    );
}

export default AddLp;