import React, {useCallback, useEffect, useState} from "react";
import "react-datepicker/dist/react-datepicker.css";
import {countryCode, langCode, fetchAutors, formPersonsFullName, getPublishedCountry} from "@utils";
import {ILangCode, ILP, ValidationError} from "../../type";
import {showError} from "../Modal";
import {InputField, LazyLoadMultiselect} from "@components/inputs";
import "@styles/LpPage.scss";
import LoadingSpinner from "@components/LoadingSpinner";

interface BodyProps {
    data: ILP | object;
    onChange: (data: ILP | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: ILP;
}

interface ButtonsProps {
    saveLP: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
    saveResultSuccess?: boolean;
}

export const LPsModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [formData, setFormData] = useState(data as any);
    const [errors, setErrors] = useState<ValidationError[]>([{
        label: "Názov LP musí obsahovať aspoň jeden znak!",
        target: "title"
    }]);

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

        const country = getPublishedCountry((data as ILP)?.published?.country);

        const toBeModified: ILP = {
            ...data,
            autor: formPersonsFullName((data as ILP)?.autor),
            published: {...(data as ILP)?.published, country: country ? [country] : []},
            language: langCode.filter((lang: ILangCode) => ((data as ILP)?.language as unknown as string[])?.includes(lang.key))
        } as ILP;

        setFormData(toBeModified);
    }, []);

    //error handling
    useEffect(() => {
        //shortcut
        const data = (formData as unknown as ILP);

        //if there is no filled field, its disabled
        if (!data) return;

        let localErrors: ValidationError[] = [];

        if (!(data?.title && data.title.trim().length > 0)) {
            localErrors.push({label: "Názov musí obsahovať aspoň jeden znak!", target: "title"});
        } else {
            localErrors = localErrors?.filter((err: ValidationError) => err.target !== "title") ?? localErrors;
        }

        error(localErrors);
        setErrors(localErrors);
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

    return (
        <form className="l-form-grid">
            <div className="l-title">
                <InputField
                    value={(formData as ILP)?.title || ""}
                    placeholder='*Názov'
                    name="title"
                    onChange={handleInputChange}
                    customerror={getErrorMsg("title")}
                />
            </div>

            <div className="l-subtitle">
                <InputField
                    value={(formData as ILP)?.subtitle || ""}
                    placeholder='Podnázov'
                    name="subtitle"
                    onChange={handleInputChange}
                />
            </div>

            <div className="l-autor">
                <LazyLoadMultiselect
                    value={formData?.autor || []}
                    displayValue="fullName"
                    placeholder="Autor"
                    onChange={handleInputChange}
                    name="autor"
                    onSearch={fetchAutors}
                />
            </div>

            <div className="l-speed">
                <InputField
                    value={(formData as ILP)?.speed || ""}
                    placeholder='Počet otáčok'
                    name="speed"
                    onChange={handleInputChange}
                />
            </div>

            <div className="l-countLp">
                <InputField
                    value={(formData as ILP)?.countLp || ""}
                    placeholder='Počet platní'
                    name="countLp"
                    onChange={handleInputChange}
                />
            </div>

            <div className="l-year">
                <InputField
                    value={(formData as ILP)?.published?.year || ""}
                    placeholder='Rok vydania'
                    name='published.year'
                    onChange={handleInputChange}
                />
            </div>

            <div className="l-country">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    value={formData?.published?.country}
                    options={countryCode}
                    displayValue="value"
                    placeholder="Krajina vydania"
                    onChange={(data) => {
                        setFormData({
                            ...formData,
                            "published.country": data.value.map(v => (v as any).key)
                        })
                    }}
                    name="published.country"
                />
            </div>

            <div className="l-publisher">
                <InputField
                    value={(formData as ILP)?.published?.publisher || ""}
                    placeholder='Vydavateľ'
                    name='published.publisher'
                    onChange={handleInputChange}
                />
            </div>

            <div className="l-language">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    value={formData?.language || []}
                    options={countryCode}
                    displayValue="value"
                    placeholder="Jazyk"
                    onChange={handleInputChange}
                    name="language"
                />
            </div>

            <div className="l-note">
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
        </form>
    );
}

export const LPsModalButtons: React.FC<ButtonsProps> = ({saveLP, cleanFields, error, saveResultSuccess}: ButtonsProps) => {
    const [loadingResult, setLoadingResult] = useState<boolean>(false);

    useEffect(() => {
        if (saveResultSuccess !== undefined && loadingResult) setLoadingResult(false);
    }, [saveResultSuccess]);

    const saveLpHandler = useCallback(() => {
        setLoadingResult(true);
        saveLP();
    }, [saveLP]);

    return (
        <div className="column">
            <div>{showError(error)}</div>

            <div className="buttons">
                <button type="button" className="btn btn-secondary"
                        onClick={cleanFields}>Vymazať polia
                </button>
                <button type="submit"
                        disabled={Boolean(error?.length) || loadingResult}
                        onClick={saveLpHandler}
                        className="btn btn-success">
                    {loadingResult ? <LoadingSpinner color="white" size={50} marginTop={1}/> : "Uložiť"}
                </button>
            </div>
        </div>
    )
}