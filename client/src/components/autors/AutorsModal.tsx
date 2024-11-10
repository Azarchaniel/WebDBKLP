import React, {useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import DatePicker, {registerLocale} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import cs from 'date-fns/locale/cs';
import {countryCode} from "../../utils/locale";
import {Multiselect} from 'multiselect-react-dropdown';
import {IAutor, ILangCode} from "../../type";

//for datepicker
registerLocale('cs', cs)

interface BodyProps {
    data: IAutor | Object;
    onChange: (data: IAutor | Object) => void;
    error: (err: string | undefined) => void;
    editedAutor?: IAutor;
}

interface ButtonsProps {
    saveAutor: () => void;
    cleanFields: () => void;
    error?: string | undefined;
}

export const AutorsModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [formData, setFormData] = useState<IAutor | Object>(data);
    const countryRef = useRef(null);

    useEffect(() => {
        onChange(formData)
    }, [formData]);

    useEffect(() => {
        setFormData(data);
    }, [data]);

    useEffect(() => {
        //shortcut
        const data = (formData as unknown as IAutor);

        //if there is no filled field, its disabled
        if (!data) return;

        //if length is over 0, its OK
        const autorLength = data.lastName?.trim().length > 0;
        if (!autorLength) {
            error('Priezvisko autora musí obsahovať aspoň jeden znak!');
            return;
        } else {
            error(undefined);
        }

        //if there is no dates, return oposite of autorLength
        if (!(data.dateOfBirth && data.dateOfDeath)) {
            error(undefined);
            return;
        }
        //if dateOfBirth is sooner, its OK
        const dates = data.dateOfBirth! < data.dateOfDeath!;

        //name is ok, dates nok
        if (autorLength && !dates) error('Dátum smrti nemôže byť skôr, než dátum narodenia!');
    }, [formData]);

    const handleForm = (e: any): void => {
        try {
            setFormData({
                ...formData,
                [e?.currentTarget.id]: e?.currentTarget.value
            })
        } catch (err) {
            toast.error('Chyba pri zadávaní do formuláru!')
            console.error('AddAutor(handleForm)', err)
        }
    }

    const isValidDate = (varToCheck: unknown) => {
        return varToCheck instanceof Date && !isNaN(varToCheck.valueOf());
    }

    return (
        <form>
            <div className="row">
                <div className="col">
                    <input type="text" onChange={handleForm} className="form-control"
                           id='firstName'
                           value={(formData as IAutor)?.firstName || ''}
                           placeholder="Krstné meno"/>
                </div>
                <div className="col">
                    <input type="text" onChange={handleForm} className="form-control"
                           id='lastName'
                           value={(formData as IAutor)?.lastName || ''}
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
                    <textarea onChange={handleForm} className="form-control" id='note'
                              placeholder="Poznámka"/>
                </div>
            </div>
        </form>
    )
}

export const AutorsModalButtons = ({saveAutor, cleanFields, error}: ButtonsProps) => {
    const showError = () => {
        if (!error) return <></>;
        return (
            <div className="alert alert-danger"><FontAwesomeIcon icon={faExclamationTriangle}/> {error}</div>
        );
    }

    return (
        <div className="column">
            <div>{showError()}</div>

            <div className="buttons">
                <button type="button" className="btn btn-secondary"
                        onClick={cleanFields}>Vymazať polia
                </button>
                <button type="button"
                        disabled={Boolean(error)}
                        onClick={saveAutor}
                        className="btn btn-success">Uložiť autora
                </button>
            </div>

        </div>
    )
}