import {IAutor, IBook, IUser} from "../../type";
import React, {useCallback, useEffect, useState} from "react";
import {getAutors, getUsers} from "../../API";
import {toast} from "react-toastify";
import {checkIsbnValidity} from "../../utils/utils";
import {countryCode, langCode} from "../../utils/locale";
import ChipInput from "material-ui-chip-input";
import {showError} from "../Modal";
import {InputField, MultiselectField} from "../InputFields";

//TODO: generalize with generics <T>
interface BodyProps {
    data: IBook | Object;
    onChange: (data: IBook | Object) => void;
    error: (err: string | undefined) => void;
    editedLP?: IBook;
}

interface ButtonsProps {
    saveBook: () => void;
    cleanFields: () => void;
    error?: string | undefined;
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

export const BooksModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [formData, setFormData] = useState(data as any);
    const [autors, setAutors] = useState<IAutor[] | []>();
    const [users, setUsers] = useState<IUser[] | undefined>();

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    useEffect(() => {
        //TODO: move filtering to backend; start fetching at third char
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
    }, [])

    useEffect(() => {
        //if there is no filled field, its disabled
        if (!formData) return;

        if (!("title" in formData && formData?.title.trim().length > 0)) {
            return error('Názov knihy musí obsahovať aspoň jeden znak!');
        } else if ("ISBN" in formData && !checkIsbnValidity(formData?.ISBN)) {
            return error("Nevalidné ISBN!");
        } else {
            error(undefined);
        }
    }, [formData])

    const handleInputChange = useCallback((input) => {
        let name: string, value: string;

        if ("target" in input) { //if it is regular event
            const { name: targetName, value: targetValue } = input.target;
            name = targetName;
            value = targetValue;
        } else { //if it is MultiSelect custom answer
            name = input.name;
            value = input.value;
        }
        console.log(name, value);
        setFormData((prevData: any) => ({ ...prevData, [name]: value }));
    }, []);

