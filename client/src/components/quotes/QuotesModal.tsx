import {IBook, IQuote, IUser, ValidationError} from "../../type";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {getBooks, getUsers} from "../../API";
import {toast} from "react-toastify";
import {showError} from "../Modal";
import {Multiselect} from "multiselect-react-dropdown";
import ToggleButton from "../ToggleButton";
import {getCssPropertyValue} from "../../utils/utils";
import {countryCode} from "../../utils/locale";
import {InputField, MultiselectField} from "../InputFields";

interface BodyProps {
    data: IQuote | Object;
    onChange: (data: IQuote | Object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedQuote?: IQuote;
}

interface ButtonsProps {
    saveQuote: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
}

export const QuotesModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [isText, setIsText] = useState<boolean>(true);
    const [formData, setFormData] = useState<IQuote | any>(data);
    const [books, setBooks] = useState<IBook[]>();
    const [users, setUsers] = useState<IUser[] | undefined>();
    const [errors, setErrors] = useState<ValidationError[]>([{label: 'Text citátu musí obsahovať aspoň jeden znak!', target: 'text'}]);

    useEffect(() => {
        onChange(formData)
    }, [formData]);

    useEffect(() => {
        setFormData(data);
    }, [data]);

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
                    .filter((book: IBook) => !book.deletedAt)
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
        }).catch(err => console.trace("Error while fetching Users", err));

        // if (id) {
        //     setShowModal(true);
        //     getQuote(id).then(quote => {
        //         const currentQuote = quote.data.quote;
        //         setFormData({
        //             _id: currentQuote?._id,
        //             text: currentQuote?.text || undefined,
        //             fromBook: currentQuote?.fromBook || undefined,
        //             pageNo: currentQuote?.pageNo || undefined,
        //             owner: currentQuote?.owner || undefined,
        //             note: currentQuote?.note || undefined
        //         });
        //     })
        //         .catch(err => console.trace("Error while fetching Quotes", err));
        // }
    }, [])

    //ERROR HANDLING
    useEffect(() => {
        const data = (formData as unknown as IQuote);
        if (!data || !Object.keys(data).length) return;

        let localErrors: ValidationError[] = [];

        if (!("text" in data && data?.text?.trim().length > 0)) {
            localErrors.push({label: 'Text citátu musí obsahovať aspoň jeden znak!', target: "title"});
        } else {
            localErrors = localErrors?.filter((err: ValidationError) => err.target !== "title") ?? localErrors;
        }

        if (!data?.fromBook) {
            localErrors.push({label: 'Musí byť vybraná kniha!', target: "fromBook"});
        } else {
            localErrors = localErrors?.filter((err: ValidationError) => err.target !== "fromBook") ?? localErrors;
        }

        setErrors(localErrors);
        error(localErrors)
    }, [formData])

    const handleInputChange = useCallback((input: any) => {
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

    return (<form>
        <div className="row">
            <div className="col-12">
                {isText ? <textarea id='note' placeholder='*Text'
                                    className="form-control"
                                    name="text"
                                    autoComplete="off"
                                    value={formData?.text || ""}
                                    onChange={handleInputChange}
                                    aria-errormessage={getErrorMsg('text')}
                    /> :
                    <label className="btn btn-dark">
                        <i className="fa fa-image"/> Nahraj obrázky
                        <input type="file" style={{display: "none"}} name="image" accept="image/*"/>
                    </label>
                }
            </div>
        </div>
        <div style={{height: '5px', width: '100%'}}/>
        <div className="row">
            <div className="col-4">
                <ToggleButton labelLeft="Text" labelRight="Obrázok"
                              state={() => setIsText(!isText)}/>
            </div>
            <div className="col-5">
                <MultiselectField
                    selectionLimit={1}
                    options={books}
                    displayValue="title"
                    label="*Z knihy"
                    value={formData?.fromBook}
                    name="fromBook"
                    onChange={handleInputChange}
                />
            </div>
            <div className="col-3">
                <InputField
                    value={formData?.pageNo || ""}
                    placeholder='Strana'
                    name="pageNo"
                    onChange={handleInputChange}
                />
            </div>
        </div>
        <div style={{height: '5px', width: '100%'}}/>
        <div className="row">
            <div className="col">
                <MultiselectField
                    options={users}
                    displayValue="fullName"
                    label="Vlastník"
                    value={formData?.owner}
                    name="owner"
                    onChange={handleInputChange}
                />
            </div>
        </div>
        <div style={{height: '5px', width: '100%'}}/>
        <div className="row">
            <div className="col">
                <textarea id='note' placeholder='Poznámka'
                          className="form-control"
                          name="note"
                          autoComplete="off"
                          rows={1}
                          value={formData?.note || ""}
                          onChange={handleInputChange}
                />
            </div>
        </div>
    </form>)
}

export const QuotesModalButtons = ({saveQuote, cleanFields, error}: ButtonsProps) => {
    return (<div className="column">
        <div>{showError(error)}</div>

        <div className="buttons">
            <button type="button" className="btn btn-secondary"
                    onClick={cleanFields}>Vymazať polia
            </button>
            <button type="submit"
                    disabled={Boolean(error?.length)}
                    onClick={saveQuote}
                    className="btn btn-success">Uložiť citát
            </button>
        </div>
    </div>)
}