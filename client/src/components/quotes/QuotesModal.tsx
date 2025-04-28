import {IQuote, ValidationError} from "../../type";
import React, {useCallback, useEffect, useState} from "react";
import {showError} from "../Modal";
import {InputField, LazyLoadMultiselect} from "@components/inputs";
import {Wysiwyg} from "../Wysiwyg";
import {fetchBooks, fetchUsers, formPersonsFullName} from "@utils";

interface BodyProps {
    data: IQuote | object;
    onChange: (data: IQuote | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedQuote?: IQuote;
}

interface ButtonsProps {
    saveQuote: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
    saveResultSuccess?: boolean;
}

export const QuotesModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [formData, setFormData] = useState<IQuote | any>(data);
    const [errors, setErrors] = useState<ValidationError[]>([
        {label: "Text citátu musí obsahovať aspoň jeden znak!", target: "text"},
        {label: "Musí byť vybraná kniha!", target: "fromBook"}
    ]);

    useEffect(() => {
        onChange(formData)
    }, [formData]);

    // clear form btn
    useEffect(() => {
        if (!data) return;
        if (Object.keys(data).length === 0 && data.constructor === Object) setFormData(data);
    }, [data]);

    // edit
    useEffect(() => {
        if (!data) return;

        const typedData = data as IQuote;
        const enrichedData = {
            ...typedData,
            fromBook: typedData.fromBook ? [{
                ...typedData.fromBook, showName: `${typedData.fromBook.title} 
					${typedData.fromBook.autor && typedData.fromBook.autor[0] && typedData.fromBook.autor[0].firstName ? "/ " + typedData.fromBook.autor[0].firstName : ""} 
					${typedData.fromBook.autor && typedData.fromBook.autor[0] && typedData.fromBook.autor[0].lastName ? typedData.fromBook.autor[0].lastName : ""} 
					${typedData.fromBook.published && typedData.fromBook.published?.year ? "/ " + typedData.fromBook.published?.year : ""}`
            }] : [],
            owner: formPersonsFullName((data as IQuote)?.owner)
        };
        setFormData(enrichedData);
    }, []);

    //ERROR HANDLING
    useEffect(() => {
        const data = (formData as unknown as IQuote);

        let localErrors: ValidationError[] = [];

        if (!(data?.text?.trim().length > 0)) {
            localErrors.push({label: "Text citátu musí obsahovať aspoň jeden znak!", target: "text"});
        } else {
            localErrors = localErrors?.filter((err: ValidationError) => err.target !== "text") ?? localErrors;
        }

        if (!data?.fromBook) {
            localErrors.push({label: "Musí byť vybraná kniha!", target: "fromBook"});
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

            const keys = name.split("."); // Split name into keys
            const updatedData = {...prevData}; // Clone previous data
            setNestedValue(updatedData, keys, value); // Set nested value

            return updatedData;
        });
    }, []);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    }

    return (<form>
        {/* WYSIWYG editor - full width */}
        <div className="full-width">
            <Wysiwyg
                id="modalWysiwygText"
                value={formData?.text}
                onChange={handleInputChange}
                name="text"
                customerror={getErrorMsg("text")}
            />
        </div>

        {/* Book and page number - special ratio of 3:1 */}
        <div className="book-page-row">
            <div>
                <LazyLoadMultiselect
                    value={formData?.fromBook}
                    displayValue="showName"
                    onChange={handleInputChange}
                    name="fromBook"
                    placeholder="*Z knihy"
                    onSearch={fetchBooks}
                    //customerror={getErrorMsg("fromBook")}
                />
            </div>
            <div>
                <InputField
                    value={formData?.pageNo || ""}
                    placeholder='Strana'
                    name="pageNo"
                    onChange={handleInputChange}
                />
            </div>
        </div>

        {/* Owner field - full width */}
        <div className="full-width">
            <LazyLoadMultiselect
                value={formData?.owner || []}
                displayValue="fullName"
                placeholder="Vlastník"
                onChange={handleInputChange}
                name="owner"
                onSearch={fetchUsers}
            />
        </div>

        {/* Note field - full width */}
        <div className="full-width">
            <textarea
                id='note'
                placeholder='Poznámka'
                className="form-control"
                name="note"
                autoComplete="off"
                rows={1}
                value={formData?.note || ""}
                onChange={handleInputChange}
            />
        </div>
    </form>)
}

export const QuotesModalButtons = ({saveQuote, cleanFields, error, saveResultSuccess}: ButtonsProps) => {
    const [loadingResult, setLoadingResult] = useState<boolean | undefined>(false);

    useEffect(() => {
        if (saveResultSuccess !== undefined && loadingResult) {
            setLoadingResult(false);
        }
    }, [saveResultSuccess, loadingResult]);

    const saveQuoteHandler = useCallback(() => {
        setLoadingResult(true);
        saveQuote();
    }, [saveQuote]);

    return (<div className="column">
        <div>{showError(error)}</div>

        <div className="buttons">
            <button type="button" className="btn btn-secondary"
                    onClick={cleanFields}>Vymazať polia
            </button>
            <button type="submit"
                    disabled={Boolean(error?.length)}
                    onClick={saveQuoteHandler}
                    className="btn btn-success">Uložiť citát
            </button>
        </div>
    </div>)
}