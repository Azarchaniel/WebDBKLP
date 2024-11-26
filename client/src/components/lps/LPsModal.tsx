import React, {useCallback, useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import {registerLocale} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import cs from 'date-fns/locale/cs';
import {countryCode, langCode} from "../../utils/locale";
import {Multiselect} from 'multiselect-react-dropdown';
import {IAutor, ILangCode, ILP, ValidationError} from "../../type";
import {getAutors} from "../../API";
import {showError} from "../Modal";
import {formPersonsFullName} from "../../utils/utils";
import {InputField} from "../InputFields";

//for datepicker
registerLocale('cs', cs)

interface BodyProps {
    data: ILP | Object;
    onChange: (data: ILP | Object) => void;
    error: (err: string | undefined) => void;
    editedLP?: ILP;
}

interface ButtonsProps {
    saveLP: () => void;
    cleanFields: () => void;
    error?: string | undefined;
}

export const LPsModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [formData, setFormData] = useState<ILP | Object>(data);
    const [autors, setAutors] = useState<IAutor[] | []>([]);
    const [errors, setErrors] = useState<ValidationError[]>([{label: 'Názov LP musí obsahovať aspoň jeden znak!', target: 'title'}]);

    const autorRef = useRef(null);
    const langRef = useRef(null);
    const countryRef = useRef(null);

    useEffect(() => {
        onChange(formData)
    }, [formData]);

    useEffect(() => {
        if (!data) return;
        if (Object.keys(data).length === 0 && data.constructor === Object) setFormData(data);
    }, [data]);

    //edit LP
    useEffect(() => {
        if (!data) return;

        const toBeModified: ILP = {
            ...data,
            autor: formPersonsFullName((data as ILP)?.autor),
            published: {country: countryCode.find((country: ILangCode) => ((data as ILP)?.published?.country as unknown as string[])?.includes(country.key))},
            language: langCode.filter((lang: ILangCode) => ((data as ILP)?.language as unknown as string[])?.includes(lang.key))
        } as ILP;

        setFormData(toBeModified);
    }, []);

    useEffect(() => {
        getAutors()
            .then(aut => {
                //TODO: move to BE
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

    //error handling
    useEffect(() => {
        //shortcut
        const data = (formData as unknown as ILP);

        //if there is no filled field, its disabled
        if (!data) return;

        if (data?.title && data.title.trim().length > 0) {
            error(undefined);
        } else {
            error('Názov LP musí obsahovať aspoň jeden znak!')
        }
    }, [formData])

    const handleInputChange = useCallback((input) => {
        console.log(input);
        let name: string, value: string;

        if ("target" in input) { // if it is a regular event
            const {name: targetName, value: targetValue} = input.target;
            name = targetName;
            value = targetValue;
        } else { // if it is MultiSelect custom answer
            name = input.name;
            value = input.value;
        }

        setFormData((prevData: any) => {
            // Helper function to create a nested object structure
            const setNestedValue = (obj: any, keys: string[], value: any) => {
                const key = keys.shift(); // Get the first key
                if (!key) return value; // If no more keys, return the value
                obj[key] = setNestedValue(obj[key] || {}, keys, value); // Recursively set the nested value
                return obj;
            };

            const keys = name.split('.'); // Split name into keys
            const updatedData = {...prevData}; // Clone previous data
            setNestedValue(updatedData, keys, value); // Set nested value

            return updatedData;
        });
    }, []);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    }

    return (
        <form>
            <div className="row">
                <div className="col">
                    <InputField
                        value={(formData as ILP)?.title || ""}
                        placeholder='*Názov'
                        name="title"
                        onChange={handleInputChange}
                        customerror={getErrorMsg("title")}
                    />
                </div>
                <div className="col">
                    <input onChange={handleInputChange} type='text' id='subtitle'
                           placeholder='Podnázov'
                           className="form-control"
                           autoComplete="off"
                           value={(formData as ILP)?.subtitle || ""}
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
                    <input onChange={handleInputChange} type='text' id='edition.title'
                           placeholder='Názov edície'
                           className="form-control" autoComplete="off"
                           value={(formData as ILP)?.edition?.title || ""}
                    />
                </div>
                <div className="col">
                    <input onChange={handleInputChange} type='number' id='edition.no'
                           placeholder='Číslo edice'
                           className="form-control"
                           autoComplete="off"
                           min="0"
                           value={(formData as ILP)?.edition?.no || ""}
                    />
                </div>
            </div>
            <div style={{height: '5px', width: '100%'}}/>
            <div className="row">
                <div className="col">
                    <input onChange={handleInputChange} type='number' id='speed' placeholder='Počet otáčok'
                           className="form-control" autoComplete="off" min="0"
                           value={(formData as ILP)?.speed || ""}
                    />
                </div>
                <div className="col">
                    <input onChange={handleInputChange} type='number' id='countLp' placeholder='Počet platní'
                           className="form-control" autoComplete="off" min="0"
                           value={(formData as ILP)?.countLp || ""}
                    />
                </div>
            </div>
            <div style={{height: '5px', width: '100%'}}/>
            <div className="row">
                <div className="col">
                    <input onChange={handleInputChange} type='number' id='published.year'
                           placeholder='Rok vydania'
                           className="form-control"
                           autoComplete="off"
                           value={(formData as ILP)?.published?.year || ""}
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
                    <input onChange={handleInputChange} type='text' id='published.publisher'
                           placeholder='Vydavateľ'
                           className="form-control"
                           autoComplete="off"
                           value={(formData as ILP)?.published?.publisher || ""}
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
        </form>
    );
}

export const LPsModalButtons: React.FC<ButtonsProps> = ({saveLP, cleanFields, error}: ButtonsProps) => {
    return (
        <div className="column">
            <div>{showError(error)}</div>

            <div className="buttons">
                <button type="button" className="btn btn-secondary"
                        onClick={cleanFields}>Vymazať polia
                </button>
                <button type="submit"
                        disabled={Boolean(error)}
                        onClick={saveLP}
                        className="btn btn-success">Uložiť LP
                </button>
            </div>
        </div>
    )
}