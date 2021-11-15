import DatePicker, {registerLocale} from "react-datepicker";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {toast} from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import React, {useEffect, useRef, useState} from "react";
import {IAutor} from "../../../server/src/types";
import cs from 'date-fns/locale/cs';
import {countryCode} from "../utils/locale";
//@ts-ignore
import {Multiselect} from 'multiselect-react-dropdown';
import {ILangCode} from "../type";

//for datepicker
registerLocale('cs', cs)

type Props = {
    saveAutor: (e: React.FormEvent, formData: IAutor | any) => void
}

const AddAutor: React.FC<Props> = ({saveAutor}: { saveAutor: any }) => {
    const [formData, setFormData] = useState<IAutor | {}>();
    const [error, setError] = useState<string | undefined>(
        'Priezvisko autora musí obsahovať aspoň jeden znak!'
    );
    const countryRef = useRef(null);

    useEffect(() => {
        //shortcut
        const data = (formData as unknown as IAutor);

        //if there is no filled field, its disabled
        if (!data) return;

        //if length is over 0, its OK
        const autorLength = data.lastName?.trim().length > 0;
        if (!autorLength) {
            setError('Priezvisko autora musí obsahovať aspoň jeden znak!');
            return;
        } else {
            setError(undefined);
        }

        //if there is no dates, return oposite of autorLength
        if (!(data.dateOfBirth && data.dateOfDeath)) {
            setError(undefined);
            return;
        }
        //if dateOfBirth is sooner, its OK
        const dates = data.dateOfBirth! < data.dateOfDeath!;

        //name is ok, dates nok
        if (autorLength && !dates) setError('Dátum smrti nemôže byť skôr, než dátum narodenia!');
    }, [formData])

    useEffect(() => {
        cleanFields();
    }, []);

    const handleForm = (e: any): void => {
        try {
            setFormData({
                ...formData,
                [e?.currentTarget.id]: e?.currentTarget.value
            })
            console.trace(formData);
        } catch (err) {
            toast.error('Chyba pri zadávaní do formuláru!')
            console.error('AddAutor(handleForm)', err)
        }
    }

    const showError = () => {
        if (!error) return <></>;
        return (
            <div className="alert alert-danger"><FontAwesomeIcon icon={faExclamationTriangle}/> {error}</div>
        );
    }

    const isValidDate = (varToCheck: unknown) => {
        return varToCheck instanceof Date && !isNaN(varToCheck.valueOf());
    }

    const cleanFields = () => {
        setFormData({});
        //@ts-ignore
        countryRef?.current?.resetSelectedValues();
    }

    const showAddAutor = () => {
        return (
            <>
                <button type="button" className="btn btn-dark" data-toggle="modal" data-target="#autorModal">
                    Pridaj autora
                </button>

                <div className="modal fade" id="autorModal" tabIndex={-1} role="dialog"
                     aria-labelledby="autorModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="autorModalLabel"><b>Pridať autora</b></h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={(e) => {
                                    saveAutor(e, formData)
                                }}>
                                    <div className="row">
                                        <div className="col">
                                            <input type="text" onChange={handleForm} className="form-control"
                                                   id='firstName'
                                                   placeholder="Krstné meno"/>
                                        </div>
                                        <div className="col">
                                            <input type="text" onChange={handleForm} className="form-control"
                                                   id='lastName'
                                                   placeholder="*Priezvisko"/>
                                        </div>
                                    </div>

                                    <div style={{height: '5px', width: '100%'}}/>

                                    <div className="row">
                                        <div className="col">
                                            <DatePicker
                                                className="form-control"
                                                id='dateOfBirth'
                                                selected={(formData as IAutor)?.dateOfBirth}
                                                onChange={(dateOfBirth: Date) => setFormData({
                                                    ...formData,
                                                    dateOfBirth
                                                })}
                                                onSelect={(dateOfBirth: Date) => setFormData({
                                                    ...formData,
                                                    dateOfBirth
                                                })}
                                                locale="cs"
                                                dateFormat='dd.MM.yyyy'
                                                placeholderText={'Dátum narodenia'}
                                                maxDate={new Date()}
                                            />
                                            {isValidDate(formData && 'dateOfBirth' in formData ? formData?.dateOfBirth : false) ?
                                                <button className='clearInput' type="button" onClick={() => {
                                                    setFormData({...formData, dateOfBirth: undefined})
                                                }}>&#10006;
                                                </button> : <></>}
                                        </div>
                                        <div className="col">
                                            <DatePicker
                                                className="form-control"
                                                id='dateOfDeath'
                                                selected={(formData as IAutor)?.dateOfDeath}
                                                onChange={(dateOfDeath: Date) => setFormData({
                                                    ...formData,
                                                    dateOfDeath
                                                })}
                                                onSelect={(dateOfDeath: Date) => setFormData({
                                                    ...formData,
                                                    dateOfDeath
                                                })}
                                                locale="cs"
                                                dateFormat='dd.MM.yyyy'
                                                placeholderText={'Dátum smrti'}
                                                maxDate={new Date()}
                                            />
                                            {isValidDate(formData && 'dateOfDeath' in formData ? formData?.dateOfDeath : false) ?
                                                <button className='clearInput' type="button" onClick={() => {
                                                    setFormData({...formData, dateOfDeath: undefined})
                                                }}>&#10006;
                                                </button> : <></>}
                                        </div>
                                    </div>

                                    <div style={{height: '5px', width: '100%'}}/>

                                    <div className="row">
                                        <div className="col">
                                            <Multiselect
                                                selectionLimit={1}
                                                closeOnSelect={true}
                                                options={countryCode}
                                                displayValue="value"
                                                placeholder="Národnosť"
                                                closeIcon="cancel"
                                                onSelect={(picked: ILangCode[]) => {
                                                    setFormData({...formData, nationality: picked[0].key})
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
                                        <div className="col">
                                            <input type="text" onChange={handleForm} className="form-control" id='note'
                                                   placeholder="Poznámka"/>
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
                                                className="btn btn-success">Uložiť autora
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
            {showAddAutor()}
        </>
    )
}

export default AddAutor