    return (<form>
        <div className="container">
            <div className="Nazov">
                <InputField
                    value={formData?.title}
                    label='*Názov'
                    name="title"
                    onChange={handleInputChange}
                />
            </div>
            <div className="Podnazov">
                <InputField
                    value={formData?.subtitle}
                    label='Podnázov'
                    name="subtitle"
                    onChange={handleInputChange}
                />
            </div>
            <div className="Autor">
                <MultiselectField
                    options={autors}
                    displayValue="fullName"
                    label="Autor"
                    value={formData?.autor}
                    name="autor"
                    onChange={handleInputChange}
                    emptyRecordMsg="Žiadny autor nenájdený"
                />
            </div>
            <div className="ISBN">
                <InputField
                    value={formData?.ISBN}
                    label='ISBN'
                    name="ISBN"
                    onChange={handleInputChange}
                />
            </div>
            <div className="Translator">
                <MultiselectField
                    options={autors}
                    displayValue="fullName"
                    label="Prekladateľ"
                    value={formData?.translator}
                    name="translator"
                    onChange={handleInputChange}
                    emptyRecordMsg="Žiadny autor nenájdený"
                />
            </div>
            <div className="Editor">
                <MultiselectField
                    options={autors}
                    displayValue="fullName"
                    label="Editor"
                    value={formData?.editor}
                    name="editor"
                    onChange={handleInputChange}
                    emptyRecordMsg="Žiadny autor nenájdený"
                />
            </div>
            <div className="Ilustrator">
                <MultiselectField
                    options={autors}
                    displayValue="fullName"
                    label="Ilustrátor"
                    value={formData?.ilustrator}
                    name="ilustrator"
                    onChange={handleInputChange}
                    emptyRecordMsg="Žiadny autor nenájdený"
                />
            </div>
            <div className="Name">
                <InputField
                    value={formData?.edition?.title}
                    label='Názov edície'
                    name="edition.title"
                    onChange={handleInputChange}
                />
            </div>
            <div className="No">
                <InputField
                    value={formData?.edition?.no}
                    label='Číslo edície'
                    name="edition.no"
                    onChange={handleInputChange}
                />
            </div>
            <div className="NameS">
                <InputField
                    value={formData?.serie?.title}
                    label='Názov série'
                    name="serie.title"
                    onChange={handleInputChange}
                />
            </div>
            <div className="NoS">
                <InputField
                    value={formData?.serie?.no}
                    label='Číslo série'
                    name="serie.no"
                    onChange={handleInputChange}
                />
            </div>
            <div className="Vydavatel">
                <InputField
                    value={formData?.published?.publisher}
                    label='Vydavateľ'
                    name="published.publisher"
                    onChange={handleInputChange}
                />
            </div>
            <div className="Rok">
                <InputField
                    value={formData?.published?.year}
                    label='Rok vydania'
                    name="published.year"
                    onChange={handleInputChange}
                    type='number'
                />
            </div>
            <div className="Krajina">
                <MultiselectField
                    options={countryCode}
                    displayValue="value"
                    label="Krajina vydania"
                    value={formData?.published?.country}
                    name="published.country"
                    onChange={handleInputChange}
                />
            </div>

            <div className="Mesto">
                <MultiselectField
                    options={[{value: 'spisska', showValue: "Spišská"},
                        {value: 'bruchotin', showValue: "Břuchotín"}]}
                    displayValue="showValue"
                    label="Mesto"
                    value={formData?.location?.city}
                    name="location.city"
                    onChange={handleInputChange}
                />
            </div>
            <div className="Police">
                <InputField
                    value={formData?.location?.shelf}
                    label='Polica'
                    name="location.shelf"
                    onChange={handleInputChange}
                />
            </div>
            <div className="language">
                <MultiselectField
                    options={langCode}
                    displayValue="value"
                    label="Jazyk"
                    value={formData?.language}
                    name="language"
                    onChange={handleInputChange}
                />
            </div>

            <div className="Vyska">
                <InputField
                    value={formData?.dimensions?.height}
                    label='Výška (cm)'
                    name="dimensions.height"
                    onChange={handleInputChange}
                    type='number'
                />
            </div>
            <div className="Sirka">
                <InputField
                    value={formData?.dimensions?.width}
                    label='Šírka (cm)'
                    name="dimensions.width"
                    onChange={handleInputChange}
                    type='number'
                />
            </div>
            <div className="Hrubka">
                <InputField
                    value={formData?.dimensions?.depth}
                    label='Hrúbka (cm)'
                    name="dimensions.depth"
                    onChange={handleInputChange}
                    type='number'
                />
            </div>
            <div className="Hmotnost">
                <InputField
                    value={formData?.dimensions?.weight}
                    label='Hmotnosť (g)'
                    name="dimensions.weight"
                    onChange={handleInputChange}
                    type='number'
                />
            </div>
            <div className="Page-no">
                <InputField
                    value={formData?.numberOfPages}
                    label='Počet strán'
                    name="numberOfPages"
                    onChange={handleInputChange}
                    type='number'
                />
            </div>
            <div className="Obsah">
                <ChipInput
                    className="form-control-important"
                    disableUnderline
                    placeholder="Obsah"
                    value={formData?.content}
                    onChange={(values) => handleInputChange({name: "content", value: values})}
                />
            </div>
            <div className="Poznamka">
                                            <textarea id='note' placeholder='Poznámka'
                                                      className="form-control"
                                                      name="note"
                                                      autoComplete="off"
                                                      rows={1}
                                                      value={formData?.note}
                                                      onChange={handleInputChange}
                                            />
            </div>
            <div className="Precitane">
                <MultiselectField
                    options={users}
                    displayValue="fullName"
                    label="Prečítané"
                    value={formData?.readBy}
                    name="readBy"
                    onChange={handleInputChange}
                />
            </div>

            <div className="Vlastnik">
                <MultiselectField
                    options={users}
                    displayValue="fullName"
                    label="Vlastník"
                    value={formData?.owner}
                    name="owner"
                    onChange={handleInputChange}
                />
            </div>
            <div className="Ex-Libris">
                <label><input type="checkbox"
                              id="exLibris"
                              className="checkBox"
                              value={formData?.exLibris}
                              onChange={(e) => handleInputChange({name: "exLibris", value: e.target.checked})}
                />Ex Libris</label>
            </div>
            <div className="pic">
                <InputField
                    value={formData?.picture}
                    label='Obrázok'
                    name="picture"
                    onChange={handleInputChange}
                />
            </div>
            <div className="DK">
                <InputField
                    value={formData?.hrefDatabazeKnih}
                    label='URL Databáze knih'
                    name="hrefDatabazeKnih"
                    onChange={handleInputChange}
                />
            </div>
            <div className="GR">
                <InputField
                    value={formData?.hrefGoodReads}
                    label='URL GoodReads'
                    name="hrefGoodReads"
                    onChange={handleInputChange}
                />
            </div>
        </div>
    </form>)
}

export const BooksModalButtons: React.FC<ButtonsProps> = ({saveBook, cleanFields, error}) => {
    return (
        <div className="column">
            <div>{showError(error)}</div>

            <div className="buttons">
                <button type="button" className="btn btn-secondary"
                        onClick={cleanFields}>Vymazať polia
                </button>
                <button type="submit"
                        disabled={Boolean(error)}
                        onClick={saveBook}
                        className="btn btn-success">Uložiť knihu
                </button>
            </div>
        </div>
    )
}