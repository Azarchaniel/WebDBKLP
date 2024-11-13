import {IAutor, IBook, ILangCode, ILP, IUser} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {getAutors, getUsers} from "../../API";
import {toast} from "react-toastify";
import {checkIsbnValidity} from "../../utils/utils";
import {Multiselect} from "multiselect-react-dropdown";
import {countryCode, langCode} from "../../utils/locale";
import ChipInput from "material-ui-chip-input";
import {showError} from "../Modal";

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
    const [formData, setFormData] = useState<IBook | Object>(data)
    const [autors, setAutors] = useState<IAutor[] | []>();
    const [users, setUsers] = useState<IUser[] | undefined>();
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

    useEffect(() => {
        onChange(formData)
    }, [formData]);

    useEffect(() => {
        setFormData(data);
    }, [data]);

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

        if (!("title" in formData && formData.title.trim().length > 0)) {
            return error('Názov knihy musí obsahovať aspoň jeden znak!');
        } else if ("ISBN" in formData && !checkIsbnValidity(formData?.ISBN)) {
            return error("Nevalidné ISBN!");
        } else {
            error(undefined);
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
            console.error('AddLP(handleForm)', err)
        }
    }

    const changeExLibris = () => {
        setExLibrisValue(!exLibrisValue);
        setFormData({
            ...formData,
            exLibris: !exLibrisValue
        })
    }

    return (<form>
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
                       value={formData && "ISBN" in formData ? formData.ISBN as string : ''}
                /></div>
            <div className="Page-no">
                <input onChange={handleForm} type='number' id='numberOfPages'
                       placeholder='Počet strán'
                       className="form-control"
                       autoComplete="off"
                       value={formData && "numberOfPages" in formData ? formData.numberOfPages as number: ''}
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
                    selectionLimit={1}
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
                    style={multiselectStyle}
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
                                                      value={formData && "note" in formData ? formData.note as string : ''}
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
                    style={multiselectStyle}
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
                    style={multiselectStyle}
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
                       value={formData && "picture" in formData ? formData["picture"] as string : ''}
                />
            </div>
            <div className="DK">
                <input onChange={handleForm} type='text' id='hrefDatabazeKnih'
                       placeholder='URL Databáze knih'
                       className="form-control"
                       autoComplete="off"
                       value={formData && "hrefDatabazeKnih" in formData ? formData["hrefDatabazeKnih"] as string : ''}
                />
            </div>
            <div className="GR">
                <input onChange={handleForm} type='text' id='hrefGoodReads'
                       placeholder='URL GoodReads'
                       className="form-control"
                       autoComplete="off"
                       value={formData && "hrefGoodReads" in formData ? formData["hrefGoodReads"] as string : ''}
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